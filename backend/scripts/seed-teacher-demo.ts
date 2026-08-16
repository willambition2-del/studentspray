import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, EducationalPlanType, TargetType, EducationalPlanStatus, PlanItemType } from '../src/generated/prisma/client';
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
  const forum = await prisma.forum.findFirstOrThrow({ where: { slug: 'demo-quran-forum' } });
  const branch = await prisma.branch.findFirstOrThrow({ where: { forumId: forum.id, code: 'MAIN' } });
  const teacherRole = await prisma.role.findFirstOrThrow({ where: { forumId: forum.id, name: 'TEACHER' } });
  const studentRole = await prisma.role.findFirstOrThrow({ where: { forumId: forum.id, name: 'STUDENT' } });

  const teacherPasswordHash = await passwords.hashPassword('Teacher-Verified-2026!');
  const otherTeacherPasswordHash = await passwords.hashPassword('Teacher-Other-2026!');
  const studentPasswordHash = await passwords.hashPassword('Student-Password-2026!');

  // Teacher A
  const teacherUserA = await prisma.user.upsert({
    where: { forumId_usernameNormalized: { forumId: forum.id, usernameNormalized: normalizeUsername('teacher_verified') } },
    update: { passwordHash: teacherPasswordHash, isActive: true },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'teacher_verified',
      usernameNormalized: normalizeUsername('teacher_verified'),
      displayName: 'الأستاذ أحمد المنشاوي',
      passwordHash: teacherPasswordHash,
      phone: '+966500000001',
    },
  });
  await ensureUserRole(teacherUserA.id, teacherRole.id, branch.id);
  const teacherProfileA = (await prisma.teacherProfile.findFirst({ where: { userId: teacherUserA.id } }))
    || (await prisma.teacherProfile.create({ data: { userId: teacherUserA.id } }));

  // Teacher B
  const teacherUserB = await prisma.user.upsert({
    where: { forumId_usernameNormalized: { forumId: forum.id, usernameNormalized: normalizeUsername('teacher_other') } },
    update: { passwordHash: otherTeacherPasswordHash, isActive: true },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'teacher_other',
      usernameNormalized: normalizeUsername('teacher_other'),
      displayName: 'الأستاذ محمود البنا',
      passwordHash: otherTeacherPasswordHash,
      phone: '+966500000002',
    },
  });
  await ensureUserRole(teacherUserB.id, teacherRole.id, branch.id);
  const teacherProfileB = (await prisma.teacherProfile.findFirst({ where: { userId: teacherUserB.id } }))
    || (await prisma.teacherProfile.create({ data: { userId: teacherUserB.id } }));

  // Student 1
  const studentUser1 = await prisma.user.upsert({
    where: { forumId_usernameNormalized: { forumId: forum.id, usernameNormalized: normalizeUsername('student_anas') } },
    update: { passwordHash: studentPasswordHash },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'student_anas',
      usernameNormalized: normalizeUsername('student_anas'),
      displayName: 'أنس إبراهيم',
      passwordHash: studentPasswordHash,
      phone: '+966500000011',
    },
  });
  await ensureUserRole(studentUser1.id, studentRole.id, branch.id);
  const studentProfile1 = (await prisma.studentProfile.findFirst({ where: { userId: studentUser1.id } }))
    || (await prisma.studentProfile.create({ data: { userId: studentUser1.id, studentNumber: 'ST-2026-001' } }));

  // Student 2
  const studentUser2 = await prisma.user.upsert({
    where: { forumId_usernameNormalized: { forumId: forum.id, usernameNormalized: normalizeUsername('student_omar') } },
    update: { passwordHash: studentPasswordHash },
    create: {
      forumId: forum.id,
      branchId: branch.id,
      username: 'student_omar',
      usernameNormalized: normalizeUsername('student_omar'),
      displayName: 'عمر الفاروق',
      passwordHash: studentPasswordHash,
      phone: '+966500000012',
    },
  });
  await ensureUserRole(studentUser2.id, studentRole.id, branch.id);
  const studentProfile2 = (await prisma.studentProfile.findFirst({ where: { userId: studentUser2.id } }))
    || (await prisma.studentProfile.create({ data: { userId: studentUser2.id, studentNumber: 'ST-2026-002' } }));

  // Halaqa A (Assigned to Teacher A)
  const halaqaA = await prisma.halaqa.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'HALAQA_A_VERIFIED' } },
    update: {},
    create: {
      forumId: forum.id,
      branchId: branch.id,
      name: 'حلقة النور والهدى',
      code: 'HALAQA_A_VERIFIED',
    },
  });
  const htA = await prisma.halaqaTeacher.findFirst({ where: { halaqaId: halaqaA.id, teacherId: teacherProfileA.id } });
  if (!htA) {
    await prisma.halaqaTeacher.create({ data: { halaqaId: halaqaA.id, teacherId: teacherProfileA.id } });
  }

  // Enroll Students in Halaqa A
  const member1 = await prisma.halaqaMember.findFirst({ where: { halaqaId: halaqaA.id, studentId: studentProfile1.id } });
  if (!member1) {
    await prisma.halaqaMember.create({ data: { halaqaId: halaqaA.id, studentId: studentProfile1.id } });
  }
  const member2 = await prisma.halaqaMember.findFirst({ where: { halaqaId: halaqaA.id, studentId: studentProfile2.id } });
  if (!member2) {
    await prisma.halaqaMember.create({ data: { halaqaId: halaqaA.id, studentId: studentProfile2.id } });
  }

  // Halaqa B (Assigned to Teacher B)
  const halaqaB = await prisma.halaqa.upsert({
    where: { branchId_code: { branchId: branch.id, code: 'HALAQA_B_OTHER' } },
    update: {},
    create: {
      forumId: forum.id,
      branchId: branch.id,
      name: 'حلقة الفردوس',
      code: 'HALAQA_B_OTHER',
    },
  });
  const htB = await prisma.halaqaTeacher.findFirst({ where: { halaqaId: halaqaB.id, teacherId: teacherProfileB.id } });
  if (!htB) {
    await prisma.halaqaTeacher.create({ data: { halaqaId: halaqaB.id, teacherId: teacherProfileB.id } });
  }

  // Educational Plan for Halaqa A
  let plan = await prisma.educationalPlan.findFirst({ where: { halaqaId: halaqaA.id, status: EducationalPlanStatus.ACTIVE } });
  if (!plan) {
    plan = await prisma.educationalPlan.create({
      data: {
        forumId: forum.id,
        branchId: branch.id,
        halaqaId: halaqaA.id,
        name: 'خطة حفظ جزء عمّ',
        type: EducationalPlanType.HIFZ,
        status: EducationalPlanStatus.ACTIVE,
        items: {
          create: [
            { type: PlanItemType.MEMORIZATION, targetType: TargetType.VERSES, surahNumber: 114, order: 1, notes: 'سورة الناس' },
            { type: PlanItemType.MEMORIZATION, targetType: TargetType.VERSES, surahNumber: 113, order: 2, notes: 'سورة الفلق' },
            { type: PlanItemType.MEMORIZATION, targetType: TargetType.VERSES, surahNumber: 112, order: 3, notes: 'سورة الإخلاص' },
          ],
        },
      },
    });
  }

  console.log('--- SEEDING COMPLETE ---');
  console.log('Teacher A:', teacherUserA.username, 'ID:', teacherUserA.id);
  console.log('Halaqa A:', halaqaA.name, 'ID:', halaqaA.id);
  console.log('Halaqa B (Other):', halaqaB.name, 'ID:', halaqaB.id);
  console.log('Student 1:', studentUser1.username, 'ProfileID:', studentProfile1.id);
  console.log('Student 2:', studentUser2.username, 'ProfileID:', studentProfile2.id);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
