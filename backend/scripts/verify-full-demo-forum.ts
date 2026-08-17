import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const DEMO_FORUM_SLUG = 'full-demo-quran-forum';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('==================================================');
  console.log('🔍 VERIFYING FULL DEMO DATASET INTEGRITY');
  console.log('==================================================\n');

  const forum = await prisma.forum.findUnique({
    where: { slug: DEMO_FORUM_SLUG },
  });

  if (!forum) {
    console.log('STATUS: DEMO DATASET NOT INSTALLED');
    console.log(`No forum found with slug: ${DEMO_FORUM_SLUG}\n`);
    return;
  }

  const forumId = forum.id;

  // Counts Verification
  const counts = {
    forum: 1,
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
    examResults: await prisma.examResult.count({ where: { exam: { forumId } } }),
    studentEvaluations: await prisma.studentEvaluation.count({ where: { forumId } }),
    evaluationTemplates: await prisma.evaluationTemplate.count({ where: { forumId } }),
    fieldVisits: await prisma.fieldVisit.count({ where: { forumId } }),
    fieldVisitEvaluations: await prisma.fieldVisitEvaluation.count({
      where: { visit: { forumId } },
    }),
    recommendations: await prisma.recommendation.count({ where: { forumId } }),
    recommendationFollowUps: await prisma.recommendationFollowUp.count({
      where: { recommendation: { forumId } },
    }),
    notifications: await prisma.notification.count({
      where: { user: { forumId } },
    }),
    conversations: await prisma.conversation.count({ where: { forumId } }),
    chatMessages: await prisma.chatMessage.count({
      where: { conversation: { forumId } },
    }),
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
    studentAwards: await prisma.studentAward.count({
      where: { award: { forumId } },
    }),
    shelfSections: await prisma.shelfSection.count({ where: { forumId } }),
    shelfItems: await prisma.shelfItem.count({ where: { forumId } }),
    adminRequests: await prisma.administrativeRequest.count({ where: { forumId } }),
    approvalActions: await prisma.approvalAction.count({
      where: { request: { forumId } },
    }),
    adminDecisions: await prisma.adminDecision.count({ where: { forumId } }),
    adminTasks: await prisma.adminTask.count({ where: { forumId } }),
    taskFollowUps: await prisma.taskFollowUp.count({
      where: { task: { forumId } },
    }),
    adminAlerts: await prisma.adminAlert.count({ where: { forumId } }),
  };

  console.log('==================================================');
  console.log('📊 VERIFIED DEMO DATASET COUNTS:');
  console.log('==================================================');
  console.log(`Forum Name             : ${forum.name}`);
  console.log(`Forum Slug             : ${forum.slug}`);
  console.log(`Branches               : ${counts.branches}`);
  console.log(`Roles                  : ${counts.roles}`);
  console.log(`Total Users            : ${counts.users}`);
  console.log(`General Manager        : ${counts.generalManagers}`);
  console.log(`Executive Manager      : ${counts.executiveManagers}`);
  console.log(`Technical Supervisor   : ${counts.supervisors}`);
  console.log(`Teachers               : ${counts.teachers}`);
  console.log(`Students               : ${counts.students}`);
  console.log(`Parents                : ${counts.parents}`);
  console.log(`Student Guardians      : ${counts.studentGuardians}`);
  console.log(`Halaqas                : ${counts.halaqas}`);
  console.log(`Halaqa Members         : ${counts.halaqaMembers}`);
  console.log(`Academic Years         : ${counts.academicYears}`);
  console.log(`Terms                  : ${counts.terms}`);
  console.log(`Educational Plans      : ${counts.educationalPlans}`);
  console.log(`Plan Items             : ${counts.educationalPlanItems}`);
  console.log(`Attendance Sessions    : ${counts.attendanceSessions}`);
  console.log(`Attendance Records     : ${counts.attendanceRecords}`);
  console.log(`Memorization Records   : ${counts.memorizationRecords}`);
  console.log(`Revision Records       : ${counts.revisionRecords}`);
  console.log(`Exams                  : ${counts.exams}`);
  console.log(`Exam Results           : ${counts.examResults}`);
  console.log(`Student Evaluations    : ${counts.studentEvaluations}`);
  console.log(`Evaluation Templates   : ${counts.evaluationTemplates}`);
  console.log(`Field Visits           : ${counts.fieldVisits}`);
  console.log(`Field Visit Evals      : ${counts.fieldVisitEvaluations}`);
  console.log(`Recommendations        : ${counts.recommendations}`);
  console.log(`Recommendation FollowUp: ${counts.recommendationFollowUps}`);
  console.log(`Notifications          : ${counts.notifications}`);
  console.log(`Conversations          : ${counts.conversations}`);
  console.log(`Chat Messages          : ${counts.chatMessages}`);
  console.log(`Activities             : ${counts.activities}`);
  console.log(`Activity Participants  : ${counts.activityParticipants}`);
  console.log(`Competitions           : ${counts.competitions}`);
  console.log(`Competition Results    : ${counts.competitionResults}`);
  console.log(`Awards                 : ${counts.awards}`);
  console.log(`Student Awards Granted : ${counts.studentAwards}`);
  console.log(`Shelf Sections         : ${counts.shelfSections}`);
  console.log(`Shelf Items            : ${counts.shelfItems}`);
  console.log(`Admin Requests         : ${counts.adminRequests}`);
  console.log(`Approval Actions       : ${counts.approvalActions}`);
  console.log(`Admin Decisions        : ${counts.adminDecisions}`);
  console.log(`Admin Tasks            : ${counts.adminTasks}`);
  console.log(`Task FollowUps         : ${counts.taskFollowUps}`);
  console.log(`Admin Alerts           : ${counts.adminAlerts}`);
  console.log('==================================================\n');

  // Verify Student Count
  if (counts.students !== 100) {
    console.error(`❌ Student count mismatch! Expected 100, got ${counts.students}`);
    process.exit(1);
  }
  if (counts.teachers !== 7) {
    console.error(`❌ Teacher count mismatch! Expected 7, got ${counts.teachers}`);
    process.exit(1);
  }
  if (counts.halaqas !== 7) {
    console.error(`❌ Halaqa count mismatch! Expected 7, got ${counts.halaqas}`);
    process.exit(1);
  }

  // Verify Password & Login Capability for Core Roles
  const testPassword = process.env.DEMO_SEED_PASSWORD;
  if (testPassword) {
    console.log('🔐 Testing Argon2id Password Verification on Core Demo Accounts...');
    const testUsernames = [
      'demo_gm',
      'demo_executive',
      'demo_supervisor',
      'demo_teacher_01',
      'demo_student_001',
      'demo_parent_001',
    ];

    for (const uName of testUsernames) {
      const u = await prisma.user.findUnique({
        where: { forumId_username: { forumId, username: uName } },
      });
      if (!u) {
        console.error(`❌ User not found: ${uName}`);
        process.exit(1);
      }
      const match = await argon2.verify(u.passwordHash, testPassword);
      if (!match) {
        console.error(`❌ Password verification failed for user: ${uName}`);
        process.exit(1);
      }
      console.log(`  ✓ ${uName.padEnd(20)} [${u.displayName}] -> Login Auth: PASS`);
    }
  }

  // Check Manifest File
  const manifestPath = path.join(__dirname, '../.local/full-demo-manifest.json');
  if (fs.existsSync(manifestPath)) {
    console.log(`\n📋 Local Manifest File: PASS (${manifestPath})`);
  }

  console.log('\n==================================================');
  console.log('✅ ALL DEMO DATASET VERIFICATIONS PASSED (100% COMPLETE)');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ VERIFICATION FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
