import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

export const DEMO_FORUM_SLUG = 'demo-four-months-2026';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

export async function cleanDemoFourMonths(options: { silent?: boolean } = {}) {
  const log = options.silent ? () => {} : console.log;

  log('==================================================');
  log(`🗑️ CLEANING DEMO DATASET (Scoped to slug: "${DEMO_FORUM_SLUG}")`);
  log('==================================================\n');

  const forum = await prisma.forum.findUnique({
    where: { slug: DEMO_FORUM_SLUG },
  });

  if (!forum) {
    log(`ℹ️ No demo forum found with slug "${DEMO_FORUM_SLUG}". Nothing to clean.\n`);
    return { cleaned: false, forumId: null };
  }

  const forumId = forum.id;

  log(`Target Forum ID: ${forumId} (Name: "${forum.name}")`);

  // Delete all scoped records in dependency order inside a single transaction
  await prisma.$transaction(async (tx) => {
    // 1. Chat & Notifications
    await tx.chatMessage.deleteMany({ where: { conversation: { forumId } } });
    await tx.conversationMember.deleteMany({ where: { conversation: { forumId } } });
    await tx.conversation.deleteMany({ where: { forumId } });
    await tx.notification.deleteMany({ where: { user: { forumId } } });
    await tx.deviceToken.deleteMany({ where: { user: { forumId } } });

    // 2. Admin Decisions, Tasks, Alerts, Requests
    await tx.taskFollowUp.deleteMany({ where: { task: { forumId } } });
    await tx.adminTask.deleteMany({ where: { forumId } });
    await tx.adminAlert.deleteMany({ where: { forumId } });
    await tx.decisionAudience.deleteMany({ where: { decision: { forumId } } });
    await tx.adminDecision.deleteMany({ where: { forumId } });
    await tx.approvalAction.deleteMany({ where: { request: { forumId } } });
    await tx.administrativeRequest.deleteMany({ where: { forumId } });

    // 3. Shelf
    await tx.shelfPublisherRule.deleteMany({ where: { section: { forumId } } });
    await tx.shelfItem.deleteMany({ where: { forumId } });
    await tx.shelfSection.deleteMany({ where: { forumId } });

    // 4. Activities, Competitions, Awards
    await tx.studentAward.deleteMany({ where: { award: { forumId } } });
    await tx.award.deleteMany({ where: { forumId } });
    await tx.competitionResult.deleteMany({ where: { competition: { forumId } } });
    await tx.competitionParticipant.deleteMany({ where: { competition: { forumId } } });
    await tx.competition.deleteMany({ where: { forumId } });
    await tx.activityParticipant.deleteMany({ where: { activity: { forumId } } });
    await tx.activity.deleteMany({ where: { forumId } });

    // 5. Supervisory Field Visits & Evaluations
    await tx.recommendationFollowUp.deleteMany({ where: { recommendation: { forumId } } });
    await tx.recommendation.deleteMany({ where: { forumId } });
    await tx.supervisorVisitNote.deleteMany({ where: { visit: { forumId } } });
    await tx.criterionEvaluation.deleteMany({ where: { evaluation: { visit: { forumId } } } });
    await tx.fieldVisitEvaluation.deleteMany({ where: { visit: { forumId } } });
    await tx.fieldVisit.deleteMany({ where: { forumId } });

    // 6. Evaluations Templates & Student Evaluations
    await tx.studentEvaluation.deleteMany({ where: { forumId } });
    await tx.evaluationCriterion.deleteMany({ where: { axis: { template: { forumId } } } });
    await tx.evaluationAxis.deleteMany({ where: { template: { forumId } } });
    await tx.evaluationTemplate.deleteMany({ where: { forumId } });

    // 7. Exams & Criteria & Results
    await tx.examResult.deleteMany({ where: { exam: { forumId } } });
    await tx.examCriterion.deleteMany({ where: { exam: { forumId } } });
    await tx.exam.deleteMany({ where: { forumId } });

    // 8. Attendance, Memorization, Revision
    await tx.memorizationRecord.deleteMany({ where: { forumId } });
    await tx.revisionRecord.deleteMany({ where: { forumId } });
    await tx.attendanceRecord.deleteMany({ where: { session: { forumId } } });
    await tx.attendanceSession.deleteMany({ where: { forumId } });

    // 9. Educational Plans
    await tx.educationalPlanItem.deleteMany({ where: { plan: { forumId } } });
    await tx.educationalPlan.deleteMany({ where: { forumId } });

    // 10. Terms & Academic Years
    await tx.term.deleteMany({ where: { academicYear: { forumId } } });
    await tx.academicYear.deleteMany({ where: { forumId } });

    // 11. Halaqas & Memberships
    await tx.halaqaSupervisor.deleteMany({ where: { halaqa: { forumId } } });
    await tx.halaqaTeacher.deleteMany({ where: { halaqa: { forumId } } });
    await tx.halaqaMember.deleteMany({ where: { halaqa: { forumId } } });
    await tx.halaqa.deleteMany({ where: { forumId } });

    // 12. Student Guardians, Profiles & Users
    await tx.studentGuardian.deleteMany({ where: { student: { user: { forumId } } } });
    await tx.studentProfile.deleteMany({ where: { user: { forumId } } });
    await tx.parentProfile.deleteMany({ where: { user: { forumId } } });
    await tx.teacherProfile.deleteMany({ where: { user: { forumId } } });
    await tx.supervisorProfile.deleteMany({ where: { user: { forumId } } });

    // 13. Roles & Permissions & Users
    await tx.userRole.deleteMany({ where: { user: { forumId } } });
    await tx.rolePermission.deleteMany({ where: { role: { forumId } } });
    await tx.role.deleteMany({ where: { forumId } });
    await tx.securityAuditLog.deleteMany({ where: { actorUser: { forumId } } });
    await tx.authSession.deleteMany({ where: { user: { forumId } } });
    await tx.auditLog.deleteMany({ where: { actorUser: { forumId } } });
    await tx.user.deleteMany({ where: { forumId } });

    // 14. Branches & Forum
    await tx.branch.deleteMany({ where: { forumId } });
    await tx.forum.delete({ where: { id: forumId } });
  });

  // Remove manifest file if exists
  const manifestPath = path.join(__dirname, '../.local/demo-four-months-manifest.json');
  if (fs.existsSync(manifestPath)) {
    fs.unlinkSync(manifestPath);
  }

  log(`✅ Demo Forum "${DEMO_FORUM_SLUG}" and all associated data cleaned successfully.\n`);
  return { cleaned: true, forumId };
}

async function main() {
  await cleanDemoFourMonths();
  await prisma.$disconnect();
}

if (require.main === module) {
  main().catch((err) => {
    console.error('❌ Error cleaning demo forum:', err);
    process.exit(1);
  });
}
