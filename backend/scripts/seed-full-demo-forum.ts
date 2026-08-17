import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  ActivityStatus,
  ActivityType,
  AdminAlertSeverity,
  AdminAlertStatus,
  AdminAlertType,
  AdminDecisionStatus,
  AdminDecisionType,
  AdminPriority,
  AdminRequestStatus,
  AdminRequestType,
  AdminTaskStatus,
  ApprovalActionType,
  AttendanceStatus,
  AwardType,
  ChatMessageType,
  CompetitionCategory,
  CompetitionStatus,
  ConversationType,
  CriterionInputType,
  DecisionTargetType,
  EducationalPlanStatus,
  EducationalPlanType,
  EvaluationLevel,
  EvaluationStatus,
  ExamResultStatus,
  ExamStatus,
  ExamType,
  GuardianRelationship,
  HalaqaMemberStatus,
  NotificationType,
  ParticipantAttendanceStatus,
  ParticipantNominationStatus,
  PlanItemStatus,
  PlanItemType,
  RecommendationPriority,
  RecommendationStatus,
  RecitationRating,
  ShelfContentType,
  ShelfVisibility,
  StudentEvaluationRating,
  TargetType,
  VisitStatus,
  VisitType,
} from '../src/generated/prisma/client';
import { PERMISSION_CATALOG, ROLE_PERMISSION_DEFAULTS } from '../src/authorization/permission-catalog';
import { normalizeEmail, normalizePhone, normalizeUsername } from '../src/auth/utils/identifier';

// 1. Production Safety Guard
if (process.env.NODE_ENV === 'production') {
  console.error('\n❌ ERROR: Demo seeding is STRICTLY PROHIBITED in production environments (NODE_ENV === "production").');
  process.exit(1);
}

// 2. Demo Password Guard
const demoPassword = process.env.DEMO_SEED_PASSWORD;
if (!demoPassword || demoPassword.trim().length === 0) {
  console.error('\n❌ ERROR: DEMO_SEED_PASSWORD environment variable is required.');
  console.error('Example: $env:DEMO_SEED_PASSWORD="YourSecureDevPassword123!" ; npm run demo:seed\n');
  process.exit(1);
}

if (demoPassword.length < 12) {
  console.error('\n❌ ERROR: DEMO_SEED_PASSWORD must be at least 12 characters to meet system password policy.\n');
  process.exit(1);
}

const DEMO_FORUM_SLUG = 'full-demo-quran-forum';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const FIRST_NAMES = [
  'محمد', 'أحمد', 'عبد الله', 'إبراهيم', 'علي', 'عمر', 'خالد', 'يوسف', 'حمزة', 'عبد الرحمن',
  'صالح', 'فهد', 'سعد', 'طارق', 'حسان', 'سليمان', 'أنس', 'مصعب', 'معاذ', 'ياسر',
  'بلال', 'أسامة', 'عبد العزيز', 'فيصل', 'سعود', 'تركي', 'ماجد', 'بدر', 'ناصر', 'سلطان',
  'عثمان', 'معاوية', 'حميد', 'صقر', 'عمرو', 'زهير', 'يزيد', 'هاشم', 'أمير', 'ريان',
  'زياد', 'إياس', 'يمان', 'براء', 'قتيبة', 'ثابت', 'عاصم', 'نافع', 'ورش', 'حفص'
];

const LAST_NAMES = [
  'القاسمي', 'الحداد', 'العريقي', 'المنشاوي', 'القباطي', 'الصبري', 'العنسي', 'الورد', 'الشامي', 'الحرازي',
  'السعيد', 'المنصور', 'التميمي', 'الغامدي', 'القحطاني', 'الدوسري', 'الشهري', 'القرني', 'العتيبي', 'المطيري',
  'الحربي', 'الزهراني', 'الأحمدي', 'الناصر', 'الرشيد', 'الأنصاري', 'البكري', 'العدناني', 'الحسني', 'العلوي',
  'اليماني', 'الصنعاني', 'العدني', 'التعزي', 'المأربي', 'الحضرمي', 'الجوفي', 'الإبي', 'الذماري', 'الزبيدي'
];

const PARENT_OCCUPATIONS = [
  'مهندس برمجيات', 'معلم لغة عربية', 'طبيب أطفال', 'تاجر ومستثمر', 'أستاذ جامعي',
  'موظف حكومي', 'صيدلي', 'محاسب قانوني', 'مهندس مدني', 'مدير موارد بشرية'
];

