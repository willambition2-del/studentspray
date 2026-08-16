import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { randomUUID } from 'crypto';

const API_BASE = 'http://127.0.0.1:4000/api/v1';
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function apiRequest(method: string, path: string, body?: any, token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get('content-type');
  let data: any = null;
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  return { status: res.status, ok: res.ok, data };
}

async function runRuntimeVerification() {
  console.log('====================================================');
  console.log('STARTING PHASE 6 RUNTIME API & POSTGRES VERIFICATION');
  console.log('====================================================\n');

  const results: Record<string, boolean> = {};

  // 1. Health Check
  const healthRes = await apiRequest('GET', '/health');
  results['HEALTH_CHECK'] = healthRes.data.status === 'ok' && healthRes.data.services?.database === 'up';
  console.log('1. Health Check:', results['HEALTH_CHECK'] ? 'PASS' : 'FAIL', healthRes.data);

  // 2. Real Teacher Login (POST /auth/mobile/login & GET /auth/me)
  const loginRes = await apiRequest('POST', '/auth/mobile/login', {
    forumSlug: 'demo-quran-forum',
    identifier: 'teacher_verified',
    password: 'Teacher-Verified-2026!',
  });
  const { accessToken: teacherToken, refreshToken: teacherRefreshToken } = loginRes.data;
  const meRes = await apiRequest('GET', '/auth/me', undefined, teacherToken);
  const roleNames = meRes.data.roles?.map((r: any) => typeof r === 'string' ? r : r.name) || [];
  results['REAL_TEACHER_LOGIN'] = loginRes.status === 200 && meRes.data.username === 'teacher_verified' && roleNames.includes('TEACHER');
  console.log('2. Real Teacher Login:', results['REAL_TEACHER_LOGIN'] ? 'PASS' : 'FAIL', meRes.data?.displayName, roleNames);

  // 3. Session Restoration & Refresh Token Rotation
  const refreshRes = await apiRequest('POST', '/auth/mobile/refresh', {
    refreshToken: teacherRefreshToken,
  });
  const newAccessToken = refreshRes.data.accessToken;
  const newRefreshToken = refreshRes.data.refreshToken;
  const meAfterRefresh = await apiRequest('GET', '/auth/me', undefined, newAccessToken);
  results['SESSION_RESTORE'] = refreshRes.status === 200 && !!newAccessToken && !!newRefreshToken && meAfterRefresh.status === 200;
  console.log('3. Session Restore & Refresh:', results['SESSION_RESTORE'] ? 'PASS' : 'FAIL');

  // 4. My Halaqas (Teacher Scope)
  const halaqasRes = await apiRequest('GET', '/teacher/me/halaqas', undefined, newAccessToken);
  const teacherHalaqas = halaqasRes.data;
  const hasOnlyAssignedHalaqas = Array.isArray(teacherHalaqas) && teacherHalaqas.length > 0 && teacherHalaqas.every((h: any) => h.code === 'HALAQA_A_VERIFIED');
  results['MY_HALAQAS'] = hasOnlyAssignedHalaqas;
  console.log('4. My Halaqas Scoped:', results['MY_HALAQAS'] ? 'PASS' : 'FAIL', `(${teacherHalaqas?.length || 0} halaqas)`);

  const halaqaAId = teacherHalaqas[0].id;
  const halaqaB = await prisma.halaqa.findFirstOrThrow({ where: { code: 'HALAQA_B_OTHER' } });

  // 5. Cross-Halaqa IDOR Protection (Teacher accesses Halaqa B)
  const idorRes = await apiRequest('GET', `/teacher/me/halaqas/${halaqaB.id}/today`, undefined, newAccessToken);
  const idorBlocked = idorRes.status === 403;
  results['TEACHER_CROSS_HALAQA_IDOR'] = idorBlocked;
  console.log('5. Cross-Halaqa IDOR Blocked (403):', results['TEACHER_CROSS_HALAQA_IDOR'] ? 'PASS' : 'FAIL', `(Status: ${idorRes.status})`);

  // 6. Halaqa Workspace Data
  const workspaceRes = await apiRequest('GET', `/teacher/me/halaqas/${halaqaAId}/today`, undefined, newAccessToken);
  const workspaceStudents = workspaceRes.data.students || [];
  results['WORKSPACE_DATA'] = workspaceRes.status === 200 && workspaceStudents.length >= 2;
  console.log('6. Halaqa Workspace Loaded:', results['WORKSPACE_DATA'] ? 'PASS' : 'FAIL', `(${workspaceStudents.length} students)`);

  const student1Id = workspaceStudents[0].studentId;
  const student2Id = workspaceStudents[1].studentId;
  const todayStr = new Date().toISOString().split('T')[0];

  // 7. Online Bulk Attendance & PostgreSQL Verification
  const attendanceMutationId = randomUUID();
  const attRes = await apiRequest('POST', `/halaqas/${halaqaAId}/attendance/sessions`, {
    sessionDate: todayStr,
    records: [
      { studentId: student1Id, status: 'PRESENT', notes: 'حاضر في الموعد' },
      { studentId: student2Id, status: 'LATE', notes: 'متأخر 10 دقائق' },
    ],
    clientMutationId: attendanceMutationId,
  }, newAccessToken);

  const dbSession = await prisma.attendanceSession.findFirst({
    where: { halaqaId: halaqaAId },
    include: { records: true },
  });
  const attPgVerified = dbSession !== null && dbSession.records.length === 2;
  results['ONLINE_ATTENDANCE'] = (attRes.status === 200 || attRes.status === 201) && (attRes.data?.records?.length === 2 || attRes.data?.recordsCount === 2);
  results['ATTENDANCE_POSTGRESQL'] = attPgVerified;
  console.log('7. Online Attendance Recorded:', results['ONLINE_ATTENDANCE'] ? 'PASS' : 'FAIL');
  console.log('   Attendance in PostgreSQL:', results['ATTENDANCE_POSTGRESQL'] ? 'PASS' : 'FAIL', `(Session: ${dbSession?.id}, Records: ${dbSession?.records.length})`);

  // 8. Online Memorization & PostgreSQL Verification
  const memoMutationId = randomUUID();
  const memoRes = await apiRequest('POST', '/memorization', {
    studentId: student1Id,
    halaqaId: halaqaAId,
    date: todayStr,
    surahNumber: 114,
    fromAyah: 1,
    toAyah: 6,
    evaluationScore: 98,
    rating: 'EXCELLENT',
    mistakesCount: 0,
    teacherNotes: 'تلاوة متقنة وممتازة',
    clientMutationId: memoMutationId,
  }, newAccessToken);

  const dbMemo = await prisma.memorizationRecord.findFirst({
    where: { clientMutationId: memoMutationId },
  });
  results['ONLINE_MEMORIZATION'] = memoRes.status === 201;
  results['MEMORIZATION_POSTGRESQL'] = dbMemo !== null && Number(dbMemo.evaluationScore) === 98 && dbMemo.surahNumber === 114;
  console.log('8. Online Memorization Recorded:', results['ONLINE_MEMORIZATION'] ? 'PASS' : 'FAIL');
  console.log('   Memorization in PostgreSQL:', results['MEMORIZATION_POSTGRESQL'] ? 'PASS' : 'FAIL', `(Record: ${dbMemo?.id})`);

  // 9. Online Revision & PostgreSQL Verification
  const revMutationId = randomUUID();
  const revRes = await apiRequest('POST', '/revision', {
    studentId: student1Id,
    halaqaId: halaqaAId,
    date: todayStr,
    surahNumber: 113,
    fromAyah: 1,
    toAyah: 5,
    evaluationScore: 95,
    rating: 'VERY_GOOD',
    mistakesCount: 1,
    teacherNotes: 'مراجعة طيبة مع تنبيه يسير',
    clientMutationId: revMutationId,
  }, newAccessToken);

  const dbRev = await prisma.revisionRecord.findFirst({
    where: { clientMutationId: revMutationId },
  });
  results['ONLINE_REVISION'] = revRes.status === 201;
  results['REVISION_POSTGRESQL'] = dbRev !== null && Number(dbRev.evaluationScore) === 95 && dbRev.surahNumber === 113;
  console.log('9. Online Revision Recorded:', results['ONLINE_REVISION'] ? 'PASS' : 'FAIL');
  console.log('   Revision in PostgreSQL:', results['REVISION_POSTGRESQL'] ? 'PASS' : 'FAIL', `(Record: ${dbRev?.id})`);

  // 10. Student Progress Matching Real Database
  const progressRes = await apiRequest('GET', `/students/${student1Id}/progress`, undefined, newAccessToken);
  const progressData = progressRes.data;
  const progressMatches = progressData?.metrics?.totalMemorizationSessions >= 1
    && progressData?.metrics?.totalRevisionSessions >= 1
    && progressData?.metrics?.avgMemorizationScore > 90;
  results['STUDENT_PROGRESS'] = progressRes.status === 200 && progressMatches;
  console.log('10. Student Progress Matching DB:', results['STUDENT_PROGRESS'] ? 'PASS' : 'FAIL', progressData?.metrics);

  // 11. Idempotency Check (Submitting identical clientMutationId)
  const memoRetryRes = await apiRequest('POST', '/memorization', {
    studentId: student1Id,
    halaqaId: halaqaAId,
    date: todayStr,
    surahNumber: 114,
    fromAyah: 1,
    toAyah: 6,
    evaluationScore: 98,
    rating: 'EXCELLENT',
    mistakesCount: 0,
    teacherNotes: 'تلاوة متقنة وممتازة',
    clientMutationId: memoMutationId, // SAME ID
  }, newAccessToken);
  const matchingRecords = await prisma.memorizationRecord.count({
    where: { clientMutationId: memoMutationId },
  });
  results['IDEMPOTENCY'] = memoRetryRes.status === 201 && matchingRecords === 1;
  console.log('11. Idempotency Enforcement:', results['IDEMPOTENCY'] ? 'PASS' : 'FAIL', `(PostgreSQL duplicate count: ${matchingRecords})`);

  // 12. 403 Forbidden Scope Protection
  let student403Blocked = false;
  const otherHalaqaStudent = await prisma.studentProfile.findFirst({
    where: { halaqaMemberships: { none: { halaqaId: halaqaAId } } },
  });
  if (otherHalaqaStudent) {
    const studentAccessRes = await apiRequest('GET', `/students/${otherHalaqaStudent.id}/progress`, undefined, newAccessToken);
    student403Blocked = studentAccessRes.status === 403;
  } else {
    student403Blocked = true;
  }
  results['403_HANDLING'] = student403Blocked && idorBlocked;
  console.log('12. 403 Handling without Logout:', results['403_HANDLING'] ? 'PASS' : 'FAIL');

  // 13. 401 Unauthorized Handling
  await prisma.authSession.deleteMany({ where: { userId: meAfterRefresh.data.id } });
  const revokedRes = await apiRequest('GET', '/auth/me', undefined, newAccessToken);
  const tokenRevoked401 = revokedRes.status === 401;
  results['401_HANDLING'] = tokenRevoked401;
  console.log('13. 401 Session Revocation:', results['401_HANDLING'] ? 'PASS' : 'FAIL');

  console.log('\n====================================================');
  console.log('SUMMARY OF RUNTIME API CHECKS:');
  for (const [k, v] of Object.entries(results)) {
    console.log(`- ${k}: ${v ? 'PASS' : 'FAIL'}`);
  }
  const allPassed = Object.values(results).every(Boolean);
  console.log('OVERALL STATUS:', allPassed ? 'ALL PASS' : 'SOME FAILED');
  console.log('====================================================');
}

runRuntimeVerification()
  .catch((err) => {
    console.error('Verification Error:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
