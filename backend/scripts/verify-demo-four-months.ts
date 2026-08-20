import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { DEMO_FORUM_SLUG } from './clean-demo-four-months';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

export async function verifyDemoFourMonths() {
  console.log('======================================================================');
  console.log('🔍 VERIFYING 4-MONTH DEMO DATASET INTEGRITY & COUNTS');
  console.log('======================================================================\n');

  const forum = await prisma.forum.findUnique({
    where: { slug: DEMO_FORUM_SLUG },
  });

  if (!forum) {
    throw new Error(`Forum with slug "${DEMO_FORUM_SLUG}" not found!`);
  }

  const forumId = forum.id;

  // 1. Core Model Counts
  const counts = {
    forums: 1,
    branches: await prisma.branch.count({ where: { forumId } }),
    roles: await prisma.role.count({ where: { forumId } }),
    users: await prisma.user.count({ where: { forumId } }),
    generalManagers: await prisma.user.count({
      where: { forumId, roles: { some: { role: { name: 'GENERAL_MANAGER' } } } },
    }),
    executiveManagers: await prisma.user.count({
      where: { forumId, roles: { some: { role: { name: 'EXECUTIVE_MANAGER' } } } },
    }),
    supervisors: await prisma.supervisorProfile.count({
      where: { user: { forumId } },
    }),
    teachers: await prisma.teacherProfile.count({
      where: { user: { forumId } },
    }),
    students: await prisma.studentProfile.count({
      where: { user: { forumId } },
    }),
    parents: await prisma.parentProfile.count({
      where: { user: { forumId } },
    }),
    studentGuardians: await prisma.studentGuardian.count({
      where: { student: { user: { forumId } } },
    }),
    halaqas: await prisma.halaqa.count({ where: { forumId } }),
    halaqaMembers: await prisma.halaqaMember.count({
      where: { halaqa: { forumId } },
    }),
    academicYears: await prisma.academicYear.count({ where: { forumId } }),
    terms: await prisma.term.count({ where: { academicYear: { forumId } } }),
    educationalPlans: await prisma.educationalPlan.count({ where: { forumId } }),
    educationalPlanItems: await prisma.educationalPlanItem.count({
      where: { plan: { forumId } },
    }),
    attendanceSessions: await prisma.attendanceSession.count({ where: { forumId } }),
    attendanceRecords: await prisma.attendanceRecord.count({
      where: { session: { forumId } },
    }),
    memorizationRecords: await prisma.memorizationRecord.count({ where: { forumId } }),
    revisionRecords: await prisma.revisionRecord.count({ where: { forumId } }),
    exams: await prisma.exam.count({ where: { forumId } }),
    examCriteria: await prisma.examCriterion.count({ where: { exam: { forumId } } }),
    examResults: await prisma.examResult.count({ where: { exam: { forumId } } }),
    studentEvaluations: await prisma.studentEvaluation.count({ where: { forumId } }),
    activities: await prisma.activity.count({ where: { forumId } }),
    activityParticipants: await prisma.activityParticipant.count({
      where: { activity: { forumId } },
    }),
    competitions: await prisma.competition.count({ where: { forumId } }),
    competitionParticipants: await prisma.competitionParticipant.count({
      where: { competition: { forumId } },
    }),
    competitionResults: await prisma.competitionResult.count({
      where: { competition: { forumId } },
    }),
    awards: await prisma.award.count({ where: { forumId } }),
    studentAwards: await prisma.studentAward.count({ where: { award: { forumId } } }),
    shelfSections: await prisma.shelfSection.count({ where: { forumId } }),
    shelfItems: await prisma.shelfItem.count({ where: { forumId } }),
    conversations: await prisma.conversation.count({ where: { forumId } }),
    chatMessages: await prisma.chatMessage.count({
      where: { conversation: { forumId } },
    }),
    notifications: await prisma.notification.count({
      where: { user: { forumId } },
    }),
    adminTasks: await prisma.adminTask.count({ where: { forumId } }),
    adminRequests: await prisma.administrativeRequest.count({ where: { forumId } }),
    fieldVisits: await prisma.fieldVisit.count({ where: { forumId } }),
    recommendations: await prisma.recommendation.count({ where: { forumId } }),
  };

  console.log('📊 Actual Verified Counts:');
  console.log(`  • Branches              : ${counts.branches}`);
  console.log(`  • Halaqas               : ${counts.halaqas}`);
  console.log(`  • Teachers              : ${counts.teachers}`);
  console.log(`  • Supervisors           : ${counts.supervisors}`);
  console.log(`  • Students              : ${counts.students}`);
  console.log(`  • Parents               : ${counts.parents}`);
  console.log(`  • Student Guardians     : ${counts.studentGuardians}`);
  console.log(`  • Attendance Sessions   : ${counts.attendanceSessions}`);
  console.log(`  • Attendance Records    : ${counts.attendanceRecords}`);
  console.log(`  • Memorization Records  : ${counts.memorizationRecords}`);
  console.log(`  • Revision Records      : ${counts.revisionRecords}`);
  console.log(`  • Educational Plans     : ${counts.educationalPlans}`);
  console.log(`  • Exams                 : ${counts.exams}`);
  console.log(`  • Exam Results (Grades) : ${counts.examResults}`);
  console.log(`  • Student Evaluations   : ${counts.studentEvaluations}`);
  console.log(`  • Activities            : ${counts.activities}`);
  console.log(`  • Activity Participants : ${counts.activityParticipants}`);
  console.log(`  • Competitions          : ${counts.competitions}`);
  console.log(`  • Competition Results   : ${counts.competitionResults}`);
  console.log(`  • Awards                : ${counts.awards}`);
  console.log(`  • Student Awards Granted: ${counts.studentAwards}`);
  console.log(`  • Shelf Sections        : ${counts.shelfSections}`);
  console.log(`  • Shelf Posts           : ${counts.shelfItems}`);
  console.log(`  • Chat Conversations    : ${counts.conversations}`);
  console.log(`  • Chat Messages         : ${counts.chatMessages}`);
  console.log(`  • Notifications         : ${counts.notifications}`);
  console.log(`  • Admin Tasks           : ${counts.adminTasks}`);
  console.log(`  • Admin Requests        : ${counts.adminRequests}`);
  console.log(`  • Field Visits          : ${counts.fieldVisits}`);
  console.log(`  • Recommendations       : ${counts.recommendations}`);

  // 2. Relational Integrity Checks
  console.log('\n🛡️ Relational Integrity Assertions:');
  if (counts.students !== 150) throw new Error(`Expected 150 students, got ${counts.students}`);
  if (counts.halaqas !== 10) throw new Error(`Expected 10 halaqas, got ${counts.halaqas}`);
  if (counts.teachers !== 10) throw new Error(`Expected 10 teachers, got ${counts.teachers}`);
  if (counts.supervisors !== 2) throw new Error(`Expected 2 supervisors, got ${counts.supervisors}`);
  if (counts.branches !== 3) throw new Error(`Expected 3 branches, got ${counts.branches}`);
  if (counts.studentGuardians !== 150) throw new Error(`Expected 150 guardian linkages, got ${counts.studentGuardians}`);

  // 3. Check Teacher Demo Account Snapshot
  const teacherUser = await prisma.user.findFirst({
    where: { forumId, username: 'demo_teacher' },
    include: {
      teacherProfile: {
        include: {
          halaqas: {
            include: {
              halaqa: {
                include: {
                  members: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!teacherUser || !teacherUser.teacherProfile) {
    throw new Error('demo_teacher user or profile not found!');
  }

  const assignedHalaqas = teacherUser.teacherProfile.halaqas.map((h) => h.halaqa);
  const teacherHalaqaIds = assignedHalaqas.map((h) => h.id);
  const totalStudentsInTeacherHalaqas = assignedHalaqas.reduce((acc, h) => acc + h.members.length, 0);

  const todayStr = new Date('2026-08-20T12:00:00.000Z').toISOString().split('T')[0];
  const todaySessions = await prisma.attendanceSession.findMany({
    where: {
      halaqaId: { in: teacherHalaqaIds },
      sessionDate: { gte: new Date(`${todayStr}T00:00:00.000Z`), lte: new Date(`${todayStr}T23:59:59.999Z`) },
    },
    include: {
      records: true,
    },
  });

  let todayPresent = 0;
  let todayAbsent = 0;
  for (const s of todaySessions) {
    for (const r of s.records) {
      if (r.status === 'PRESENT') todayPresent++;
      else if (r.status === 'ABSENT') todayAbsent++;
    }
  }

  const todayMemos = await prisma.memorizationRecord.count({
    where: {
      halaqaId: { in: teacherHalaqaIds },
      date: { gte: new Date(`${todayStr}T00:00:00.000Z`), lte: new Date(`${todayStr}T23:59:59.999Z`) },
    },
  });

  const todayRevs = await prisma.revisionRecord.count({
    where: {
      halaqaId: { in: teacherHalaqaIds },
      date: { gte: new Date(`${todayStr}T00:00:00.000Z`), lte: new Date(`${todayStr}T23:59:59.999Z`) },
    },
  });

  const teacherTasks = await prisma.adminTask.count({
    where: { assignedToId: teacherUser.id, status: { in: ['OPEN', 'IN_PROGRESS'] } },
  });

  const teacherUpcomingExams = await prisma.exam.count({
    where: { halaqaId: { in: teacherHalaqaIds }, status: { in: ['SCHEDULED', 'OPEN', 'DRAFT'] } },
  });

  const teacherUnreadNotifs = await prisma.notification.count({
    where: { userId: teacherUser.id, readAt: null },
  });

  const teacherChatMemberships = await prisma.conversationMember.findMany({
    where: { userId: teacherUser.id, isActive: true },
    select: { conversationId: true, lastReadAt: true },
  });
  const teacherUnreadChatCounts = await Promise.all(
    teacherChatMemberships.map((m) =>
      prisma.chatMessage.count({
        where: {
          conversationId: m.conversationId,
          deletedAt: null,
          senderId: { not: teacherUser.id },
          ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
        },
      }),
    ),
  );
  const teacherUnreadChat = teacherUnreadChatCounts.reduce((acc, c) => acc + c, 0);

  console.log('\n🧑‍🏫 Teacher Demo Account (demo_teacher) Dashboard Snapshot:');
  console.log(`  • Assigned Halaqas     : ${assignedHalaqas.length}`);
  console.log(`  • Total Students       : ${totalStudentsInTeacherHalaqas}`);
  console.log(`  • Today Present        : ${todayPresent}`);
  console.log(`  • Today Absent         : ${todayAbsent}`);
  console.log(`  • Today Memorization   : ${todayMemos}`);
  console.log(`  • Today Revision       : ${todayRevs}`);
  console.log(`  • Pending Tasks        : ${teacherTasks}`);
  console.log(`  • Upcoming Exams       : ${teacherUpcomingExams}`);
  console.log(`  • Unread Notifications : ${teacherUnreadNotifs}`);
  console.log(`  • Unread Chat Messages : ${teacherUnreadChat}`);

  console.log('\n✅ All Database Assertions and Integrity Checks Passed Cleanly!');
  return { counts, teacherUser, todayPresent, todayAbsent, todayMemos, todayRevs };
}

async function main() {
  try {
    await verifyDemoFourMonths();
  } catch (err) {
    console.error('❌ Verification Failed:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
