import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  CriterionInputType,
  EvaluationLevel,
  EvaluationStatus,
  PrismaClient,
  RecommendationPriority,
  RecommendationStatus,
  VisitStatus,
  VisitType,
} from '../src/generated/prisma/client';
import { PasswordService } from '../src/auth/password.service';
import { normalizeUsername } from '../src/auth/utils/identifier';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const passwords = new PasswordService({
  getOrThrow: (k: string) => process.env[k] || 'pepper_dev_secret_change_me_in_prod',
  get: (k: string) => process.env[k] || 'pepper_dev_secret_change_me_in_prod',
} as any);

async function ensureUserRole(userId: string, roleId: string, branchId: string) {
  const existing = await prisma.userRole.findFirst({ where: { userId, roleId } });
  if (!existing) {
    await prisma.userRole.create({ data: { userId, roleId, branchId } });
  }
}

async function main() {
  console.log('=== SEEDING PHASE 7 TECHNICAL SUPERVISOR DEMO ===');
  const forum = await prisma.forum.findFirstOrThrow({ where: { slug: 'demo-quran-forum' } });
  const branch = await prisma.branch.findFirstOrThrow({ where: { forumId: forum.id, code: 'MAIN' } });
  const supervisorRole = await prisma.role.findFirstOrThrow({ where: { forumId: forum.id, name: 'TECHNICAL_SUPERVISOR' } });

  // 1. Seed Default Evaluation Template if not exists
  let template = await prisma.evaluationTemplate.findFirst({
    where: { forumId: forum.id, isDefault: true, deletedAt: null },
  });

  if (!template) {
    console.log('Creating default Evaluation Template...');
    template = await prisma.evaluationTemplate.create({
      data: {
        forumId: forum.id,
        name: 'استمارة التقييم الميداني والمعايير القياسية للحلقات',
        description: 'النموذج الشامل لتقييم الأداء التعليمي والتربوي والإداري لحلقات القرآن الكريم',
        version: 1,
        isActive: true,
        isDefault: true,
        axes: {
          create: [
            {
              name: 'الجانب التعليمي',
              description: 'جودة التلاوة، مخارج الحروف، التجويد النظري والتطبيقي، وطريقة تصحيح الأخطاء',
              weight: 25.0,
              order: 1,
              criteria: {
                create: [
                  { name: 'جودة التلاوة وسلامة مخارج الحروف والتجويد', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'اتباع المنهجية المعتمدة في التسميع وتصحيح الأخطاء', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'مراعاة الفروق الفردية ومستويات الحفظ بين الطلاب', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'الجانب التربوي والسلوكي',
              description: 'التحفيز، توجيه السلوك، التفاعل الإيجابي، وبناء قيم الوقار والالتزام',
              weight: 20.0,
              order: 2,
              criteria: {
                create: [
                  { name: 'تعزيز القيم والأخلاق القرآنية والتوجيه السلوكي', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'استخدام أساليب التحفيز المعنوي والمادي', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'بناء علاقة أبوية إيجابية مع طلاب الحلقة', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'أداء الطلاب والنتائج الميدانية',
              description: 'نسب الحفظ والمراجعة، درجات الاختبارات، ونسبة إنجاز الخطة المقررة',
              weight: 20.0,
              order: 3,
              criteria: {
                create: [
                  { name: 'نسبة إنجاز خطة الحفظ والمراجعة المرحلية', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'تمكن الطلاب وجودة الضبط والإتقان', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'معالجة الطلاب المتعثرين وخطط التحسين', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'الإدارة والتنظيم',
              description: 'انتظام السجلات اليومية، رصد الحضور والغياب، والالتزام بجدول الحلقة',
              weight: 15.0,
              order: 4,
              criteria: {
                create: [
                  { name: 'انضباط المعلم في الحضور والبدء في الوقت المحدد', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'تسجيل الحضور اليومي والغياب في النظام بانتظام', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'رصد درجات الحفظ والمراجعة بشكل يومي دقيق', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'البيئة والتنظيم العام',
              description: 'ترتيب الجلسة، هدوء الحلقة، وتأمين الوسائل المساعدة والمصاحف',
              weight: 10.0,
              order: 5,
              criteria: {
                create: [
                  { name: 'نظافة مكان الحلقة وترتيب جلسة الطلاب والمصاحف', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'الانضباط العام والهدوء داخل المسجد/القاعة', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                ],
              },
            },
            {
              name: 'المبادرة والتواصل',
              description: 'ابتكار أنشطة محفزة، المتابعة مع أولياء الأمور، ورعاية الموهوبين',
              weight: 10.0,
              order: 6,
              criteria: {
                create: [
                  { name: 'التواصل الدوري مع أولياء الأمور وإشعارهم بالمستوى', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'المبادرة في تنفيذ برامج نوعية وأنشطة مساندة', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('Template created with ID:', template.id);
  }

  // 2. Create/Get Verified Supervisor
  const supervisorUsername = 'supervisor_verified';
  let supervisorUser = await prisma.user.findFirst({
    where: { forumId: forum.id, usernameNormalized: normalizeUsername(supervisorUsername) },
  });

  if (!supervisorUser) {
    console.log('Creating verified supervisor user...');
    supervisorUser = await prisma.user.create({
      data: {
        forumId: forum.id,
        branchId: branch.id,
        username: supervisorUsername,
        usernameNormalized: normalizeUsername(supervisorUsername),
        displayName: 'أ. عبد الرحمن الموجه',
        email: 'supervisor@quranforum.org',
        emailNormalized: 'supervisor@quranforum.org',
        phone: '0501234567',
        phoneNormalized: '0501234567',
        passwordHash: await passwords.hashPassword('Supervisor-Password-2026!'),
        isActive: true,
      },
    });
  }

  await ensureUserRole(supervisorUser.id, supervisorRole.id, branch.id);

  let supervisorProfile = await prisma.supervisorProfile.findUnique({
    where: { userId: supervisorUser.id },
  });
  if (!supervisorProfile) {
    supervisorProfile = await prisma.supervisorProfile.create({
      data: {
        userId: supervisorUser.id,
        employeeNumber: 'SUP-001',
        specialization: 'توجيه تعليمي وقراءات قرآنية',
      },
    });
  }

  // 3. Find Teacher and Halaqa
  const teacherUser = await prisma.user.findFirstOrThrow({
    where: { forumId: forum.id, usernameNormalized: normalizeUsername('teacher_verified') },
    include: { teacherProfile: true },
  });
  const teacherProfile = teacherUser.teacherProfile!;

  const halaqaA = await prisma.halaqa.findFirstOrThrow({
    where: { forumId: forum.id, code: 'HALAQA_A_VERIFIED' },
  });

  // 4. Assign supervisor to Halaqa A
  const existingAssign = await prisma.halaqaSupervisor.findFirst({
    where: { halaqaId: halaqaA.id, supervisorId: supervisorProfile.id, isActive: true },
  });
  if (!existingAssign) {
    await prisma.halaqaSupervisor.create({
      data: {
        halaqaId: halaqaA.id,
        supervisorId: supervisorProfile.id,
        isActive: true,
      },
    });
    console.log('Assigned supervisor to Halaqa A');
  }

  // 5. Seed a Completed Field Visit with Full Evaluation & Recommendations
  let completedVisit = await prisma.fieldVisit.findFirst({
    where: { supervisorId: supervisorProfile.id, halaqaId: halaqaA.id, status: VisitStatus.COMPLETED },
  });

  if (!completedVisit) {
    console.log('Creating sample completed field visit with evaluation...');
    const fullTemplate = await prisma.evaluationTemplate.findUniqueOrThrow({
      where: { id: template.id },
      include: { axes: { include: { criteria: true } } },
    });

    completedVisit = await prisma.fieldVisit.create({
      data: {
        forumId: forum.id,
        branchId: branch.id,
        supervisorId: supervisorProfile.id,
        halaqaId: halaqaA.id,
        teacherId: teacherProfile.id,
        visitNumber: 'VIS-2026-0001',
        visitType: VisitType.ROUTINE,
        status: VisitStatus.COMPLETED,
        scheduledDate: new Date('2026-08-10'),
        startedAt: new Date('2026-08-10T16:30:00Z'),
        completedAt: new Date('2026-08-10T18:00:00Z'),
        reason: 'زيارة توجيهية دورية لمتابعة جودة التسميع وإتقان أحكام التجويد',
        summary: 'حلقة متميزة، أداء المعلم رائع في ضبط مخارج الحروف، التزام الطلاب ملحوظ.',
        generalNotes: 'يوصى بتكثيف المراجعة الصغرى قبل البدء بالحفظ الجديد.',
        createdById: supervisorUser.id,
      },
    });

    // Create Evaluation
    const allCriteria = fullTemplate.axes.flatMap((a) => a.criteria.map((c) => ({ ...c, axisName: a.name })));
    await prisma.fieldVisitEvaluation.create({
      data: {
        visitId: completedVisit.id,
        templateId: template.id,
        templateVersion: template.version,
        templateNameSnapshot: template.name,
        status: EvaluationStatus.SUBMITTED,
        totalScore: 92.5,
        maxPossibleScore: 100.0,
        percentage: 92.5,
        level: EvaluationLevel.EXCELLENT,
        strengths: 'تمكن المعلم من أحكام التجويد، انضباط الطلاب، واستخدام وسائل التحفيز المعنوي.',
        improvementAreas: 'تفعيل جدول المراجعة التراكمية اليومية.',
        summary: 'أداء ممتاز يتوافق مع معايير الجودة المعتمدة.',
        submittedAt: new Date('2026-08-10T18:00:00Z'),
        criteriaEvaluations: {
          create: allCriteria.map((c) => ({
            criterionId: c.id,
            axisNameSnapshot: c.axisName,
            criterionNameSnapshot: c.name,
            maxScoreSnapshot: c.maxScore,
            score: 4.6,
            notApplicable: false,
            notes: 'إتقان ممتاز',
          })),
        },
      },
    });

    // Create Recommendation
    const rec = await prisma.recommendation.create({
      data: {
        forumId: forum.id,
        branchId: branch.id,
        halaqaId: halaqaA.id,
        teacherId: teacherProfile.id,
        supervisorId: supervisorProfile.id,
        visitId: completedVisit.id,
        title: 'تطبيق المراجعة التراكمية الصغرى اليومية',
        description: 'تخصيص الربع ساعة الأولى من كل جلسة لتسميع ما تم حفظه خلال الأسبوع الماضي لترسيخ الحفظ.',
        domain: 'الجانب التعليمي',
        priority: RecommendationPriority.HIGH,
        status: RecommendationStatus.IN_PROGRESS,
        dueDate: new Date('2026-09-01'),
        createdById: supervisorUser.id,
        followUps: {
          create: [
            {
              status: RecommendationStatus.IN_PROGRESS,
              notes: 'بدأ المعلم في تقسيم الحلقة لمجموعات ثنائية للتسميع المتبادل',
              createdById: supervisorUser.id,
            },
          ],
        },
      },
    });
    console.log('Created recommendation with ID:', rec.id);
  }

  // 6. Seed an Upcoming Planned Visit
  let plannedVisit = await prisma.fieldVisit.findFirst({
    where: { supervisorId: supervisorProfile.id, status: VisitStatus.PLANNED },
  });

  if (!plannedVisit) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 3);

    plannedVisit = await prisma.fieldVisit.create({
      data: {
        forumId: forum.id,
        branchId: branch.id,
        supervisorId: supervisorProfile.id,
        halaqaId: halaqaA.id,
        teacherId: teacherProfile.id,
        visitNumber: 'VIS-2026-0002',
        visitType: VisitType.FOLLOW_UP,
        status: VisitStatus.PLANNED,
        scheduledDate: futureDate,
        reason: 'متابعة تنفيذ توصية المراجعة التراكمية الصغرى',
        createdById: supervisorUser.id,
      },
    });
    console.log('Created planned visit with ID:', plannedVisit.id);
  }

  console.log('=== PHASE 7 SEEDING COMPLETED SUCCESSFULLY ===');
  console.log('Supervisor Username:', supervisorUser.username);
  console.log('Supervisor ID:', supervisorProfile.id);
  console.log('Template ID:', template.id);
  console.log('Assigned Halaqa:', halaqaA.name);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
