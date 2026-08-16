/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-explicit-any */
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PasswordService } from '../src/auth/password.service';
import { PrismaService } from '../src/database/prisma.service';
import { normalizeUsername } from '../src/auth/utils/identifier';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PERMISSION_CATALOG } from '../src/authorization/permission-catalog';

describe('Exams, Grades & Evaluations Engine (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;

  const run = Date.now();
  const slug = `phase8-test-forum-${run}`;
  const password = 'Test-Password-2026!';

  let forumId: string;
  let branchId: string;
  let gmToken: string;
  let teacherToken: string;
  let studentAToken: string;
  let parentToken: string;

  let halaqaAId: string;
  let studentAProfileId: string;
  let studentBProfileId: string;
  let studentCProfileId: string;
  let examId: string;

  const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    passwords = app.get(PasswordService);

    // 1. Forum & Branch
    const forum = await prisma.forum.create({
      data: { name: `Phase 8 Forum ${run}`, slug },
    });
    forumId = forum.id;

    const branch = await prisma.branch.create({
      data: { forumId, name: 'Main Branch', code: 'MAIN' },
    });
    branchId = branch.id;

    // 2. Roles & Permissions
    const gmRole = await prisma.role.create({
      data: { forumId, name: 'GENERAL_MANAGER', displayName: 'General Manager', isSystem: true },
    });
    const teacherRole = await prisma.role.create({
      data: { forumId, name: 'TEACHER', displayName: 'المعلم', isSystem: true },
    });
    const studentRole = await prisma.role.create({
      data: { forumId, name: 'STUDENT', displayName: 'الطالب', isSystem: true },
    });
    const parentRole = await prisma.role.create({
      data: { forumId, name: 'PARENT', displayName: 'ولي الأمر', isSystem: true },
    });

    for (const code of Object.keys(PERMISSION_CATALOG)) {
      const permission = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: code },
      });
      // GM gets all
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: gmRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: gmRole.id, permissionId: permission.id },
      });
      // Teacher
      if ([
        'students.read', 'halaqas.read', 'exams.read', 'grades.read', 'grades.write',
        'student_evaluations.read', 'student_evaluations.write', 'attendance.read', 'memorization.read',
      ].includes(code)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: teacherRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: teacherRole.id, permissionId: permission.id },
        });
      }
      // Student
      if (['exams.read', 'grades.read', 'student_evaluations.read', 'student_progress.read', 'attendance.read', 'memorization.read', 'educational_plans.read'].includes(code)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: studentRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: studentRole.id, permissionId: permission.id },
        });
      }
      // Parent
      if (['students.read', 'exams.read', 'grades.read', 'student_evaluations.read', 'student_progress.read', 'attendance.read', 'memorization.read', 'educational_plans.read'].includes(code)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: parentRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: parentRole.id, permissionId: permission.id },
        });
      }
    }

    const hash = await passwords.hashPassword(password);

    const createUserWithRole = async (username: string, roleId: string, displayName: string) => {
      const u = await prisma.user.create({
        data: {
          forumId,
          branchId,
          username,
          usernameNormalized: normalizeUsername(username),
          displayName,
          passwordHash: hash,
          isActive: true,
          roles: { create: { roleId, branchId } },
        },
      });
      return u;
    };

    const loginUser = async (identifier: string) => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/mobile/login')
        .send({ forumSlug: slug, identifier, password })
        .expect(HttpStatus.OK);
      return res.body.accessToken as string;
    };

    // 3. Create Users
    const gmUser = await createUserWithRole(`gm_${run}`, gmRole.id, 'مدير النظام');
    const teacherUser = await createUserWithRole(`tch_${run}`, teacherRole.id, 'أستاذ الحلقة');
    const stuAUser = await createUserWithRole(`stu_a_${run}`, studentRole.id, 'الطالب أحمد');
    const stuBUser = await createUserWithRole(`stu_b_${run}`, studentRole.id, 'الطالب بلال');
    const stuCUser = await createUserWithRole(`stu_c_${run}`, studentRole.id, 'الطالب عمر الخارجي');
    const parentUser = await createUserWithRole(`par_${run}`, parentRole.id, 'ولي أمر أحمد');

    // 4. Create Profiles
    const tchProfile = await prisma.teacherProfile.create({ data: { userId: teacherUser.id } });
    const stuAProfile = await prisma.studentProfile.create({ data: { userId: stuAUser.id, studentNumber: `ST-A-${run}` } });
    const stuBProfile = await prisma.studentProfile.create({ data: { userId: stuBUser.id, studentNumber: `ST-B-${run}` } });
    const stuCProfile = await prisma.studentProfile.create({ data: { userId: stuCUser.id, studentNumber: `ST-C-${run}` } });
    const parProfile = await prisma.parentProfile.create({ data: { userId: parentUser.id } });

    studentAProfileId = stuAProfile.id;
    studentBProfileId = stuBProfile.id;
    studentCProfileId = stuCProfile.id;

    // Link Parent to Student A ONLY
    await prisma.studentGuardian.create({
      data: { parentId: parProfile.id, studentId: stuAProfile.id, isPrimary: true },
    });

    // 5. Create Halaqa and assign Teacher & Students
    const halaqa = await prisma.halaqa.create({
      data: { forumId, branchId, name: 'حلقة النور', code: `HAL_${run}` },
    });
    halaqaAId = halaqa.id;

    await prisma.halaqaTeacher.create({
      data: { halaqaId: halaqa.id, teacherId: tchProfile.id, isActive: true },
    });
    await prisma.halaqaMember.createMany({
      data: [
        { halaqaId: halaqa.id, studentId: stuAProfile.id, isActive: true },
        { halaqaId: halaqa.id, studentId: stuBProfile.id, isActive: true },
      ],
    });

    // 6. Acquire JWT Tokens
    gmToken = await loginUser(gmUser.username);
    teacherToken = await loginUser(teacherUser.username);
    studentAToken = await loginUser(stuAUser.username);
    await loginUser(stuBUser.username);
    parentToken = await loginUser(parentUser.username);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('1. Exam Creation & Validation', () => {
    it('creates an exam with criteria and maximum score', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set(bearer(gmToken))
        .send({
          title: 'اختبار الحفظ الشهري الأول',
          description: 'تقييم حفظ سورة البقرة وتطبيق أحكام التجويد',
          examType: 'MONTHLY',
          maxScore: 100,
          passScore: 60,
          halaqaId: halaqaAId,
          criteria: [
            { name: 'جودة الحفظ وسلامة الأداء', maxScore: 60, order: 1 },
            { name: 'أحكام التجويد ومخارج الحروف', maxScore: 40, order: 2 },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(res.body.title).toBe('اختبار الحفظ الشهري الأول');
      expect(res.body.criteria).toHaveLength(2);
      expect(res.body.isPublished).toBe(false);

      examId = res.body.id;
    });

    it('rejects exam creation if passScore exceeds maxScore', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/exams')
        .set(bearer(gmToken))
        .send({
          title: 'اختبار خاطئ',
          maxScore: 50,
          passScore: 70,
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('2. Bulk Grading & Server-Side Calculations', () => {
    it('grades students and computes percentage and pass status on server', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/exams/${examId}/results`)
        .set(bearer(gmToken))
        .send({
          results: [
            { studentId: studentAProfileId, score: 95.0, notes: 'ممتاز جداً ومتقن' },
            { studentId: studentBProfileId, score: 55.0, notes: 'يحتاج إعادة مراجعة' },
          ],
        })
        .expect(HttpStatus.OK);

      expect(res.body.count).toBe(2);

      // Verify results from API
      const resultsRes = await request(app.getHttpServer())
        .get(`/api/v1/exams/${examId}/results`)
        .set(bearer(gmToken))
        .expect(HttpStatus.OK);

      expect(resultsRes.body).toHaveLength(2);
      const studentAResult = resultsRes.body.find((r: any) => r.studentId === studentAProfileId);
      const studentBResult = resultsRes.body.find((r: any) => r.studentId === studentBProfileId);

      expect(studentAResult.score).toBe(95);
      expect(studentAResult.percentage).toBe(95);
      expect(studentAResult.isPassed).toBe(true);

      expect(studentBResult.score).toBe(55);
      expect(studentBResult.percentage).toBe(55);
      expect(studentBResult.isPassed).toBe(false);
    });

    it('rejects student score exceeding exam maxScore', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/exams/${examId}/results`)
        .set(bearer(gmToken))
        .send({
          results: [
            { studentId: studentAProfileId, score: 150.0 },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);
    });
  });

  describe('3. Result Publication & Access Protection', () => {
    it('hides unpublished results from student and parent', async () => {
      // Student A checks results -> empty because exam is not published
      const stuRes = await request(app.getHttpServer())
        .get('/api/v1/student/me/exams')
        .set(bearer(studentAToken))
        .expect(HttpStatus.OK);

      expect(stuRes.body.results).toHaveLength(0);

      // Parent checks Child A results -> empty
      const parRes = await request(app.getHttpServer())
        .get(`/api/v1/parent/me/children/${studentAProfileId}/exams`)
        .set(bearer(parentToken))
        .expect(HttpStatus.OK);

      expect(parRes.body.results).toHaveLength(0);
    });

    it('publishes exam and makes results visible to student and parent', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/publish`)
        .set(bearer(gmToken))
        .send({ isPublished: true })
        .expect(HttpStatus.OK);

      // Student A now sees published result
      const stuRes = await request(app.getHttpServer())
        .get('/api/v1/student/me/exams')
        .set(bearer(studentAToken))
        .expect(HttpStatus.OK);

      expect(stuRes.body.results).toHaveLength(1);
      expect(stuRes.body.results[0].score).toBe(95);
      expect(stuRes.body.results[0].isPassed).toBe(true);

      // Parent now sees Child A published result
      const parRes = await request(app.getHttpServer())
        .get(`/api/v1/parent/me/children/${studentAProfileId}/exams`)
        .set(bearer(parentToken))
        .expect(HttpStatus.OK);

      expect(parRes.body.results).toHaveLength(1);
      expect(parRes.body.results[0].score).toBe(95);
    });
  });

  describe('4. Grade Correction & Audit Trail', () => {
    it('corrects a student grade and records audit log', async () => {
      const resultsRes = await request(app.getHttpServer())
        .get(`/api/v1/exams/${examId}/results`)
        .set(bearer(gmToken));

      const studentAResult = resultsRes.body.find((r: any) => r.studentId === studentAProfileId);

      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/exams/${examId}/results/${studentAResult.id}`)
        .set(bearer(gmToken))
        .send({
          score: 98.0,
          correctionReason: 'إعادة تدقيق معيار التجويد وإضافة درجتين مستحقتين',
        })
        .expect(HttpStatus.OK);

      expect(updateRes.body.score).toBe(98);
      expect(updateRes.body.percentage).toBe(98);

      // Check AuditLog in database
      const auditEntry = await prisma.auditLog.findFirst({
        where: { entityType: 'ExamResult', entityId: studentAResult.id, action: 'EXAM_RESULT_UPDATED' },
        orderBy: { createdAt: 'desc' },
      });

      expect(auditEntry).toBeDefined();
      expect((auditEntry?.before as any)?.score).toBe(95);
      expect((auditEntry?.after as any)?.score).toBe(98);
    });
  });

  describe('5. Student Evaluations & IDOR Scoping', () => {
    it('teacher records periodic evaluation for a student in their halaqa', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/student-evaluations')
        .set(bearer(teacherToken))
        .send({
          studentId: studentAProfileId,
          halaqaId: halaqaAId,
          evaluationDate: '2026-08-20',
          period: 'التقييم الدوري الأول',
          behaviorScore: 98,
          discipline: 95,
          participation: 100,
          overallScore: 97,
          teacherNotes: 'طالب متميز جداً وملتزم بآداب الحلقة',
          actionLabel: 'تكريم وتحفيز مباشر',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(res.body.rating).toBe('EXCELLENT');
    });

    it('student A retrieves own dashboard and evaluations', async () => {
      const dashRes = await request(app.getHttpServer())
        .get('/api/v1/student/me/dashboard')
        .set(bearer(studentAToken))
        .expect(HttpStatus.OK);

      expect(dashRes.body.student.name).toBe('الطالب أحمد');
      expect(dashRes.body.latestEvaluation).toBeDefined();
      expect(dashRes.body.latestEvaluation.rating).toBe('EXCELLENT');
      expect(dashRes.body.recentResults).toHaveLength(1);
    });

    it('parent retrieves child dashboard and is denied for unrelated student', async () => {
      // Allowed: Child A
      const childRes = await request(app.getHttpServer())
        .get(`/api/v1/parent/me/children/${studentAProfileId}/dashboard`)
        .set(bearer(parentToken))
        .expect(HttpStatus.OK);

      expect(childRes.body.student.name).toBe('الطالب أحمد');

      // Denied: Unrelated Student C
      await request(app.getHttpServer())
        .get(`/api/v1/parent/me/children/${studentCProfileId}/dashboard`)
        .set(bearer(parentToken))
        .expect(HttpStatus.FORBIDDEN);
    });
  });
});
