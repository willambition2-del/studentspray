import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

async function main() {
  console.log('=== Starting Phase 7 Technical Supervisor Engine Runtime Verification ===\n');

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
  });

  try {
    // 1. Verify Database Schema & Prisma models
    console.log('1. Verifying Database Schema & Prisma Models...');
    const [templatesCount, visitsCount, recsCount] = await Promise.all([
      prisma.evaluationTemplate.count(),
      prisma.fieldVisit.count(),
      prisma.recommendation.count(),
    ]);
    console.log(`   ✓ Active Templates: ${templatesCount}`);
    console.log(`   ✓ Field Visits: ${visitsCount}`);
    console.log(`   ✓ Recommendations: ${recsCount}`);

    // 2. Verify Active Template Structure
    console.log('\n2. Verifying Default Evaluation Template Structure...');
    const defaultTemplate = await prisma.evaluationTemplate.findFirst({
      where: { isDefault: true, isActive: true, deletedAt: null },
      include: {
        axes: {
          where: { isActive: true },
          include: { criteria: { where: { isActive: true } } },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!defaultTemplate) {
      throw new Error('Default evaluation template not found');
    }

    console.log(`   ✓ Template: "${defaultTemplate.name}" (Version ${defaultTemplate.version})`);
    console.log(`   ✓ Total Axes: ${defaultTemplate.axes.length}`);
    let totalCriteria = 0;
    let totalWeight = 0;
    for (const axis of defaultTemplate.axes) {
      totalWeight += Number(axis.weight);
      totalCriteria += axis.criteria.length;
      console.log(`     - [${axis.weight}%] ${axis.name} (${axis.criteria.length} criteria)`);
    }
    console.log(`   ✓ Total Criteria: ${totalCriteria}`);
    console.log(`   ✓ Total Weight Sum: ${totalWeight}%`);
    if (totalWeight !== 100) {
      throw new Error(`Total axes weight sum is ${totalWeight}%, expected 100%`);
    }

    // 3. Verify Demo Supervisor User & Scoped Data
    console.log('\n3. Verifying Demo Technical Supervisor Account & Scope...');
    const supervisorProfile = await prisma.supervisorProfile.findFirst({
      where: {
        user: { username: 'supervisor_verified', deletedAt: null },
        deletedAt: null,
      },
      include: {
        user: true,
        halaqas: {
          where: { isActive: true },
          include: {
            halaqa: {
              include: {
                teachers: {
                  where: { isActive: true },
                  include: { teacher: { include: { user: true } } },
                },
              },
            },
          },
        },
      },
    });

    if (!supervisorProfile) {
      throw new Error('Supervisor profile for "supervisor_verified" not found');
    }

    console.log(`   ✓ Supervisor: ${supervisorProfile.user.displayName} (@${supervisorProfile.user.username})`);
    const assignedHalaqas = supervisorProfile.halaqas;
    console.log(`   ✓ Assigned Halaqas: ${assignedHalaqas.length}`);
    for (const h of assignedHalaqas) {
      console.log(`     - Halaqa: ${h.halaqa.name} (${h.halaqa.code})`);
      for (const t of h.halaqa.teachers) {
        console.log(`       * Teacher: ${t.teacher.user.displayName}`);
      }
    }

    // 4. Verify Field Visits & Completed Evaluations
    console.log('\n4. Verifying Field Visits & Completed Evaluations...');
    const completedVisits = await prisma.fieldVisit.findMany({
      where: {
        supervisorId: supervisorProfile.id,
        status: 'COMPLETED',
        deletedAt: null,
      },
      include: {
        evaluation: {
          include: { criteriaEvaluations: true },
        },
        recommendations: {
          include: { followUps: true },
        },
      },
    });

    console.log(`   ✓ Completed Visits: ${completedVisits.length}`);
    for (const v of completedVisits) {
      console.log(`     - Visit ${v.visitNumber} (${v.visitType})`);
      if (v.evaluation) {
        console.log(`       * Score: ${v.evaluation.percentage}% | Level: ${v.evaluation.level}`);
        console.log(`       * Scored Criteria: ${v.evaluation.criteriaEvaluations.length}`);
      }
      if (v.recommendations.length > 0) {
        console.log(`       * Recommendations: ${v.recommendations.length}`);
        for (const r of v.recommendations) {
          console.log(`         > [${r.priority}] ${r.title} (Status: ${r.status}, Follow-ups: ${r.followUps.length})`);
        }
      }
    }

    console.log('\n=== ALL PHASE 7 RUNTIME CHECKS VERIFIED SUCCESSFULLY ===');
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error('Phase 7 Verification Failed:', e);
  process.exit(1);
});
