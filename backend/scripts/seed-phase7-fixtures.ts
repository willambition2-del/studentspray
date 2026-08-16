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
import { PERMISSION_CATALOG } from '../src/authorization/permission-catalog';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});
const passwords = new PasswordService({
  getOrThrow: (k: string) => process.env[k] || 'pepper_dev_secret_change_me_in_prod',
} as any);

async function main() {
  console.log('=== Seeding Phase 7 Development Fixtures ===\n');

  // 1. Forum & Branch
  const forum = await prisma.quranForum.upsert({
    where: { slug: 'demo-quran-forum' },
    update: {},
    create: {
      name: 'الملتقى القرآني النموذجي',
      slug: 'demo-quran-forum',
      code: 'DEMO-FORUM-01',
    },
  });

  const branch = await prisma.branch.upsert({
    where: { forumId_code: { forumId: forum.id, code: 'BRANCH_MAIN' } },
    update: {},
    create: {
      forumId: forum.id,
      name: 'الفرع الرئيسي',
      code: 'BRANCH_MAIN',
    },
  });

  // 2. Ensure Permissions & Roles
  for (const perm of PERMISSION_CATALOG) {
    await prisma.permission.upsert({
      where: { code: perm.code },
      update: { description: perm.description, category: perm.category },
      create: {
        code: perm.code,
        name: perm.name,
        description: perm.description,
        category: perm.category,
      },
    });
  }

  const supervisorRole = await prisma.role.upsert({
    where: { forumId_name: { forumId: forum.id, name: 'TECHNICAL_SUPERVISOR' } },
    update: {},
    create: {
      forumId: forum.id,
      name: 'TECHNICAL_SUPERVISOR',
      displayName: 'المشرف الفني التعليمي',
      isSystem: true,
    },
  });

  const supervisorPermissions = [
    'field_visits.read',
    'field_visits.write',
    'evaluations.read',
    'evaluations.write',
    'evaluation_templates.read',
    'recommendations.read',
    'recommendations.write',
    'supervisor_reports.read',
    'halaqas.read',
    'teachers.read',
    'students.read',
  ];

  for (const pCode of supervisorPermissions) {
    const perm = await prisma.permission.findUnique({ where: { code: pCode } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: supervisorRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: supervisorRole.id, permissionId: perm.id },
      });
    }
  }

  const teacherRole = await prisma.role.upsert({
    where: { forumId_name: { forumId: forum.id, name: 'TEACHER' } },
    update: {},
    create: {
      forumId: forum.id,
      name: 'TEACHER',
      displayName: 'معلم الحلقة',
      isSystem: true,
    },
  });

  const teacherPermissions = [
    'attendance.read',
    'attendance.write',
    'recitation.read',
    'recitation.write',
    'students.read',
    'halaqas.read',
  ];

  for (const pCode of teacherPermissions) {
    const perm = await prisma.permission.findUnique({ where: { code: pCode } });
    if (perm) {
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: teacherRole.id, permissionId: perm.id } },
        update: {},
        create: { roleId: teacherRole.id, permissionId: perm.id },
      });
    }
  }

  // 3. Evaluation Template
  let template = await prisma.evaluationTemplate.findFirst({
    where: { forumId: forum.id, isDefault: true, isActive: true, deletedAt: null },
  });

  if (!template) {
    template = await prisma.evaluationTemplate.create({
      data: {
        forumId: forum.id,
        name: 'استمارة التقييم الميداني والمعايير القياسية للحلقات',
        description: 'النموذج المعتمد لتقييم الحلقات والمعلمين عبر المحاور الستة الرئيسية',
        version: 1,
        isActive: true,
        isDefault: true,
        axes: {
          create: [
            {
              name: 'الجانب التعليمي',
              description: 'إتقان التلاوة والتجويد ومتابعة الحفظ الجديد',
              weight: 25.0,
              order: 1,
              criteria: {
                create: [
                  { name: 'ضبط أحكام التجويد ومخارج الحروف بدقة', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'الالتزام بمنهجية التسميع والتصحيح الفردي', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'مستوى إتقان الطلاب للحفظ الجديد', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'الجانب التربوي والسلوكي',
              description: 'الانضباط والتحفيز والقيم القرآنية',
              weight: 20.0,
              order: 2,
              criteria: {
                create: [
                  { name: 'غرس الآداب والأخلاق القرآنية لدى الطلاب', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'استخدام أساليب التحفيز والتعزيز الإيجابي', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'حسن إدارة الحلقة وضبط السلوك', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'أداء الطلاب والنتائج الميدانية',
              description: 'حضور وتفاعل الطلاب ونسب الإنجاز',
              weight: 20.0,
              order: 3,
              criteria: {
                create: [
                  { name: 'نسبة حضور الطلاب والتزامهم بالموعد', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'مدى جاهزية الطلاب للمراجعة والتثبيت', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'تفاعل الطلاب وتجاوبهم أثناء الجلسة', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'الإدارة والتنظيم',
              description: 'تسجيل الحضور والتوثيق والالتزام بالوقت',
              weight: 15.0,
              order: 4,
              criteria: {
                create: [
                  { name: 'حضور المعلم والبدء والانتهاء في الموعد المحدد', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'رصد الحضور والتسميع أولاً بأول في النظام', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                  { name: 'متابعة الخطط التعليمية الفردية للطلاب', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 3 },
                ],
              },
            },
            {
              name: 'البيئة والتنظيم العام',
              description: 'بيئة الحلقة ونظافة المكان وترتيب المصاحف',
              weight: 10.0,
              order: 5,
              criteria: {
                create: [
                  { name: 'نظافة مكان الحلقة وترتيب المصاحف', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'تنظيم جلوس الطلاب وتهيئتهم للتعلم', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                ],
              },
            },
            {
              name: 'المبادرة والتواصل',
              description: 'التواصل مع أولياء الأمور والمشرفين',
              weight: 10.0,
              order: 6,
              criteria: {
                create: [
                  { name: 'التواصل الفعال مع أولياء الأمور ومتابعة الغياب', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 1 },
                  { name: 'التجاوب مع توجيهات وتوصيات المشرف التعليمي', type: CriterionInputType.SCALE_5, maxScore: 5.0, order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
  }

  // 4. Create Teacher A and Teacher B
  const teacherAPasswordHash = await passwords.hashPassword('Teacher-Password-2026!');
  const teacherAUser = await prisma.user.upsert({
    where: { normalizedUsername: normalizeUsername('teacher_a_verified') },
    update: { passwordHash: teacherAPasswordHash },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'teacher_a_verified',
      normalizedUsername: normalizeUsername('teacher_a_verified'),
      displayName: 'الشيخ أحمد المنشاوي',
      passwordHash: teacherAPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: teacherAUser.id, roleId: teacherRole.id } },
    update: {},
    create: { userId: teacherAUser.id, roleId: teacherRole.id },
  });

  const teacherAProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherAUser.id },
    update: {},
    create: {
      userId: teacherAUser.id,
      specialization: 'حفظ وتجويد بالقراءات العشر',
      employeeNumber: 'TCH-001',
    },
  });

  const teacherBPasswordHash = await passwords.hashPassword('Teacher-Password-2026!');
  const teacherBUser = await prisma.user.upsert({
    where: { normalizedUsername: normalizeUsername('teacher_b_verified') },
    update: { passwordHash: teacherBPasswordHash },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'teacher_b_verified',
      normalizedUsername: normalizeUsername('teacher_b_verified'),
      displayName: 'الشيخ محمود الحصري',
      passwordHash: teacherBPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: teacherBUser.id, roleId: teacherRole.id } },
    update: {},
    create: { userId: teacherBUser.id, roleId: teacherRole.id },
  });

  const teacherBProfile = await prisma.teacherProfile.upsert({
    where: { userId: teacherBUser.id },
    update: {},
    create: {
      userId: teacherBUser.id,
      specialization: 'إتقان وضبط المتون',
      employeeNumber: 'TCH-002',
    },
  });

  // 5. Create Halaqa A and Halaqa B
  const halaqaA = await prisma.halaqa.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'HALAQA_A_VERIFIED' } },
    update: {},
    create: {
      forumId: forum.id,
      branchId: branch.id,
      name: 'حلقة النور والهدى (أ)',
      code: 'HALAQA_A_VERIFIED',
    },
  });

  await prisma.teacherHalaqaAssignment.upsert({
    where: { teacherId_halaqaId: { teacherId: teacherAProfile.id, halaqaId: halaqaA.id } },
    update: { isActive: true },
    create: {
      teacherId: teacherAProfile.id,
      halaqaId: halaqaA.id,
      isPrimary: true,
      isActive: true,
    },
  });

  const halaqaB = await prisma.halaqa.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'HALAQA_B_VERIFIED' } },
    update: {},
    create: {
      forumId: forum.id,
      branchId: branch.id,
      name: 'حلقة الفرقان والضياء (ب)',
      code: 'HALAQA_B_VERIFIED',
    },
  });

  await prisma.teacherHalaqaAssignment.upsert({
    where: { teacherId_halaqaId: { teacherId: teacherBProfile.id, halaqaId: halaqaB.id } },
    update: { isActive: true },
    create: {
      teacherId: teacherBProfile.id,
      halaqaId: halaqaB.id,
      isPrimary: true,
      isActive: true,
    },
  });

  // 6. Create Supervisor A and Supervisor B
  const supAPasswordHash = await passwords.hashPassword('Supervisor-Password-2026!');
  const supAUser = await prisma.user.upsert({
    where: { normalizedUsername: normalizeUsername('supervisor_a') },
    update: { passwordHash: supAPasswordHash },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'supervisor_a',
      normalizedUsername: normalizeUsername('supervisor_a'),
      displayName: 'أ. عبد الرحمن المشرف الأول',
      passwordHash: supAPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: supAUser.id, roleId: supervisorRole.id } },
    update: {},
    create: { userId: supAUser.id, roleId: supervisorRole.id },
  });

  const supAProfile = await prisma.supervisorProfile.upsert({
    where: { userId: supAUser.id },
    update: {},
    create: {
      userId: supAUser.id,
      specialization: 'إشراف وتوجيه الحلقات القرآنية',
      employeeNumber: 'SUP-001',
    },
  });

  // Assign Supervisor A to Halaqa A ONLY
  await prisma.supervisorHalaqaAssignment.upsert({
    where: { supervisorId_halaqaId: { supervisorId: supAProfile.id, halaqaId: halaqaA.id } },
    update: { isActive: true },
    create: {
      supervisorId: supAProfile.id,
      halaqaId: halaqaA.id,
      isActive: true,
    },
  });

  const supBPasswordHash = await passwords.hashPassword('Supervisor-Password-2026!');
  const supBUser = await prisma.user.upsert({
    where: { normalizedUsername: normalizeUsername('supervisor_b') },
    update: { passwordHash: supBPasswordHash },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'supervisor_b',
      normalizedUsername: normalizeUsername('supervisor_b'),
      displayName: 'أ. عبد الله المشرف الثاني',
      passwordHash: supBPasswordHash,
    },
  });

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: supBUser.id, roleId: supervisorRole.id } },
    update: {},
    create: { userId: supBUser.id, roleId: supervisorRole.id },
  });

  const supBProfile = await prisma.supervisorProfile.upsert({
    where: { userId: supBUser.id },
    update: {},
    create: {
      userId: supBUser.id,
      specialization: 'جودة التعليم القرآني',
      employeeNumber: 'SUP-002',
    },
  });

  // Assign Supervisor B to Halaqa B ONLY
  await prisma.supervisorHalaqaAssignment.upsert({
    where: { supervisorId_halaqaId: { supervisorId: supBProfile.id, halaqaId: halaqaB.id } },
    update: { isActive: true },
    create: {
      supervisorId: supBProfile.id,
      halaqaId: halaqaB.id,
      isActive: true,
    },
  });

  console.log('✓ Seeded Supervisor A -> Halaqa A -> Teacher A');
  console.log('✓ Seeded Supervisor B -> Halaqa B -> Teacher B');
  console.log('✓ Seeded Active Evaluation Template with 6 axes & 16 criteria');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
