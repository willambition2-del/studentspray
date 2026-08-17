import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const DEMO_FORUM_SLUG = 'full-demo-quran-forum';

// 1. Production Safety Guard
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ ERROR: Demo removal is STRICTLY PROHIBITED in production environments (NODE_ENV === "production").');
  process.exit(1);
}

const isDryRun = process.argv.includes('--dry-run') || process.env.DRY_RUN === 'true';
const isConfirmed = process.argv.includes('--confirm') || process.env.CONFIRM_REMOVE_FULL_DEMO === 'YES';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  console.log('==================================================');
  console.log(isDryRun ? '🔍 PREVIEWING DEMO DATASET REMOVAL (DRY RUN)' : '🗑️ REMOVING FULL DEMO DATASET (ATOMIC & SCOPED)');
  console.log('==================================================\n');

  const forum = await prisma.forum.findUnique({
    where: { slug: DEMO_FORUM_SLUG },
  });

  if (!forum) {
    console.log(`ℹ️ No demo forum found with slug "${DEMO_FORUM_SLUG}". Nothing to remove.\n`);
    return;
  }

  const forumId = forum.id;

  // Verify Manifest Cross-Check if present
  const manifestPath = path.join(__dirname, '../.local/full-demo-manifest.json');
  if (fs.existsSync(manifestPath)) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      if (manifest.forumId && manifest.forumId !== forumId) {
        console.error(`❌ Manifest forumId (${manifest.forumId}) does not match DB forumId (${forumId}). Aborting for safety.`);
        process.exit(1);
      }
    } catch {
      console.warn('⚠️ Warning: Could not parse local manifest. Proceeding with exact forum slug isolation.');
    }
  }

  // Calculate Scoped Counts
  const counts = {
    users: await prisma.user.count({ where: { forumId } }),
    students: await prisma.studentProfile.count({ where: { user: { forumId } } }),
    parents: await prisma.parentProfile.count({ where: { user: { forumId } } }),
    teachers: await prisma.teacherProfile.count({ where: { user: { forumId } } }),
    supervisors: await prisma.supervisorProfile.count({ where: { user: { forumId } } }),
    guardians: await prisma.studentGuardian.count({ where: { student: { user: { forumId } } } }),
    halaqas: await prisma.halaqa.count({ where: { forumId } }),
    branches: await prisma.branch.count({ where: { forumId } }),
    sessions: await prisma.attendanceSession.count({ where: { forumId } }),
    attendanceRecords: await prisma.attendanceRecord.count({ where: { session: { forumId } } }),
    memorizationRecords: await prisma.memorizationRecord.count({ where: { forumId } }),
    revisionRecords: await prisma.revisionRecord.count({ where: { forumId } }),
    exams: await prisma.exam.count({ where: { forumId } }),
    examResults: await prisma.examResult.count({ where: { exam: { forumId } } }),
    studentEvaluations: await prisma.studentEvaluation.count({ where: { forumId } }),
    fieldVisits: await prisma.fieldVisit.count({ where: { forumId } }),
    recommendations: await prisma.recommendation.count({ where: { forumId } }),
    conversations: await prisma.conversation.count({ where: { forumId } }),
    chatMessages: await prisma.chatMessage.count({ where: { conversation: { forumId } } }),
    activities: await prisma.activity.count({ where: { forumId } }),
    competitions: await prisma.competition.count({ where: { forumId } }),
    awards: await prisma.award.count({ where: { forumId } }),
    shelfSections: await prisma.shelfSection.count({ where: { forumId } }),
    shelfItems: await prisma.shelfItem.count({ where: { forumId } }),
    adminRequests: await prisma.administrativeRequest.count({ where: { forumId } }),
    adminDecisions: await prisma.adminDecision.count({ where: { forumId } }),
    adminTasks: await prisma.adminTask.count({ where: { forumId } }),
    adminAlerts: await prisma.adminAlert.count({ where: { forumId } }),
  };

  console.log(`Target Forum: "${forum.name}" (Slug: ${forum.slug}, ID: ${forum.id})`);
  console.log('Entities scoped for removal:');
  console.log(`  • Users               : ${counts.users}`);
  console.log(`  • Students            : ${counts.students}`);
  console.log(`  • Parents             : ${counts.parents}`);
  console.log(`  • Teachers            : ${counts.teachers}`);
  console.log(`  • Supervisors         : ${counts.supervisors}`);
  console.log(`  • Student Guardians   : ${counts.guardians}`);
  console.log(`  • Halaqas             : ${counts.halaqas}`);
  console.log(`  • Branches            : ${counts.branches}`);
  console.log(`  • Attendance Sessions : ${counts.sessions}`);
  console.log(`  • Attendance Records  : ${counts.attendanceRecords}`);
  console.log(`  • Memorization Records: ${counts.memorizationRecords}`);
  console.log(`  • Revision Records    : ${counts.revisionRecords}`);
  console.log(`  • Exams & Results     : ${counts.exams} exams, ${counts.examResults} results`);
  console.log(`  • Field Visits        : ${counts.fieldVisits}`);
  console.log(`  • Recommendations     : ${counts.recommendations}`);
  console.log(`  • Conversations & Chat: ${counts.conversations} convs, ${counts.chatMessages} msgs`);
  console.log(`  • Activities & Comps  : ${counts.activities} activities, ${counts.competitions} competitions`);
  console.log(`  • Awards & Shelf Items: ${counts.awards} awards, ${counts.shelfItems} shelf items`);
  console.log(`  • Administrative Data : ${counts.adminRequests} requests, ${counts.adminDecisions} decisions, ${counts.adminTasks} tasks\n`);

  if (isDryRun) {
    console.log('==================================================');
    console.log('✅ DRY RUN COMPLETED — ZERO DATA MODIFIED OR DELETED');
    console.log('To perform actual removal, run:');
    console.log('$env:CONFIRM_REMOVE_FULL_DEMO="YES" ; npm run demo:remove');
    console.log('==================================================\n');
    return;
  }

  // Confirmation Check for Real Removal
  if (!isConfirmed) {
    console.error('❌ CONFIRMATION REQUIRED FOR ACTUAL DEMO DELETION.');
    console.error('To confirm removal, run:');
    console.error('  $env:CONFIRM_REMOVE_FULL_DEMO="YES" ; npm run demo:remove');
    console.error('  or: npm run demo:remove -- --confirm\n');
    process.exit(1);
  }

  console.log('🧹 Executing Scoped Dependency-Ordered Deletions...');

  // Topological safe deletion scoped strictly to demo forumId
  await prisma.$transaction(async (tx) => {
    // 1. Administrative Workflow
    await tx.taskFollowUp.deleteMany({ where: { task: { forumId } } });
    await tx.adminTask.deleteMany({ where: { forumId } });
    await tx.adminAlert.deleteMany({ where: { forumId } });
    await tx.decisionAudience.deleteMany({ where: { decision: { forumId } } });
    await tx.adminDecision.deleteMany({ where: { forumId } });
    await tx.approvalAction.deleteMany({ where: { request: { forumId } } });
    await tx.administrativeRequest.deleteMany({ where: { forumId } });

    // 2. Shelf
    await tx.shelfPublisherRule.deleteMany({ where: { section: { forumId } } });
    await tx.shelfItem.deleteMany({ where: { forumId } });
    await tx.shelfSection.deleteMany({ where: { forumId } });

    // 3. Awards & Competitions & Activities
    await tx.studentAward.deleteMany({ where: { award: { forumId } } });
    await tx.award.deleteMany({ where: { forumId } });
    await tx.competitionResult.deleteMany({ where: { competition: { forumId } } });
    await tx.competitionParticipant.deleteMany({ where: { competition: { forumId } } });
    await tx.competition.deleteMany({ where: { forumId } });
    await tx.activityParticipant.deleteMany({ where: { activity: { forumId } } });
    await tx.activity.deleteMany({ where: { forumId } });

    // 4. Chat & Notifications
    await tx.chatMessage.deleteMany({ where: { conversation: { forumId } } });
    await tx.conversationMember.deleteMany({ where: { conversation: { forumId } } });
    await tx.conversation.deleteMany({ where: { forumId } });
    await tx.notification.deleteMany({ where: { user: { forumId } } });
    await tx.deviceToken.deleteMany({ where: { user: { forumId } } });

    // 5. Student Evaluations & Exams
    await tx.studentEvaluation.deleteMany({ where: { forumId } });
    await tx.examResult.deleteMany({ where: { exam: { forumId } } });
    await tx.examCriterion.deleteMany({ where: { exam: { forumId } } });
    await tx.exam.deleteMany({ where: { forumId } });

    // 6. Supervisor Visits, Evals & Recommendations
    await tx.supervisorVisitNote.deleteMany({ where: { visit: { forumId } } });
    await tx.recommendationFollowUp.deleteMany({ where: { recommendation: { forumId } } });
    await tx.recommendation.deleteMany({ where: { forumId } });
    await tx.criterionEvaluation.deleteMany({ where: { evaluation: { visit: { forumId } } } });
    await tx.fieldVisitEvaluation.deleteMany({ where: { visit: { forumId } } });
    await tx.fieldVisit.deleteMany({ where: { forumId } });
    await tx.evaluationCriterion.deleteMany({ where: { axis: { template: { forumId } } } });
    await tx.evaluationAxis.deleteMany({ where: { template: { forumId } } });
    await tx.evaluationTemplate.deleteMany({ where: { forumId } });

    // 7. Academic Records & Attendance
    await tx.revisionRecord.deleteMany({ where: { forumId } });
    await tx.memorizationRecord.deleteMany({ where: { forumId } });
    await tx.attendanceRecord.deleteMany({ where: { session: { forumId } } });
    await tx.attendanceSession.deleteMany({ where: { forumId } });
    await tx.educationalPlanItem.deleteMany({ where: { plan: { forumId } } });
    await tx.educationalPlan.deleteMany({ where: { forumId } });
    await tx.term.deleteMany({ where: { academicYear: { forumId } } });
    await tx.academicYear.deleteMany({ where: { forumId } });

    // 8. Halaqa Memberships & Halaqas
    await tx.halaqaMember.deleteMany({ where: { halaqa: { forumId } } });
    await tx.halaqaTeacher.deleteMany({ where: { halaqa: { forumId } } });
    await tx.halaqaSupervisor.deleteMany({ where: { halaqa: { forumId } } });
    await tx.halaqa.deleteMany({ where: { forumId } });

    // 9. Profiles & Guardians
    await tx.studentGuardian.deleteMany({ where: { student: { user: { forumId } } } });
    await tx.studentProfile.deleteMany({ where: { user: { forumId } } });
    await tx.parentProfile.deleteMany({ where: { user: { forumId } } });
    await tx.teacherProfile.deleteMany({ where: { user: { forumId } } });
    await tx.supervisorProfile.deleteMany({ where: { user: { forumId } } });

    // 10. User Roles, Roles, Sessions & Users
    await tx.userRole.deleteMany({ where: { user: { forumId } } });
    await tx.rolePermission.deleteMany({ where: { role: { forumId } } });
    await tx.role.deleteMany({ where: { forumId } });
    await tx.authSession.deleteMany({ where: { user: { forumId } } });
    await tx.securityAuditLog.deleteMany({ where: { actorUser: { forumId } } });
    await tx.auditLog.deleteMany({ where: { actorUser: { forumId } } });
    await tx.user.deleteMany({ where: { forumId } });

    // 11. Branches & Forum
    await tx.branch.deleteMany({ where: { forumId } });
    await tx.forum.delete({ where: { id: forumId } });
  });

  // Clean Manifest File
  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
  }

  console.log('\n==================================================');
  console.log('✅ FULL DEMO DATASET REMOVED SAFELY & COMPLETELY');
  console.log('All demo records purged. Original system data remains 100% untouched.');
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('❌ REMOVAL FAILED:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