async function main() {
  console.log('==================================================');
  console.log('🚀 SEEDING FULL REALISTIC QURAN FORUM DEMO DATASET');
  console.log('==================================================\n');

  // Check if demo forum already exists
  const existingForum = await prisma.forum.findUnique({
    where: { slug: DEMO_FORUM_SLUG },
  });

  if (existingForum) {
    console.error(`❌ DEMO FORUM ALREADY EXISTS (slug: ${DEMO_FORUM_SLUG}, id: ${existingForum.id})`);
    console.error('To remove and rebuild cleanly, run: npm run demo:remove or npm run demo:rebuild\n');
    process.exit(1);
  }

  // Record Baseline Snapshot
  console.log('📊 Recording Database Baseline Snapshot...');
  const baselineCounts = {
    forums: await prisma.forum.count(),
    branches: await prisma.branch.count(),
    users: await prisma.user.count(),
    students: await prisma.studentProfile.count(),
    parents: await prisma.parentProfile.count(),
    teachers: await prisma.teacherProfile.count(),
    supervisors: await prisma.supervisorProfile.count(),
    halaqas: await prisma.halaqa.count(),
    academicYears: await prisma.academicYear.count(),
    terms: await prisma.term.count(),
    plans: await prisma.educationalPlan.count(),
    attendanceSessions: await prisma.attendanceSession.count(),
    attendanceRecords: await prisma.attendanceRecord.count(),
    memorizationRecords: await prisma.memorizationRecord.count(),
    revisionRecords: await prisma.revisionRecord.count(),
    exams: await prisma.exam.count(),
    examResults: await prisma.examResult.count(),
    studentEvaluations: await prisma.studentEvaluation.count(),
    fieldVisits: await prisma.fieldVisit.count(),
    recommendations: await prisma.recommendation.count(),
    notifications: await prisma.notification.count(),
    conversations: await prisma.conversation.count(),
    chatMessages: await prisma.chatMessage.count(),
    activities: await prisma.activity.count(),
    competitions: await prisma.competition.count(),
    awards: await prisma.award.count(),
    shelfSections: await prisma.shelfSection.count(),
    shelfItems: await prisma.shelfItem.count(),
    adminRequests: await prisma.administrativeRequest.count(),
    adminDecisions: await prisma.adminDecision.count(),
    adminTasks: await prisma.adminTask.count(),
    adminAlerts: await prisma.adminAlert.count(),
  };

  console.log('Baseline User count   :', baselineCounts.users);
  console.log('Baseline Student count:', baselineCounts.students);
  console.log('Baseline Halaqa count :', baselineCounts.halaqas);

  // Hash seed password
  console.log('\n🔒 Hashing demo credentials with Argon2id...');
  const passwordHash = await argon2.hash(demoPassword, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 1,
  });

  const manifest: any = {
    demoSeedVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    forumSlug: DEMO_FORUM_SLUG,
    baselineCounts,
    forumId: '',
    branchIds: [],
    roleIds: [],
    userIds: [],
    teacherIds: [],
    supervisorIds: [],
    studentIds: [],
    parentIds: [],
    halaqaIds: [],
    academicYearIds: [],
    termIds: [],
    planIds: [],
    examIds: [],
    activityIds: [],
    competitionIds: [],
    awardIds: [],
    shelfSectionIds: [],
    decisionIds: [],
    taskIds: [],
  };

  // 1. Create Demo Forum
  console.log('🏛️ Creating Demo Forum: ملتقى النور القرآني النموذجي...');
  const forum = await prisma.forum.create({
    data: {
      name: 'ملتقى النور القرآني النموذجي',
      slug: DEMO_FORUM_SLUG,
      logo: null,
      isActive: true,
    },
  });
  manifest.forumId = forum.id;

  // 2. Create 3 Branches
  console.log('🏢 Creating 3 Demo Branches...');
  const branchMain = await prisma.branch.create({
    data: { forumId: forum.id, name: 'الفرع الرئيسي - صنعاء', code: 'BRANCH_MAIN', isActive: true },
  });
  const branchRawdah = await prisma.branch.create({
    data: { forumId: forum.id, name: 'فرع الروضة القرآني', code: 'BRANCH_RAWDAH', isActive: true },
  });
  const branchItqan = await prisma.branch.create({
    data: { forumId: forum.id, name: 'فرع الإتقان والتجويد', code: 'BRANCH_ITQAN', isActive: true },
  });
  manifest.branchIds = [branchMain.id, branchRawdah.id, branchItqan.id];

  // 3. Create System Permissions & Roles for this Forum
  console.log('🔑 Setting up Role and Permission Catalog...');
  for (const [code, desc] of Object.entries(PERMISSION_CATALOG)) {
    await prisma.permission.upsert({
      where: { code },
      update: { description: desc },
      create: { code, description: desc },
    });
  }

  const roleMap: Record<string, string> = {};
  const roleDisplayNames: Record<string, string> = {
    GENERAL_MANAGER: 'المدير العام للملتقى',
    EXECUTIVE_MANAGER: 'المدير التنفيذي للشؤون التعليمية',
    TECHNICAL_SUPERVISOR: 'المشرف التعليمي الفني',
    TEACHER: 'معلم حلقات القرآن الكريم',
    STUDENT: 'طالب الحلقة القرآنية',
    PARENT: 'ولي أمر الطالب',
  };

  for (const [roleName, permissions] of Object.entries(ROLE_PERMISSION_DEFAULTS)) {
    const role = await prisma.role.create({
      data: {
        forumId: forum.id,
        name: roleName,
        displayName: roleDisplayNames[roleName] || roleName,
        description: `الدور النظامي المعتمد لـ ${roleDisplayNames[roleName]}`,
        isSystem: true,
        isActive: true,
      },
    });
    roleMap[roleName] = role.id;
    manifest.roleIds.push(role.id);

    for (const permCode of permissions) {
      const perm = await prisma.permission.findUnique({ where: { code: permCode } });
      if (perm) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: perm.id },
        });
      }
    }
  }

  // 4. Create Management Accounts
  console.log('👤 Creating Management Accounts (GM, Executive, Supervisor)...');
  const gmUser = await prisma.user.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      username: 'demo_gm',
      usernameNormalized: normalizeUsername('demo_gm'),
      email: 'demo_gm@quranforum.local',
      emailNormalized: normalizeEmail('demo_gm@quranforum.local'),
      phone: '0550000001',
      phoneNormalized: normalizePhone('0550000001'),
      displayName: 'أ. عبد الله محمد القاسمي',
      passwordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: gmUser.id, roleId: roleMap['GENERAL_MANAGER'], branchId: branchMain.id } });
  manifest.userIds.push(gmUser.id);

  const execUser = await prisma.user.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      username: 'demo_executive',
      usernameNormalized: normalizeUsername('demo_executive'),
      email: 'demo_executive@quranforum.local',
      emailNormalized: normalizeEmail('demo_executive@quranforum.local'),
      phone: '0550000002',
      phoneNormalized: normalizePhone('0550000002'),
      displayName: 'أ. خالد أحمد العريقي',
      passwordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: execUser.id, roleId: roleMap['EXECUTIVE_MANAGER'], branchId: branchMain.id } });
  manifest.userIds.push(execUser.id);

  const supUser = await prisma.user.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      username: 'demo_supervisor',
      usernameNormalized: normalizeUsername('demo_supervisor'),
      email: 'demo_supervisor@quranforum.local',
      emailNormalized: normalizeEmail('demo_supervisor@quranforum.local'),
      phone: '0550000003',
      phoneNormalized: normalizePhone('0550000003'),
      displayName: 'أ. عبد الرحمن علي الحداد',
      passwordHash,
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: supUser.id, roleId: roleMap['TECHNICAL_SUPERVISOR'], branchId: branchMain.id } });
  const supProfile = await prisma.supervisorProfile.create({
    data: {
      userId: supUser.id,
      employeeNumber: 'SUP-2026-001',
      specialization: 'إشراف تعليمي وتجويد بالقراءات',
    },
  });
  manifest.userIds.push(supUser.id);
  manifest.supervisorIds.push(supProfile.id);

  // 5. Create 7 Teachers
  console.log('👨‍🏫 Creating 7 Teachers and Profiles...');
  const teacherDefs = [
    { username: 'demo_teacher_01', name: 'أ. أحمد محمد المنشاوي', branch: branchMain, phone: '0551000001' },
    { username: 'demo_teacher_02', name: 'أ. ياسر عبد الله القباطي', branch: branchMain, phone: '0551000002' },
    { username: 'demo_teacher_03', name: 'أ. محمد علي الصبري', branch: branchMain, phone: '0551000003' },
    { username: 'demo_teacher_04', name: 'أ. إبراهيم أحمد العنسي', branch: branchRawdah, phone: '0551000004' },
    { username: 'demo_teacher_05', name: 'أ. عبد الكريم صالح الورد', branch: branchRawdah, phone: '0551000005' },
    { username: 'demo_teacher_06', name: 'أ. أسامة محمد الشامي', branch: branchItqan, phone: '0551000006' },
    { username: 'demo_teacher_07', name: 'أ. أنس عبد الله الحرازي', branch: branchItqan, phone: '0551000007' },
  ];

  const teacherProfiles: any[] = [];
  const teacherUsers: any[] = [];

  for (let i = 0; i < teacherDefs.length; i++) {
    const tDef = teacherDefs[i];
    const tUser = await prisma.user.create({
      data: {
        forumId: forum.id,
        branchId: tDef.branch.id,
        username: tDef.username,
        usernameNormalized: normalizeUsername(tDef.username),
        email: `${tDef.username}@quranforum.local`,
        emailNormalized: normalizeEmail(`${tDef.username}@quranforum.local`),
        phone: tDef.phone,
        phoneNormalized: normalizePhone(tDef.phone),
        displayName: tDef.name,
        passwordHash,
        isActive: true,
      },
    });
    await prisma.userRole.create({ data: { userId: tUser.id, roleId: roleMap['TEACHER'], branchId: tDef.branch.id } });
    const tProfile = await prisma.teacherProfile.create({
      data: {
        userId: tUser.id,
        employeeNumber: `TCH-2026-00${i + 1}`,
        specialization: i % 2 === 0 ? 'تلاوة وتجويد بالقراءات العشر' : 'تحفيظ متقن وتثبيت وضبط متون',
      },
    });
    teacherUsers.push(tUser);
    teacherProfiles.push(tProfile);
    manifest.userIds.push(tUser.id);
    manifest.teacherIds.push(tProfile.id);
  }

  // 6. Create 7 Halaqas
  console.log('🕌 Creating 7 Halaqas and assigning Teachers & Supervisor...');
  const halaqaDefs = [
    { name: 'حلقة النور', code: 'HLQ_NOOR', teacher: teacherProfiles[0], branch: branchMain },
    { name: 'حلقة الفرقان', code: 'HLQ_FURQAN', teacher: teacherProfiles[1], branch: branchMain },
    { name: 'حلقة الإتقان', code: 'HLQ_ITQAN', teacher: teacherProfiles[2], branch: branchMain },
    { name: 'حلقة أهل القرآن', code: 'HLQ_AHL_QURAN', teacher: teacherProfiles[3], branch: branchRawdah },
    { name: 'حلقة الهدى', code: 'HLQ_HUDA', teacher: teacherProfiles[4], branch: branchRawdah },
    { name: 'حلقة الترتيل', code: 'HLQ_TARTEEL', teacher: teacherProfiles[5], branch: branchItqan },
    { name: 'حلقة الريان', code: 'HLQ_RAYYAN', teacher: teacherProfiles[6], branch: branchItqan },
  ];

  const halaqas: any[] = [];
  for (const hDef of halaqaDefs) {
    const halaqa = await prisma.halaqa.create({
      data: {
        forumId: forum.id,
        branchId: hDef.branch.id,
        name: hDef.name,
        code: hDef.code,
        description: `حلقة نموذجية لتعليم القرآن الكريم والتجويد بـ (${hDef.branch.name})`,
        isActive: true,
      },
    });
    halaqas.push(halaqa);
    manifest.halaqaIds.push(halaqa.id);

    // Assign Primary Teacher
    await prisma.halaqaTeacher.create({
      data: { halaqaId: halaqa.id, teacherId: hDef.teacher.id, isActive: true },
    });

    // Assign Technical Supervisor
    await prisma.halaqaSupervisor.create({
      data: { halaqaId: halaqa.id, supervisorId: supProfile.id, isActive: true },
    });
  }

  // 7. Create 100 Students and Profiles
  console.log('🎓 Creating 100 Students and distributing across 7 Halaqas...');
  const studentDistribution = [15, 15, 14, 14, 14, 14, 14]; // Exact sum: 100
  const students: any[] = [];
  const studentProfiles: any[] = [];

  let currentStudentIdx = 1;
  for (let hIdx = 0; hIdx < halaqas.length; hIdx++) {
    const countForHalaqa = studentDistribution[hIdx];
    const halaqa = halaqas[hIdx];

    for (let s = 0; s < countForHalaqa; s++) {
      const padNum = String(currentStudentIdx).padStart(3, '0');
      const username = `demo_student_${padNum}`;
      const fName = FIRST_NAMES[(currentStudentIdx * 7) % FIRST_NAMES.length];
      const mName = FIRST_NAMES[(currentStudentIdx * 11) % FIRST_NAMES.length];
      const lName = LAST_NAMES[(currentStudentIdx * 13) % LAST_NAMES.length];
      const displayName = `${fName} ${mName} ${lName}`;

      const stUser = await prisma.user.create({
        data: {
          forumId: forum.id,
          branchId: halaqa.branchId,
          username,
          usernameNormalized: normalizeUsername(username),
          email: `${username}@quranforum.local`,
          emailNormalized: normalizeEmail(`${username}@quranforum.local`),
          phone: `0552${padNum}000`.slice(0, 10),
          phoneNormalized: normalizePhone(`0552${padNum}000`.slice(0, 10)),
          displayName,
          passwordHash,
          isActive: true,
        },
      });
      await prisma.userRole.create({ data: { userId: stUser.id, roleId: roleMap['STUDENT'], branchId: halaqa.branchId } });

      const birthYear = 2010 + (currentStudentIdx % 5);
      const stProfile = await prisma.studentProfile.create({
        data: {
          userId: stUser.id,
          studentNumber: `STU-2026-${padNum}`,
          dateOfBirth: new Date(`${birthYear}-05-15`),
          enrollmentDate: new Date('2025-09-01'),
        },
      });

      // Join Halaqa
      await prisma.halaqaMember.create({
        data: {
          halaqaId: halaqa.id,
          studentId: stProfile.id,
          status: HalaqaMemberStatus.ACTIVE,
          isActive: true,
        },
      });

      students.push(stUser);
      studentProfiles.push(stProfile);
      manifest.userIds.push(stUser.id);
      manifest.studentIds.push(stProfile.id);

      currentStudentIdx++;
    }
  }

  // 8. Create Realistic Parent Accounts (70 Parents for 100 Students)
  console.log('👨‍👧‍👦 Creating 70 Parent Accounts and linking Guardians...');
  const parents: any[] = [];
  const parentProfiles: any[] = [];
  const TOTAL_PARENTS = 70;

  for (let pIdx = 1; pIdx <= TOTAL_PARENTS; pIdx++) {
    const padNum = String(pIdx).padStart(3, '0');
    const username = `demo_parent_${padNum}`;
    const fName = FIRST_NAMES[(pIdx * 3) % FIRST_NAMES.length];
    const lName = LAST_NAMES[(pIdx * 5) % LAST_NAMES.length];
    const displayName = `${fName} ${lName} (ولي أمر)`;

    const pUser = await prisma.user.create({
      data: {
        forumId: forum.id,
        branchId: branchMain.id,
        username,
        usernameNormalized: normalizeUsername(username),
        email: `${username}@quranforum.local`,
        emailNormalized: normalizeEmail(`${username}@quranforum.local`),
        phone: `0553${padNum}222`.slice(0, 10),
        phoneNormalized: normalizePhone(`0553${padNum}222`.slice(0, 10)),
        displayName,
        passwordHash,
        isActive: true,
      },
    });
    await prisma.userRole.create({ data: { userId: pUser.id, roleId: roleMap['PARENT'], branchId: branchMain.id } });

    const pProfile = await prisma.parentProfile.create({
      data: {
        userId: pUser.id,
        occupation: PARENT_OCCUPATIONS[pIdx % PARENT_OCCUPATIONS.length],
      },
    });

    parents.push(pUser);
    parentProfiles.push(pProfile);
    manifest.userIds.push(pUser.id);
    manifest.parentIds.push(pProfile.id);
  }

  // Link all 100 students to the 70 parents (1, 2, or 3 siblings)
  for (let sIdx = 0; sIdx < studentProfiles.length; sIdx++) {
    const parentProfile = parentProfiles[sIdx % TOTAL_PARENTS];
    await prisma.studentGuardian.create({
      data: {
        studentId: studentProfiles[sIdx].id,
        parentId: parentProfile.id,
        relationship: sIdx % 5 === 0 ? GuardianRelationship.MOTHER : GuardianRelationship.FATHER,
        isPrimary: true,
        canPickup: true,
        receivesAcademicReports: true,
        receivesFinancialAlerts: true,
      },
    });
  }

  // 9. Academic Year & Terms
  console.log('📅 Creating Academic Year & Active Terms...');
  const academicYear = await prisma.academicYear.create({
    data: {
      forumId: forum.id,
      name: 'العام القرآني 1448هـ / 2026-2027',
      startsAt: new Date('2025-09-01'),
      endsAt: new Date('2026-06-30'),
      isActive: true,
    },
  });
  manifest.academicYearIds.push(academicYear.id);

  const term1 = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'الفصل الدراسي الأول',
      startsAt: new Date('2025-09-01'),
      endsAt: new Date('2026-01-20'),
      order: 1,
      isActive: true,
    },
  });
  const term2 = await prisma.term.create({
    data: {
      academicYearId: academicYear.id,
      name: 'الفصل الدراسي الثاني',
      startsAt: new Date('2026-02-01'),
      endsAt: new Date('2026-06-30'),
      order: 2,
      isActive: false,
    },
  });
  manifest.termIds.push(term1.id, term2.id);

  // 10. Educational Plans & Items
  console.log('📖 Creating Educational Plans and Structured Items...');
  const plan1 = await prisma.educationalPlan.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      halaqaId: halaqas[0].id,
      name: 'خطة حفظ وتجويد سورة البقرة (المستوى المتقدم)',
      type: EducationalPlanType.HIFZ,
      status: EducationalPlanStatus.ACTIVE,
      startDate: new Date('2025-09-01'),
      endDate: new Date('2026-01-20'),
      createdById: gmUser.id,
      notes: 'خطة منهجية مكثفة لحفظ وضبط سورة البقرة مع أحكام التجويد',
    },
  });
  manifest.planIds.push(plan1.id);

  const planItemsData = [
    { surah: 2, from: 1, to: 25, order: 1 },
    { surah: 2, from: 26, to: 50, order: 2 },
    { surah: 2, from: 51, to: 75, order: 3 },
    { surah: 2, from: 76, to: 100, order: 4 },
    { surah: 2, from: 101, to: 125, order: 5 },
    { surah: 2, from: 126, to: 150, order: 6 },
    { surah: 2, from: 151, to: 175, order: 7 },
    { surah: 2, from: 176, to: 200, order: 8 },
  ];

  for (const pItem of planItemsData) {
    await prisma.educationalPlanItem.create({
      data: {
        planId: plan1.id,
        type: PlanItemType.MEMORIZATION,
        targetType: TargetType.VERSES,
        surahNumber: pItem.surah,
        fromAyah: pItem.from,
        toAyah: pItem.to,
        order: pItem.order,
        status: pItem.order <= 4 ? PlanItemStatus.COMPLETED : PlanItemStatus.IN_PROGRESS,
      },
    });
  }

  // 11. Attendance History (Past 20 session dates)
  console.log('⏱️ Generating 20 Daily Attendance Sessions & Records per Halaqa...');
  const now = new Date();
  for (let hIdx = 0; hIdx < halaqas.length; hIdx++) {
    const halaqa = halaqas[hIdx];
    const hStudents = await prisma.halaqaMember.findMany({
      where: { halaqaId: halaqa.id },
      include: { student: true },
    });

    for (let day = 20; day >= 1; day--) {
      const sessionDate = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      const session = await prisma.attendanceSession.create({
        data: {
          forumId: forum.id,
          halaqaId: halaqa.id,
          sessionDate,
          status: 'COMPLETED',
          notes: `جلسة التسميع والحضور اليومية - تاريخ ${sessionDate.toISOString().split('T')[0]}`,
          recordedById: teacherUsers[hIdx].id,
        },
      });

      for (let s = 0; s < hStudents.length; s++) {
        const student = hStudents[s].student;
        let status: AttendanceStatus = AttendanceStatus.PRESENT;
        const seedMod = (s * 7 + day * 13) % 100;
        if (seedMod < 5) status = AttendanceStatus.ABSENT;
        else if (seedMod < 12) status = AttendanceStatus.LATE;
        else if (seedMod < 16) status = AttendanceStatus.EXCUSED;

        await prisma.attendanceRecord.create({
          data: {
            sessionId: session.id,
            studentId: student.id,
            status,
            notes: status === AttendanceStatus.ABSENT ? 'غياب بدون عذر مسبق' : status === AttendanceStatus.LATE ? 'حضور متأخر 15 دقيقة' : null,
            recordedById: teacherUsers[hIdx].id,
            recordedAt: sessionDate,
          },
        });
      }
    }
  }

  // 12. Memorization Records
  console.log('🎙️ Generating Memorization Records with realistic teacher feedback...');
  const teacherNotes = [
    'تلاوة ممتازة مع إتقان تام للمد الواجب وأحكام النون الساكنة.',
    'حفظ متقن ومتميز جداً، بارك الله في جهودك واصل بنفس الهمة.',
    'قراءة جيدة جداً مع تنبيه بسيط على مخرج حرف الضاد.',
    'أداء طيب ويحتاج مزيداً من التركيز في الوقف والابتداء.',
    'تحسن ملحوظ في سرعة الاستحضار ورزانة الترتيل.',
  ];

  for (let sIdx = 0; sIdx < studentProfiles.length; sIdx++) {
    const student = studentProfiles[sIdx];
    const halaqaIdx = sIdx < 15 ? 0 : sIdx < 30 ? 1 : sIdx < 44 ? 2 : sIdx < 58 ? 3 : sIdx < 72 ? 4 : sIdx < 86 ? 5 : 6;
    const halaqa = halaqas[halaqaIdx];
    const teacher = teacherUsers[halaqaIdx];

    const recordsCount = 6 + (sIdx % 4);
    for (let r = 0; r < recordsCount; r++) {
      const recDate = new Date(now.getTime() - (r * 3 + 1) * 24 * 60 * 60 * 1000);
      const score = 85 + ((sIdx * 3 + r * 7) % 16);
      const rating = score >= 95 ? RecitationRating.EXCELLENT : RecitationRating.VERY_GOOD;
      const mistakes = score < 90 ? 2 : score < 95 ? 1 : 0;

      await prisma.memorizationRecord.create({
        data: {
          forumId: forum.id,
          halaqaId: halaqa.id,
          studentId: student.id,
          recordedById: teacher.id,
          date: recDate,
          surahNumber: 2,
          fromAyah: r * 15 + 1,
          toAyah: (r + 1) * 15,
          pageFrom: r * 2 + 1,
          pageTo: (r + 1) * 2,
          evaluationScore: score,
          rating,
          mistakesCount: mistakes,
          teacherNotes: teacherNotes[(sIdx + r) % teacherNotes.length],
        },
      });
    }
  }

  // 13. Revision Records
  console.log('🔄 Generating Daily Revision Records...');
  for (let sIdx = 0; sIdx < studentProfiles.length; sIdx++) {
    const student = studentProfiles[sIdx];
    const halaqaIdx = sIdx < 15 ? 0 : sIdx < 30 ? 1 : sIdx < 44 ? 2 : sIdx < 58 ? 3 : sIdx < 72 ? 4 : sIdx < 86 ? 5 : 6;
    const halaqa = halaqas[halaqaIdx];
    const teacher = teacherUsers[halaqaIdx];

    const revCount = 5 + (sIdx % 3);
    for (let r = 0; r < revCount; r++) {
      const revDate = new Date(now.getTime() - (r * 4 + 2) * 24 * 60 * 60 * 1000);
      const score = 88 + ((sIdx * 5 + r * 11) % 13);
      const rating = score >= 95 ? RecitationRating.EXCELLENT : RecitationRating.VERY_GOOD;

      await prisma.revisionRecord.create({
        data: {
          forumId: forum.id,
          halaqaId: halaqa.id,
          studentId: student.id,
          recordedById: teacher.id,
          date: revDate,
          surahNumber: 2,
          fromAyah: 1,
          toAyah: (r + 1) * 25,
          pageFrom: 1,
          pageTo: (r + 1) * 4,
          evaluationScore: score,
          rating,
          teacherNotes: 'مراجعة متقنة ومثبتة للحزب المستهدف',
        },
      });
    }
  }

  // 14. Exams & Results
  console.log('📝 Creating 10 Exams and Publishing Official Exam Results...');
  const examTitles = [
    { title: 'اختبار الحزب الأول من سورة البقرة', scope: 'البقرة (1 - 74)', type: ExamType.MONTHLY },
    { title: 'اختبار الحزب الثاني من سورة البقرة', scope: 'البقرة (75 - 141)', type: ExamType.MONTHLY },
    { title: 'اختبار نصف الفصل الدراسي الأول', scope: 'سورة البقرة كاملة', type: ExamType.MIDTERM },
    { title: 'اختبار إتقان مخارج الحروف والصفات', scope: 'متن الجزرية', type: ExamType.FINAL },
    { title: 'اختبار قصار السور والتلاوة العذبة', scope: 'جزء عم', type: ExamType.MONTHLY },
    { title: 'اختبار ضبط المتشابهات اللفظية', scope: 'سورة البقرة وآل عمران', type: ExamType.MONTHLY },
    { title: 'اختبار سورة آل عمران التراكمي', scope: 'سورة آل عمران', type: ExamType.MIDTERM },
    { title: 'اختبار أجزاء التلاوة الخمسة الأولى', scope: 'الأجزاء 1 إلى 5', type: ExamType.FINAL },
    { title: 'اختبار تثبيت ربع يس', scope: 'سورة يس والصافات', type: ExamType.MONTHLY },
    { title: 'اختبار الاختبار الفتري الشامل', scope: 'المقرر الفصلي الكامل', type: ExamType.FINAL },
  ];

  for (let eIdx = 0; eIdx < examTitles.length; eIdx++) {
    const eDef = examTitles[eIdx];
    const exam = await prisma.exam.create({
      data: {
        forumId: forum.id,
        branchId: branchMain.id,
        academicYearId: academicYear.id,
        termId: term1.id,
        title: eDef.title,
        description: `الاختبار النموذجي لتقييم الحفظ والضبط في مقرر (${eDef.scope})`,
        curriculum: eDef.scope,
        examType: eDef.type,
        status: eIdx < 8 ? ExamStatus.PUBLISHED : ExamStatus.SCHEDULED,
        isPublished: eIdx < 8,
        publishedAt: eIdx < 8 ? new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) : null,
        maxScore: 100,
        passScore: 70,
        scheduledDate: new Date(now.getTime() - (15 - eIdx) * 24 * 60 * 60 * 1000),
      },
    });
    manifest.examIds.push(exam.id);

    // Criteria
    await prisma.examCriterion.create({
      data: { examId: exam.id, name: 'صحة وجودة الحفظ واستحضار الآيات', maxScore: 50, order: 1 },
    });
    await prisma.examCriterion.create({
      data: { examId: exam.id, name: 'أحكام التجويد والترتيل والوقف والابتداء', maxScore: 30, order: 2 },
    });
    await prisma.examCriterion.create({
      data: { examId: exam.id, name: 'حسن الصوت والأداء والانضباط', maxScore: 20, order: 3 },
    });

    // Grade students if published
    if (eIdx < 8) {
      for (let s = 0; s < studentProfiles.length; s++) {
        if (s % 3 === eIdx % 3 || s < 30) {
          const student = studentProfiles[s];
          const score = 70 + ((s * 7 + eIdx * 11) % 31);
          await prisma.examResult.create({
            data: {
              examId: exam.id,
              studentId: student.id,
              score,
              percentage: score,
              status: ExamResultStatus.APPROVED,
              isPassed: score >= 70,
              notes: score >= 90 ? 'أداء استثنائي متميز وإتقان مشهود' : 'أداء جيد جداً مع التوصية بمزيد من الضبط',
              gradedById: supUser.id,
              gradedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
              isPublished: true,
              publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
            },
          });
        }
      }
    }
  }

  // 15. Student Periodic Evaluations
  console.log('⭐ Creating Periodic Student Evaluations...');
  for (let sIdx = 0; sIdx < studentProfiles.length; sIdx++) {
    const student = studentProfiles[sIdx];
    const halaqaIdx = sIdx < 15 ? 0 : sIdx < 30 ? 1 : sIdx < 44 ? 2 : sIdx < 58 ? 3 : sIdx < 72 ? 4 : sIdx < 86 ? 5 : 6;
    const halaqa = halaqas[halaqaIdx];

    const score = 80 + (sIdx % 21);
    await prisma.studentEvaluation.create({
      data: {
        forumId: forum.id,
        halaqaId: halaqa.id,
        studentId: student.id,
        academicYearId: academicYear.id,
        termId: term1.id,
        evaluationDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        behaviorScore: 95,
        discipline: 90,
        participation: 92,
        overallScore: score,
        rating: score >= 90 ? StudentEvaluationRating.EXCELLENT : StudentEvaluationRating.VERY_GOOD,
        teacherNotes: 'طالب نموذج يحتذى به في الانضباط والأدب داخل الحلقة القرآنية',
        isPublished: true,
        evaluatorId: teacherUsers[halaqaIdx].id,
      },
    });
  }

  // 16. Evaluation Template, Field Visits & Supervisor Recommendations
  console.log('🧐 Setting up Supervisor Evaluation Template, 12 Field Visits, and Recommendations...');
  const evalTemplate = await prisma.evaluationTemplate.create({
    data: {
      forumId: forum.id,
      name: 'نموذج التقييم الفني الميداني الشامل للمشرف',
      description: 'النموذج المعياري لتقييم الحلقات والمعلمين ميدانياً',
      version: 1,
      isDefault: true,
      isActive: true,
    },
  });

  const axis1 = await prisma.evaluationAxis.create({
    data: { templateId: evalTemplate.id, name: 'التخطيط والإعداد التعليمي للحلقة', order: 1, weight: 25 },
  });
  const axis2 = await prisma.evaluationAxis.create({
    data: { templateId: evalTemplate.id, name: 'مهارات التسميع وضبط التجويد والترتيل', order: 2, weight: 30 },
  });
  const axis3 = await prisma.evaluationAxis.create({
    data: { templateId: evalTemplate.id, name: 'إدارة الحلقة والانضباط والتفاعل الإيجابي', order: 3, weight: 25 },
  });
  const axis4 = await prisma.evaluationAxis.create({
    data: { templateId: evalTemplate.id, name: 'المتابعة والتوثيق ورصد درجات الطلاب', order: 4, weight: 20 },
  });

  const crit1 = await prisma.evaluationCriterion.create({
    data: { axisId: axis1.id, name: 'وضوح الأهداف وملاءمة المقرر لمستوى الطلاب', maxScore: 5, weight: 25, order: 1, type: CriterionInputType.SCALE_5 },
  });
  const crit2 = await prisma.evaluationCriterion.create({
    data: { axisId: axis2.id, name: 'دقة تصحيح التلاوة وتطبيق أحكام التجويد', maxScore: 5, weight: 30, order: 1, type: CriterionInputType.SCALE_5 },
  });
  const crit3 = await prisma.evaluationCriterion.create({
    data: { axisId: axis3.id, name: 'توفير بيئة تربوية مشجعة وحسن استثمار الوقت', maxScore: 5, weight: 25, order: 1, type: CriterionInputType.SCALE_5 },
  });
  const crit4 = await prisma.evaluationCriterion.create({
    data: { axisId: axis4.id, name: 'انتظام رصد الحضور والتسميع في المنظومة الرقمية', maxScore: 5, weight: 20, order: 1, type: CriterionInputType.SCALE_5 },
  });

  // 12 Field Visits
  for (let v = 1; v <= 12; v++) {
    const halaqa = halaqas[(v - 1) % halaqas.length];
    const teacher = teacherProfiles[(v - 1) % teacherProfiles.length];
    const visitDate = new Date(now.getTime() - (40 - v * 3) * 24 * 60 * 60 * 1000);
    const status = v <= 9 ? VisitStatus.COMPLETED : v <= 11 ? VisitStatus.IN_PROGRESS : VisitStatus.PLANNED;

    const visit = await prisma.fieldVisit.create({
      data: {
        forumId: forum.id,
        branchId: halaqa.branchId,
        halaqaId: halaqa.id,
        teacherId: teacher.id,
        supervisorId: supProfile.id,
        visitNumber: `VISIT-2026-${String(v).padStart(3, '0')}`,
        visitType: VisitType.ROUTINE,
        status,
        scheduledDate: visitDate,
        startedAt: status !== VisitStatus.PLANNED ? visitDate : null,
        completedAt: status === VisitStatus.COMPLETED ? new Date(visitDate.getTime() + 2 * 60 * 60 * 1000) : null,
        reason: 'زيارة إشرافية دورية لمتابعة جودة التحفيظ وسير الخطة',
        summary: status === VisitStatus.COMPLETED ? 'تمت الزيارة بنجاح وتم الاطلاع على سجلات التسميع ومستويات الطلاب' : null,
        generalNotes: 'أداء متميز وتفاعل طيب من الطلاب والمعلم',
      },
    });

    if (status === VisitStatus.COMPLETED) {
      const scorePercentage = 88 + (v % 12);
      const evalReport = await prisma.fieldVisitEvaluation.create({
        data: {
          visitId: visit.id,
          templateId: evalTemplate.id,
          templateVersion: 1,
          templateNameSnapshot: evalTemplate.name,
          totalScore: (scorePercentage / 100) * 20,
          maxPossibleScore: 20,
          percentage: scorePercentage,
          level: scorePercentage >= 95 ? EvaluationLevel.EXCELLENT : EvaluationLevel.VERY_GOOD,
          status: EvaluationStatus.SUBMITTED,
          strengths: 'معلم متمكن، إدارة متميزة لوقت الحلقة، وأداء الطلاب مشرف جداً',
          improvementAreas: 'التركيز على مراجعة المتشابهات اللفظية',
          summary: 'زيارة ناجحة ومثمرة مع توصيات تحسين مستمرة',
          submittedAt: new Date(visitDate.getTime() + 2 * 60 * 60 * 1000),
        },
      });

      await prisma.criterionEvaluation.create({
        data: {
          evaluationId: evalReport.id,
          criterionId: crit1.id,
          axisNameSnapshot: axis1.name,
          criterionNameSnapshot: crit1.name,
          maxScoreSnapshot: 5,
          weightSnapshot: 25,
          score: 5,
          notes: 'تخطيط ممتاز',
        },
      });
      await prisma.criterionEvaluation.create({
        data: {
          evaluationId: evalReport.id,
          criterionId: crit2.id,
          axisNameSnapshot: axis2.name,
          criterionNameSnapshot: crit2.name,
          maxScoreSnapshot: 5,
          weightSnapshot: 30,
          score: 4.5,
          notes: 'تصحيح متقن',
        },
      });
      await prisma.criterionEvaluation.create({
        data: {
          evaluationId: evalReport.id,
          criterionId: crit3.id,
          axisNameSnapshot: axis3.name,
          criterionNameSnapshot: crit3.name,
          maxScoreSnapshot: 5,
          weightSnapshot: 25,
          score: 4.8,
          notes: 'بيئة إيجابية',
        },
      });
      await prisma.criterionEvaluation.create({
        data: {
          evaluationId: evalReport.id,
          criterionId: crit4.id,
          axisNameSnapshot: axis4.name,
          criterionNameSnapshot: crit4.name,
          maxScoreSnapshot: 5,
          weightSnapshot: 20,
          score: 4.5,
          notes: 'توثيق منتظم',
        },
      });

      // Add Recommendation
      if (v % 2 === 0) {
        const rec = await prisma.recommendation.create({
          data: {
            forumId: forum.id,
            branchId: halaqa.branchId,
            visitId: visit.id,
            halaqaId: halaqa.id,
            teacherId: teacher.id,
            supervisorId: supProfile.id,
            title: `توصية إشرافية لتعزيز الحفظ المتقن في ${halaqa.name}`,
            description: 'التركيز على تكثيف جلسات مراجعة المتشابهات اللفظية للطلاب المتقدمين قبل موعد الاختبار الفتري',
            domain: 'المناهج والضبط',
            priority: RecommendationPriority.MEDIUM,
            status: v <= 6 ? RecommendationStatus.COMPLETED : RecommendationStatus.OPEN,
            dueDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
            completedAt: v <= 6 ? new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000) : null,
          },
        });

        await prisma.recommendationFollowUp.create({
          data: {
            recommendationId: rec.id,
            status: v <= 6 ? RecommendationStatus.COMPLETED : RecommendationStatus.IN_PROGRESS,
            notes: 'تم إدراج جدول مراجعة المتشابهات أسبوعياً وإبلاغ أولياء الأمور بالتفاصيل',
          },
        });
      }
    }
  }

  // 17. System Notifications
  console.log('🔔 Generating System & In-App Notifications...');
  const notifDefs = [
    { user: gmUser, title: 'اكتمال خطط الفصل الدراسي الأول', body: 'تم اعتماد جميع خطط الحلقات القرآنية للفصل الدراسي الأول بنجاح' },
    { user: execUser, title: 'تقرير الأداء الأسبوعي للحلقات', body: 'تقرير مؤشرات الحضور ونسب الإنجاز الأسبوعية جاهز للمراجعة' },
    { user: supUser, title: 'تقرير الزيارة الميدانية المعتمدة', body: 'تم اعتماد تقرير الزيارة الميدانية لحلقة الفرقان بنجاح' },
    { user: teacherUsers[0], title: 'موعد الاختبار الفتري الأول', body: 'نود تذكيركم ببدء رصد درجات الاختبار الفتري لطلاب حلقة النور' },
    { user: parents[0], title: 'إشعار حضور متميز', body: 'حصل ابنكم محمد على نسبة حضور 100% خلال الشهر الحالي' },
    { user: students[0], title: 'وسام جديد!', body: 'مبارك! تم منحك وسام الطالب المتميز بالحفظ لإتقانك سورة البقرة' },
  ];

  for (const n of notifDefs) {
    await prisma.notification.create({
      data: {
        userId: n.user.id,
        title: n.title,
        body: n.body,
        type: NotificationType.SYSTEM,
        readAt: null,
      },
    });
  }

  // 18. Realtime Chat Groups & Messages
  console.log('💬 Creating Realtime Chat Channels and Initial Messages...');
  // Staff Group
  const staffConv = await prisma.conversation.create({
    data: {
      forumId: forum.id,
      title: 'مجموعة الكادر التعليمي والإشرافي العام',
      type: ConversationType.STAFF,
    },
  });
  await prisma.conversationMember.create({ data: { conversationId: staffConv.id, userId: gmUser.id, role: 'ADMIN' } });
  await prisma.conversationMember.create({ data: { conversationId: staffConv.id, userId: execUser.id, role: 'ADMIN' } });
  await prisma.conversationMember.create({ data: { conversationId: staffConv.id, userId: supUser.id, role: 'MEMBER' } });
  for (const t of teacherUsers) {
    await prisma.conversationMember.create({ data: { conversationId: staffConv.id, userId: t.id, role: 'MEMBER' } });
  }

  await prisma.chatMessage.create({
    data: {
      conversationId: staffConv.id,
      senderId: gmUser.id,
      text: 'السلام عليكم ورحمة الله وبركاته، مرحباً بجميع الإخوة المعلمين والمشرفين في ملتقى النور القرآني النموذجي.',
      type: ChatMessageType.TEXT,
    },
  });
  await prisma.chatMessage.create({
    data: {
      conversationId: staffConv.id,
      senderId: supUser.id,
      text: 'وعليكم السلام ورحمة الله وبركاته، نسأل الله التوفيق والسداد لخدمة كتابه الكريم.',
      type: ChatMessageType.TEXT,
    },
  });

  // Halaqa Groups
  for (let h = 0; h < halaqas.length; h++) {
    const halaqa = halaqas[h];
    const hConv = await prisma.conversation.create({
      data: {
        forumId: forum.id,
        title: `قناة التواصل - ${halaqa.name}`,
        type: ConversationType.HALAQA,
        halaqaId: halaqa.id,
      },
    });
    await prisma.conversationMember.create({ data: { conversationId: hConv.id, userId: teacherUsers[h].id, role: 'ADMIN' } });
    await prisma.chatMessage.create({
      data: {
        conversationId: hConv.id,
        senderId: teacherUsers[h].id,
        text: `أهلاً بكم في قناة التواصل الرسمية لـ (${halaqa.name}). يرجى متابعة المواعيد والتكاليف بانتظام.`,
        type: ChatMessageType.TEXT,
      },
    });
  }

  // 19. Activities & Competitions
  console.log('🏆 Creating 8 Activities, 4 Competitions, and Leaderboards...');
  const act1 = await prisma.activity.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      halaqaId: halaqas[0].id,
      title: 'المجلس القرآني الأسبوعي لسماع التلاوات العذبة',
      description: 'لقاء إيماني يجمع طلاب الحلقات لتلاوة آيات بينات مع التوجيه في مخارج الحروف والوقف والابتداء',
      location: 'جامع النور الكبير - القاعة الرئيسية',
      type: ActivityType.QURANIC,
      status: ActivityStatus.PUBLISHED,
      startsAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
      capacity: 100,
      createdById: execUser.id,
    },
  });
  manifest.activityIds.push(act1.id);

  for (let i = 0; i < 30; i++) {
    await prisma.activityParticipant.create({
      data: {
        activityId: act1.id,
        studentId: studentProfiles[i].id,
        nominationStatus: ParticipantNominationStatus.APPROVED,
        attendanceStatus: ParticipantAttendanceStatus.PRESENT,
      },
    });
  }

  const comp1 = await prisma.competition.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      title: 'مسابقة مزامير داوود السنوية للتلاوة والتجويد',
      description: 'مسابقة سنوية كبرى تهدف إلى تشجيع التلاوة المتقنة وتحسين أصوات الناشئة بالقرآن الكريم',
      category: CompetitionCategory.TAJWEED,
      status: CompetitionStatus.RESULTS_PUBLISHED,
      startsAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
      endsAt: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
      maxScore: 100,
      createdById: execUser.id,
    },
  });
  manifest.competitionIds.push(comp1.id);

  for (let i = 0; i < 20; i++) {
    await prisma.competitionParticipant.create({
      data: { competitionId: comp1.id, studentId: studentProfiles[i].id },
    });
    const score = 90 + (i % 11);
    await prisma.competitionResult.create({
      data: {
        competitionId: comp1.id,
        studentId: studentProfiles[i].id,
        score,
        rank: i + 1,
        notes: 'صوت شجي وتطبيق ممتاز لأحكام التجويد والصفات',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        gradedById: supUser.id,
      },
    });
  }

  // 20. Awards & Recognitions
  console.log('🎖️ Creating 5 Award Badges and Granting to Top Students...');
  const awardDefs = [
    { name: 'وسام الحافظ المتميز', desc: 'يمنح للطالب الذي أتم حفظ ومراجعة المقرر بجدارة وتفوق تام', icon: '🏆', points: 100 },
    { name: 'وسام المواظبة والانضباط', desc: 'يمنح للطلاب ذوي الحضور التام دون غياب طوال الفصل الدراسي', icon: '⭐', points: 80 },
    { name: 'وسام الترتيل العذب', desc: 'يمنح لإتقان مخارج الحروف وتطبيق أحكام التجويد والمدود', icon: '🎖️', points: 75 },
    { name: 'وسام التقدم السريع', desc: 'يمنح للطلاب الذين حققوا قفزة نوعية في سرعة الحفظ والإتقان', icon: '🚀', points: 60 },
    { name: 'وسام الطالب المثالي', desc: 'يمنح للأخلاق العالية والقدوة الحسنة في التعامل مع المعلم والزملاء', icon: '👑', points: 90 },
  ];

  for (let a = 0; a < awardDefs.length; a++) {
    const aDef = awardDefs[a];
    const award = await prisma.award.create({
      data: {
        forumId: forum.id,
        name: aDef.name,
        description: aDef.desc,
        iconKey: aDef.icon,
        type: AwardType.BADGE,
        points: aDef.points,
        isActive: true,
      },
    });
    manifest.awardIds.push(award.id);

    for (let s = 0; s < 10; s++) {
      await prisma.studentAward.create({
        data: {
          awardId: award.id,
          studentId: studentProfiles[(a * 5 + s) % studentProfiles.length].id,
          reason: aDef.desc,
          awardedById: teacherUsers[0].id,
          awardedAt: new Date(now.getTime() - (a * 5 + 3) * 24 * 60 * 60 * 1000),
        },
      });
    }
  }

  // 21. General Shelf Sections & Items
  console.log('📚 Setting up General Shelf Sections & Articles...');
  const shelfSec1 = await prisma.shelfSection.create({
    data: {
      forumId: forum.id,
      name: 'إعلانات وتوجيهات الملتقى',
      slug: 'announcements-and-guidance',
      description: 'اللوائح التنظيمية والإعلانات الرسمية الصادرة من إدارة الملتقى',
      order: 1,
      isActive: true,
      visibility: ShelfVisibility.ALL_USERS,
    },
  });
  manifest.shelfSectionIds.push(shelfSec1.id);

  await prisma.shelfPublisherRule.create({
    data: { sectionId: shelfSec1.id, roleId: roleMap['GENERAL_MANAGER'], canCreate: true, canPublish: true },
  });
  await prisma.shelfPublisherRule.create({
    data: { sectionId: shelfSec1.id, roleId: roleMap['EXECUTIVE_MANAGER'], canCreate: true, canPublish: true },
  });

  await prisma.shelfItem.create({
    data: {
      forumId: forum.id,
      sectionId: shelfSec1.id,
      title: 'الدليل الإرشادي لحفظ القرآن الكريم وتثبيته',
      content: 'بسم الله الرحمن الرحيم. يسر إدارة ملتقى النور القرآني النموذجي أن تضع بين أيديكم الدليل الإرشادي الشامل لطرق الحفظ المتقن والمراجعة المستمرة...',
      type: ShelfContentType.ARTICLE,
      isPinned: true,
      isPublished: true,
      publishedAt: new Date(),
      targetAudience: ShelfVisibility.ALL_USERS,
      authorId: gmUser.id,
      authorName: gmUser.displayName,
      authorRole: 'المدير العام',
    },
  });

  // 22. Administrative Workflows (Requests, Decisions, Tasks, Alerts)
  console.log('⚖️ Creating Administrative Workflows, Decisions, Tasks, and Alerts...');
  const adminReq1 = await prisma.administrativeRequest.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      type: AdminRequestType.CURRICULUM_MODIFICATION,
      title: 'طلب اعتماد خطة تحفيظ مكثفة لطلاب حلقة النور',
      description: 'نظراً لإقبال الطلاب واستعدادهم العالي، نقترح مضاعفة مقدار الحفظ اليومي إلى صفحتين مع جلسة تثبيت أسبوعية',
      requestedById: teacherUsers[0].id,
      status: AdminRequestStatus.APPROVED,
      priority: AdminPriority.HIGH,
      submittedAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000),
      resolvedAt: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000),
    },
  });

  await prisma.approvalAction.create({
    data: {
      requestId: adminReq1.id,
      actorId: gmUser.id,
      action: ApprovalActionType.APPROVED,
      comment: 'تمت الموافقة واعتماد الخطة المقترحة مع متابعة التقييم الفني للمشرف',
    },
  });

  const decision1 = await prisma.adminDecision.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      decisionNumber: 'DEC-2026-001',
      title: 'قرار اعتماد جدول الاختبارات الفترية للفصل الدراسي الأول',
      content: 'بناءً على الصلاحيات المخولة للمدير العام، يعتمد جدول الاختبارات الفترية لجميع الحلقات القرآنية...',
      type: AdminDecisionType.GENERAL_DIRECTIVE,
      status: AdminDecisionStatus.ISSUED,
      issuedById: gmUser.id,
      issuedAt: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000),
    },
  });
  manifest.decisionIds.push(decision1.id);

  await prisma.decisionAudience.create({
    data: { decisionId: decision1.id, targetType: DecisionTargetType.ALL_FORUM },
  });

  const task1 = await prisma.adminTask.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      title: 'مراجعة وتدقيق درجات الاختبار الفتري الأول لفرع الروضة',
      description: 'يرجى من المشرف الفني مراجعة سجلات الاختبارات واعتماد النتائج في المنظومة قبل نهاية الأسبوع',
      assignedToId: supUser.id,
      createdById: execUser.id,
      priority: AdminPriority.HIGH,
      status: AdminTaskStatus.IN_PROGRESS,
      dueAt: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    },
  });
  manifest.taskIds.push(task1.id);

  await prisma.taskFollowUp.create({
    data: {
      taskId: task1.id,
      actorId: supUser.id,
      status: AdminTaskStatus.IN_PROGRESS,
      note: 'تم الانتهاء من تدقيق 80% من الكشوفات وجاري استكمال المتبقي اليوم',
    },
  });

  await prisma.adminAlert.create({
    data: {
      forumId: forum.id,
      branchId: branchMain.id,
      type: AdminAlertType.TASK_OVERDUE,
      severity: AdminAlertSeverity.WARNING,
      title: 'تنبيه: اقتراب موعد تسليم تقارير الزيارات الميدانية',
      message: 'نود التذكير بضرورة إغلاق تقارير الزيارات الميدانية المفتوحة قبل نهاية الشهر الجاري',
      assignedToId: supUser.id,
      status: AdminAlertStatus.OPEN,
      dueAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000),
    },
  });

  // Save Manifest locally (untracked)
  const localDir = path.join(__dirname, '../.local');
  if (!fs.existsSync(localDir)) {
    fs.mkdirSync(localDir, { recursive: true });
  }
  const manifestPath = path.join(localDir, 'full-demo-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf-8');

  console.log('\n==================================================');
  console.log('✅ FULL DEMO DATASET SEEDED SUCCESSFULLY');
  console.log('==================================================');
  console.log(`Forum Name   : ${forum.name}`);
  console.log(`Forum Slug   : ${forum.slug}`);
  console.log(`Branches     : 3`);
  console.log(`Teachers     : 7`);
  console.log(`Halaqas      : 7`);
  console.log(`Students     : 100 (100% authentic records)`);
  console.log(`Parents      : 70`);
  console.log(`Manifest File: ${manifestPath}`);
  console.log('==================================================\n');
}

main()
  .catch((e) => {
    console.error('\n❌ SEEDING FAILED WITH ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
