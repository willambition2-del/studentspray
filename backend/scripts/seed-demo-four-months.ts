import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import * as argon2 from 'argon2';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PrismaClient,
  Prisma,
  ActivityStatus,
  ActivityType,
  AdminPriority,
  AdminRequestStatus,
  AdminRequestType,
  AdminTaskStatus,
  AttendanceStatus,
  AwardType,
  ChatMessageType,
  CompetitionCategory,
  CompetitionStatus,
  ConversationType,
  EducationalPlanStatus,
  EducationalPlanType,
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
  VisitStatus,
  VisitType,
} from '../src/generated/prisma/client';
import { PERMISSION_CATALOG, ROLE_PERMISSION_DEFAULTS } from '../src/authorization/permission-catalog';
import { normalizeEmail, normalizePhone, normalizeUsername } from '../src/auth/utils/identifier';
import { cleanDemoFourMonths, DEMO_FORUM_SLUG } from './clean-demo-four-months';

// Deterministic PRNG
class DeterministicRandom {
  private seed: number;
  constructor(seed = 20260820) {
    this.seed = seed;
  }
  next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  nextInt(min: number, max: number): number {
    return Math.floor(min + this.next() * (max - min + 1));
  }
  choice<T>(arr: T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: T[]): T[] {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }
}

const rng = new DeterministicRandom(20260820);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const DEFAULT_DEMO_PASSWORD = process.env.DEMO_SEED_PASSWORD || 'Demo@Quran2026!Secure';

const START_DATE = new Date('2026-04-20T08:00:00.000Z');
const END_DATE = new Date('2026-08-20T12:00:00.000Z');

const ARABIC_FIRST_NAMES = [
  'محمد', 'أحمد', 'عبد الله', 'إبراهيم', 'علي', 'عمر', 'خالد', 'يوسف', 'حمزة', 'عبد الرحمن',
  'صالح', 'فهد', 'سعد', 'طارق', 'حسان', 'سليمان', 'أنس', 'مصعب', 'معاذ', 'ياسر',
  'بلال', 'أسامة', 'عبد العزيز', 'فيصل', 'سعود', 'تركي', 'ماجد', 'بدر', 'ناصر', 'سلطان',
  'عثمان', 'معاوية', 'حميد', 'صقر', 'عمرو', 'زهير', 'يزيد', 'هاشم', 'أمير', 'ريان',
  'زياد', 'إياس', 'يمان', 'براء', 'قتيبة', 'ثابت', 'عاصم', 'نافع', 'ورش', 'حفص',
  'تميم', 'ضرار', 'مهند', 'حاتم', 'سهيل', 'حذيفة', 'عمار', 'طلحة', 'سعيد', 'جعفر'
];

const ARABIC_LAST_NAMES = [
  'القاسمي', 'الحداد', 'العريقي', 'المنشاوي', 'القباطي', 'الصبري', 'العنسي', 'الورد', 'الشامي', 'الحرازي',
  'السعيد', 'المنصور', 'التميمي', 'الغامدي', 'القحطاني', 'الدوسري', 'الشهري', 'القرني', 'العتيبي', 'المطيري',
  'الحربي', 'الزهراني', 'الأحمدي', 'الناصر', 'الرشيد', 'الأنصاري', 'البكري', 'العدناني', 'الحسني', 'العلوي',
  'اليماني', 'الصنعاني', 'العدني', 'التعزي', 'المأربي', 'الحضرمي', 'الجوفي', 'الإبي', 'الذماري', 'الزبيدي',
  'العولقي', 'اليافعي', 'الكندي', 'الهمداني', 'الحميري', 'الأكوع', 'الشوكاني', 'المتوكل', 'الشرفي', 'الوزير'
];

const SURAHS = [
  { number: 1, name: 'الفاتحة', ayahs: 7 },
  { number: 2, name: 'البقرة', ayahs: 286 },
  { number: 3, name: 'آل عمران', ayahs: 200 },
  { number: 4, name: 'النساء', ayahs: 176 },
  { number: 18, name: 'الكهف', ayahs: 110 },
  { number: 36, name: 'يس', ayahs: 83 },
  { number: 55, name: 'الرحمن', ayahs: 78 },
  { number: 56, name: 'الواقعة', ayahs: 96 },
  { number: 67, name: 'الملك', ayahs: 30 },
  { number: 78, name: 'النبأ', ayahs: 40 },
  { number: 79, name: 'النازعات', ayahs: 46 },
  { number: 80, name: 'عبس', ayahs: 42 },
  { number: 81, name: 'التكوير', ayahs: 29 },
  { number: 82, name: 'الانفطار', ayahs: 19 },
  { number: 83, name: 'المطففين', ayahs: 36 },
  { number: 84, name: 'الانشقاق', ayahs: 25 },
  { number: 85, name: 'البروج', ayahs: 22 },
  { number: 86, name: 'الطارق', ayahs: 17 },
  { number: 87, name: 'الأعلى', ayahs: 19 },
  { number: 88, name: 'الغاشية', ayahs: 26 },
  { number: 89, name: 'الفجر', ayahs: 30 },
  { number: 90, name: 'البلد', ayahs: 20 },
  { number: 91, name: 'الشمس', ayahs: 15 },
  { number: 92, name: 'الليل', ayahs: 21 },
  { number: 93, name: 'الضحى', ayahs: 11 },
  { number: 94, name: 'الشرح', ayahs: 8 },
  { number: 95, name: 'التين', ayahs: 8 },
  { number: 96, name: 'العلق', ayahs: 19 },
  { number: 97, name: 'القدر', ayahs: 5 },
  { number: 98, name: 'البينة', ayahs: 8 },
  { number: 99, name: 'الزلزلة', ayahs: 8 },
  { number: 100, name: 'العاديات', ayahs: 11 },
  { number: 101, name: 'القارعة', ayahs: 11 },
  { number: 102, name: 'التكاثر', ayahs: 8 },
  { number: 103, name: 'العصر', ayahs: 3 },
  { number: 104, name: 'الهمزة', ayahs: 9 },
  { number: 105, name: 'الفيل', ayahs: 5 },
  { number: 106, name: 'قريش', ayahs: 4 },
  { number: 107, name: 'الماعون', ayahs: 7 },
  { number: 108, name: 'الكوثر', ayahs: 3 },
  { number: 109, name: 'الكافرون', ayahs: 6 },
  { number: 110, name: 'النصر', ayahs: 3 },
  { number: 111, name: 'المسد', ayahs: 5 },
  { number: 112, name: 'الإخلاص', ayahs: 4 },
  { number: 113, name: 'الفلق', ayahs: 5 },
  { number: 114, name: 'الناس', ayahs: 6 },
];

let _conversationMemberColumns: Set<string> | null = null;

/**
 * Safe raw-SQL insertion for ConversationMember that reconciles production
 * schema drift (e.g. NOT NULL constraint on "updatedAt" and "createdAt") seamlessly.
 */
export async function safeInsertConversationMember(
  client: PrismaClient,
  data: {
    conversationId: string;
    userId: string;
    role?: string | null;
    isActive?: boolean;
    lastReadAt?: Date | null;
    lastReadMessageId?: string | null;
    joinedAt?: Date | null;
  },
) {
  const id = crypto.randomUUID();
  const joinedAt = data.joinedAt ?? new Date();
  const isActive = data.isActive ?? true;
  const role = data.role ?? null;
  const lastReadAt = data.lastReadAt ?? null;
  const lastReadMessageId = data.lastReadMessageId ?? null;

  if (_conversationMemberColumns === null) {
    const cols: any[] = await client.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'ConversationMember'
    `;
    _conversationMemberColumns = new Set(cols.map((c) => c.column_name));
  }

  const hasCreatedAt = _conversationMemberColumns.has('createdAt');
  const hasUpdatedAt = _conversationMemberColumns.has('updatedAt');

  if (hasCreatedAt && hasUpdatedAt) {
    await client.$executeRaw`
      INSERT INTO "ConversationMember" (
        "id", "conversationId", "userId", "role", "isActive", "joinedAt", "createdAt", "updatedAt", "lastReadAt", "lastReadMessageId"
      )
      VALUES (
        ${id}::uuid,
        ${data.conversationId}::uuid,
        ${data.userId}::uuid,
        ${role},
        ${isActive},
        ${joinedAt},
        now(),
        now(),
        ${lastReadAt},
        ${lastReadMessageId ? Prisma.raw(`'${lastReadMessageId}'::uuid`) : null}
      )
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET
        "role" = EXCLUDED."role",
        "isActive" = EXCLUDED."isActive",
        "lastReadAt" = EXCLUDED."lastReadAt",
        "lastReadMessageId" = EXCLUDED."lastReadMessageId",
        "updatedAt" = now()
    `;
  } else if (hasUpdatedAt) {
    await client.$executeRaw`
      INSERT INTO "ConversationMember" (
        "id", "conversationId", "userId", "role", "isActive", "joinedAt", "updatedAt", "lastReadAt", "lastReadMessageId"
      )
      VALUES (
        ${id}::uuid,
        ${data.conversationId}::uuid,
        ${data.userId}::uuid,
        ${role},
        ${isActive},
        ${joinedAt},
        now(),
        ${lastReadAt},
        ${lastReadMessageId ? Prisma.raw(`'${lastReadMessageId}'::uuid`) : null}
      )
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET
        "role" = EXCLUDED."role",
        "isActive" = EXCLUDED."isActive",
        "lastReadAt" = EXCLUDED."lastReadAt",
        "lastReadMessageId" = EXCLUDED."lastReadMessageId",
        "updatedAt" = now()
    `;
  } else {
    await client.$executeRaw`
      INSERT INTO "ConversationMember" (
        "id", "conversationId", "userId", "role", "isActive", "joinedAt", "lastReadAt", "lastReadMessageId"
      )
      VALUES (
        ${id}::uuid,
        ${data.conversationId}::uuid,
        ${data.userId}::uuid,
        ${role},
        ${isActive},
        ${joinedAt},
        ${lastReadAt},
        ${lastReadMessageId ? Prisma.raw(`'${lastReadMessageId}'::uuid`) : null}
      )
      ON CONFLICT ("conversationId", "userId")
      DO UPDATE SET
        "role" = EXCLUDED."role",
        "isActive" = EXCLUDED."isActive",
        "lastReadAt" = EXCLUDED."lastReadAt",
        "lastReadMessageId" = EXCLUDED."lastReadMessageId"
    `;
  }
}

export async function seedDemoFourMonths() {
  console.log('======================================================================');
  console.log('🚀 STUDENTSPRAY — 4-MONTH COMPREHENSIVE DEMO DATASET SEEDER');
  console.log('======================================================================\n');
  console.log(`Target Forum Slug: "${DEMO_FORUM_SLUG}"`);
  console.log(`Timeline: ${START_DATE.toISOString().split('T')[0]} → ${END_DATE.toISOString().split('T')[0]} (4 Full Months)`);

  let currentPhase = 'Initialization';

  try {
    // 0. Idempotency Check & Atomic Clean of Demo Forum if it already exists
    currentPhase = '0. Idempotent Cleanup';
    console.log(`\n🧹 [Phase ${currentPhase}] Cleaning existing demo forum if present...`);
    await cleanDemoFourMonths({ silent: false });

    const passwordHash = await argon2.hash(DEFAULT_DEMO_PASSWORD, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 1,
    });

    const credentialsList: { role: string; username: string; name: string; info: string }[] = [];

    // ========================================================================
    // 1. Forum / Org Structure
    // ========================================================================
    currentPhase = '1. Forum / Org Structure';
    console.log(`\n🏛️ [Phase ${currentPhase}] Creating Forum, Branches, Roles & Permissions...`);

    const forum = await prisma.forum.create({
      data: {
        name: 'ملتقى القرآن التجريبي',
        slug: DEMO_FORUM_SLUG,
        isActive: true,
      },
    });

    const branchMain = await prisma.branch.create({
      data: { forumId: forum.id, name: 'الفرع الرئيسي - النور', code: 'BRANCH_MAIN', isActive: true },
    });
    const branchRawdah = await prisma.branch.create({
      data: { forumId: forum.id, name: 'فرع الروضة القرآني', code: 'BRANCH_RAWDAH', isActive: true },
    });
    const branchItqan = await prisma.branch.create({
      data: { forumId: forum.id, name: 'فرع الإتقان والتجويد', code: 'BRANCH_ITQAN', isActive: true },
    });
    const branches = [branchMain, branchRawdah, branchItqan];

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
          description: `الدور النظامي لـ ${roleDisplayNames[roleName]}`,
          isSystem: true,
          isActive: true,
        },
      });
      roleMap[roleName] = role.id;

      for (const permCode of permissions) {
        const perm = await prisma.permission.findUnique({ where: { code: permCode } });
        if (perm) {
          await prisma.rolePermission.create({
            data: { roleId: role.id, permissionId: perm.id },
          });
        }
      }
    }

    // ========================================================================
    // 2. Users / Profiles (Management, Supervisors, Teachers)
    // ========================================================================
    currentPhase = '2. Users / Profiles';
    console.log(`👤 [Phase ${currentPhase}] Creating Management, Supervisors, and 10 Teachers...`);

    const gmUser = await prisma.user.create({
      data: {
        forumId: forum.id,
        branchId: branchMain.id,
        username: 'demo_gm',
        usernameNormalized: normalizeUsername('demo_gm'),
        email: 'demo_gm@quranforum.demo',
        emailNormalized: normalizeEmail('demo_gm@quranforum.demo'),
        phone: '0550001001',
        phoneNormalized: normalizePhone('0550001001'),
        displayName: 'أ. عبد الله محمد القاسمي',
        passwordHash,
        isActive: true,
      },
    });
    await prisma.userRole.create({ data: { userId: gmUser.id, roleId: roleMap['GENERAL_MANAGER'], branchId: branchMain.id } });
    credentialsList.push({ role: 'GENERAL_MANAGER', username: 'demo_gm', name: 'أ. عبد الله محمد القاسمي', info: 'المدير العام' });

    const execUser = await prisma.user.create({
      data: {
        forumId: forum.id,
        branchId: branchMain.id,
        username: 'demo_exec',
        usernameNormalized: normalizeUsername('demo_exec'),
        email: 'demo_exec@quranforum.demo',
        emailNormalized: normalizeEmail('demo_exec@quranforum.demo'),
        phone: '0550001002',
        phoneNormalized: normalizePhone('0550001002'),
        displayName: 'أ. خالد أحمد العريقي',
        passwordHash,
        isActive: true,
      },
    });
    await prisma.userRole.create({ data: { userId: execUser.id, roleId: roleMap['EXECUTIVE_MANAGER'], branchId: branchMain.id } });
    credentialsList.push({ role: 'EXECUTIVE_MANAGER', username: 'demo_exec', name: 'أ. خالد أحمد العريقي', info: 'المدير التنفيذي' });

    const supervisorDefs = [
      { username: 'demo_supervisor', name: 'أ. عبد الرحمن علي الحداد', phone: '0550001003', branch: branchMain, spec: 'إشراف تعليمي وتجويد بالقراءات العشر' },
      { username: 'demo_supervisor_02', name: 'أ. حسان إبراهيم التميمي', phone: '0550001004', branch: branchItqan, spec: 'إشراف فني ومناهج التحفيظ والإتقان' },
    ];

    const supervisorUsers: any[] = [];
    const supervisorProfiles: any[] = [];

    for (let i = 0; i < supervisorDefs.length; i++) {
      const sDef = supervisorDefs[i];
      const sUser = await prisma.user.create({
        data: {
          forumId: forum.id,
          branchId: sDef.branch.id,
          username: sDef.username,
          usernameNormalized: normalizeUsername(sDef.username),
          email: `${sDef.username}@quranforum.demo`,
          emailNormalized: normalizeEmail(`${sDef.username}@quranforum.demo`),
          phone: sDef.phone,
          phoneNormalized: normalizePhone(sDef.phone),
          displayName: sDef.name,
          passwordHash,
          isActive: true,
        },
      });
      await prisma.userRole.create({ data: { userId: sUser.id, roleId: roleMap['TECHNICAL_SUPERVISOR'], branchId: sDef.branch.id } });
      const sProf = await prisma.supervisorProfile.create({
        data: {
          userId: sUser.id,
          employeeNumber: `SUP-2026-00${i + 1}`,
          specialization: sDef.spec,
        },
      });
      supervisorUsers.push(sUser);
      supervisorProfiles.push(sProf);
      credentialsList.push({ role: 'TECHNICAL_SUPERVISOR', username: sDef.username, name: sDef.name, info: sDef.spec });
    }

    const teacherDefs = [
      { username: 'demo_teacher', name: 'أ. أحمد محمد المنشاوي', branch: branchMain, phone: '0551001001', spec: 'حفظ ومراجعة متقدمة' },
      { username: 'demo_teacher_02', name: 'أ. ياسر عبد الله القباطي', branch: branchMain, phone: '0551001002', spec: 'تجويد وقراءات' },
      { username: 'demo_teacher_03', name: 'أ. محمد علي الصبري', branch: branchMain, phone: '0551001003', spec: 'حفظ وتثبيت' },
      { username: 'demo_teacher_04', name: 'أ. إبراهيم أحمد العنسي', branch: branchMain, phone: '0551001004', spec: 'تلاوة وأداء قرآني' },
      { username: 'demo_teacher_05', name: 'أ. عبد الكريم صالح الورد', branch: branchRawdah, phone: '0551001005', spec: 'تحفيظ ناشئة وشباب' },
      { username: 'demo_teacher_06', name: 'أ. أسامة محمد الشامي', branch: branchRawdah, phone: '0551001006', spec: 'إتقان ومخارج حروف' },
      { username: 'demo_teacher_07', name: 'أ. أنس عبد الله الحرازي', branch: branchRawdah, phone: '0551001007', spec: 'حفظ مكثف' },
      { username: 'demo_teacher_08', name: 'أ. طارق عبد الرحمن السعيد', branch: branchItqan, phone: '0551001008', spec: 'قراءات وإجازات' },
      { username: 'demo_teacher_09', name: 'أ. سليمان خالد المنصور', branch: branchItqan, phone: '0551001009', spec: 'تفسير وتدبر' },
      { username: 'demo_teacher_10', name: 'أ. مصعب يوسف القحطاني', branch: branchItqan, phone: '0551001010', spec: 'حفظ وتجويد' },
    ];

    const teacherUsers: any[] = [];
    const teacherProfiles: any[] = [];

    for (let i = 0; i < teacherDefs.length; i++) {
      const tDef = teacherDefs[i];
      const tUser = await prisma.user.create({
        data: {
          forumId: forum.id,
          branchId: tDef.branch.id,
          username: tDef.username,
          usernameNormalized: normalizeUsername(tDef.username),
          email: `${tDef.username}@quranforum.demo`,
          emailNormalized: normalizeEmail(`${tDef.username}@quranforum.demo`),
          phone: tDef.phone,
          phoneNormalized: normalizePhone(tDef.phone),
          displayName: tDef.name,
          passwordHash,
          isActive: true,
        },
      });
      await prisma.userRole.create({ data: { userId: tUser.id, roleId: roleMap['TEACHER'], branchId: tDef.branch.id } });
      const tProf = await prisma.teacherProfile.create({
        data: {
          userId: tUser.id,
          employeeNumber: `TCH-2026-${String(i + 1).padStart(3, '0')}`,
          specialization: tDef.spec,
        },
      });
      teacherUsers.push(tUser);
      teacherProfiles.push(tProf);
      credentialsList.push({ role: 'TEACHER', username: tDef.username, name: tDef.name, info: `المعلم (${tDef.branch.name})` });
    }

    // ========================================================================
    // 3. Halaqas / Students / Parents
    // ========================================================================
    currentPhase = '3. Halaqas / Students';
    console.log(`📖 [Phase ${currentPhase}] Creating 10 Halaqas, 150 Students, and 130 Parents...`);

    const halaqaDefs = [
      { name: 'حلقة الإمام نافع المدني', code: 'HAL-NAFE', branch: branchMain, teacherIdx: 0, supIdx: 0, targetStudents: 12 },
      { name: 'حلقة الإمام عاصم الكوفي', code: 'HAL-ASEM', branch: branchMain, teacherIdx: 1, supIdx: 0, targetStudents: 13 },
      { name: 'حلقة الإمام ابن كثير المكي', code: 'HAL-KATHEER', branch: branchMain, teacherIdx: 2, supIdx: 0, targetStudents: 14 },
      { name: 'حلقة الإمام أبي عمرو البصري', code: 'HAL-AMR', branch: branchMain, teacherIdx: 3, supIdx: 0, targetStudents: 14 },
      { name: 'حلقة الإمام حمزة الكوفي', code: 'HAL-HAMZAH', branch: branchRawdah, teacherIdx: 4, supIdx: 0, targetStudents: 15 },
      { name: 'حلقة الإمام الكسائي', code: 'HAL-KESAI', branch: branchRawdah, teacherIdx: 5, supIdx: 0, targetStudents: 15 },
      { name: 'حلقة الإمام ابن عامر الشامي', code: 'HAL-AAMER', branch: branchRawdah, teacherIdx: 6, supIdx: 0, targetStudents: 16 },
      { name: 'حلقة الإمام يعقوب الحضرمي', code: 'HAL-YAQOUB', branch: branchItqan, teacherIdx: 7, supIdx: 1, targetStudents: 16 },
      { name: 'حلقة الإمام خلف العاشر', code: 'HAL-KHALAF', branch: branchItqan, teacherIdx: 8, supIdx: 1, targetStudents: 17 },
      { name: 'حلقة الإمام أبي جعفر المدني', code: 'HAL-JAFAR', branch: branchItqan, teacherIdx: 9, supIdx: 1, targetStudents: 18 },
    ];

    const halaqas: any[] = [];
    for (let i = 0; i < halaqaDefs.length; i++) {
      const hDef = halaqaDefs[i];
      const halaqa = await prisma.halaqa.create({
        data: {
          forumId: forum.id,
          branchId: hDef.branch.id,
          name: hDef.name,
          code: hDef.code,
          description: `حلقة قرآنية مباركة لتعليم التلاوة والحفظ والإتقان - ${hDef.branch.name}`,
          isActive: true,
        },
      });

      await prisma.halaqaTeacher.create({
        data: {
          halaqaId: halaqa.id,
          teacherId: teacherProfiles[hDef.teacherIdx].id,
          startedAt: START_DATE,
          isActive: true,
        },
      });

      await prisma.halaqaSupervisor.create({
        data: {
          halaqaId: halaqa.id,
          supervisorId: supervisorProfiles[hDef.supIdx].id,
          startedAt: START_DATE,
          isActive: true,
        },
      });

      halaqas.push({ ...halaqa, targetStudents: hDef.targetStudents, teacherIdx: hDef.teacherIdx });
    }

    const studentUsers: any[] = [];
    const studentProfiles: any[] = [];
    const parentUsers: any[] = [];
    const parentProfiles: any[] = [];

    const familyConfigs: number[] = [];
    for (let i = 0; i < 112; i++) familyConfigs.push(1);
    for (let i = 0; i < 16; i++) familyConfigs.push(2);
    for (let i = 0; i < 2; i++) familyConfigs.push(3);

    let currentStudentIdx = 1;
    let currentParentIdx = 1;

    for (const childCount of familyConfigs) {
      const pUsername = currentParentIdx === 1 ? 'demo_parent' : `demo_parent_${String(currentParentIdx).padStart(3, '0')}`;
      const pLastName = rng.choice(ARABIC_LAST_NAMES);
      const pFirstName = rng.choice(ARABIC_FIRST_NAMES);
      const pName = `أ. ${pFirstName} ${rng.choice(ARABIC_FIRST_NAMES)} ${pLastName}`;
      const pPhone = `0553${String(currentParentIdx).padStart(6, '0')}`;

      const pUser = await prisma.user.create({
        data: {
          forumId: forum.id,
          branchId: branchMain.id,
          username: pUsername,
          usernameNormalized: normalizeUsername(pUsername),
          email: `${pUsername}@quranforum.demo`,
          emailNormalized: normalizeEmail(`${pUsername}@quranforum.demo`),
          phone: pPhone,
          phoneNormalized: normalizePhone(pPhone),
          displayName: pName,
          passwordHash,
          isActive: true,
        },
      });
      await prisma.userRole.create({ data: { userId: pUser.id, roleId: roleMap['PARENT'], branchId: branchMain.id } });
      const pProf = await prisma.parentProfile.create({
        data: {
          userId: pUser.id,
          occupation: 'موظف وأب كريم',
        },
      });
      parentUsers.push(pUser);
      parentProfiles.push(pProf);

      if (currentParentIdx <= 5) {
        credentialsList.push({ role: 'PARENT', username: pUsername, name: pName, info: `ولي أمر (${childCount} أبناء)` });
      }

      for (let c = 0; c < childCount; c++) {
        const sUsername = currentStudentIdx === 1 ? 'demo_student' : `demo_student_${String(currentStudentIdx).padStart(3, '0')}`;
        const sFirstName = rng.choice(ARABIC_FIRST_NAMES);
        const sName = `${sFirstName} ${pFirstName} ${pLastName}`;
        const sPhone = `0554${String(currentStudentIdx).padStart(6, '0')}`;

        const persona = rng.next() < 0.25 ? 0 : (rng.next() < 0.80 ? 1 : 2);

        const sUser = await prisma.user.create({
          data: {
            forumId: forum.id,
            branchId: branchMain.id,
            username: sUsername,
            usernameNormalized: normalizeUsername(sUsername),
            email: `${sUsername}@quranforum.demo`,
            emailNormalized: normalizeEmail(`${sUsername}@quranforum.demo`),
            phone: sPhone,
            phoneNormalized: normalizePhone(sPhone),
            displayName: sName,
            passwordHash,
            isActive: true,
          },
        });
        await prisma.userRole.create({ data: { userId: sUser.id, roleId: roleMap['STUDENT'], branchId: branchMain.id } });
        const sProf = await prisma.studentProfile.create({
          data: {
            userId: sUser.id,
            studentNumber: `STU-2026-${String(currentStudentIdx).padStart(4, '0')}`,
            dateOfBirth: new Date('2012-05-10T00:00:00.000Z'),
            enrollmentDate: START_DATE,
          },
        });

        await prisma.studentGuardian.create({
          data: {
            studentId: sProf.id,
            parentId: pProf.id,
            relationship: GuardianRelationship.FATHER,
            isPrimary: true,
          },
        });

        studentUsers.push(sUser);
        studentProfiles.push({ ...sProf, name: sName, persona, sUser, halaqaId: '' });

        if (currentStudentIdx <= 5) {
          credentialsList.push({ role: 'STUDENT', username: sUsername, name: sName, info: 'طالب متميز' });
        }

        currentStudentIdx++;
      }
      currentParentIdx++;
    }

    let studentOffset = 0;
    const halaqaStudentsMap: Map<string, any[]> = new Map();

    for (const h of halaqas) {
      const studentsForHalaqa = studentProfiles.slice(studentOffset, studentOffset + h.targetStudents);
      studentOffset += h.targetStudents;
      for (const s of studentsForHalaqa) {
        s.halaqaId = h.id;
      }
      halaqaStudentsMap.set(h.id, studentsForHalaqa);

      for (const st of studentsForHalaqa) {
        await prisma.halaqaMember.create({
          data: {
            halaqaId: h.id,
            studentId: st.id,
            status: HalaqaMemberStatus.ACTIVE,
            startedAt: START_DATE,
            isActive: true,
          },
        });
      }
    }

    // ========================================================================
    // 4. Academic History & Plans
    // ========================================================================
    currentPhase = '4. Academic History & Plans';
    console.log(`⏱️ [Phase ${currentPhase}] Generating Academic Year, Terms, Plans, and 4 Months Attendance...`);

    const academicYear = await prisma.academicYear.create({
      data: {
        forumId: forum.id,
        name: 'العام النموذجي 1447-1448 هـ / 2026 م',
        startsAt: START_DATE,
        endsAt: new Date('2026-12-31T23:59:59.000Z'),
        isActive: true,
      },
    });

    const term1 = await prisma.term.create({
      data: {
        academicYearId: academicYear.id,
        name: 'الفصل الدراسي الأول',
        startsAt: START_DATE,
        endsAt: new Date('2026-06-20T23:59:59.000Z'),
        order: 1,
        isActive: false,
      },
    });

    const term2 = await prisma.term.create({
      data: {
        academicYearId: academicYear.id,
        name: 'الفصل الدراسي الصيفي المكثف',
        startsAt: new Date('2026-06-21T00:00:00.000Z'),
        endsAt: END_DATE,
        order: 2,
        isActive: true,
      },
    });

    for (let i = 0; i < halaqas.length; i++) {
      const h = halaqas[i];
      const plan = await prisma.educationalPlan.create({
        data: {
          forumId: forum.id,
          branchId: h.branchId,
          halaqaId: h.id,
          termId: term2.id,
          name: `خطة الحفظ والإتقان الصيفية - ${h.name}`,
          type: EducationalPlanType.HIFZ,
          status: EducationalPlanStatus.ACTIVE,
          startDate: START_DATE,
          endDate: END_DATE,
        },
      });

      await prisma.educationalPlanItem.createMany({
        data: [
          { planId: plan.id, type: PlanItemType.MEMORIZATION, surahNumber: 78, fromAyah: 1, toAyah: 40, order: 1, status: PlanItemStatus.COMPLETED },
          { planId: plan.id, type: PlanItemType.MEMORIZATION, surahNumber: 67, fromAyah: 1, toAyah: 30, order: 2, status: PlanItemStatus.COMPLETED },
          { planId: plan.id, type: PlanItemType.MEMORIZATION, surahNumber: 56, fromAyah: 1, toAyah: 96, order: 3, status: PlanItemStatus.IN_PROGRESS },
          { planId: plan.id, type: PlanItemType.REVISION, surahNumber: 114, fromAyah: 1, toAyah: 6, order: 4, status: PlanItemStatus.PENDING },
        ],
      });
    }

    const sessionDates: Date[] = [];
    const currentDate = new Date(START_DATE);
    while (currentDate <= END_DATE) {
      if (currentDate.getUTCDay() !== 5) {
        sessionDates.push(new Date(currentDate));
      }
      currentDate.setUTCDate(currentDate.getUTCDate() + 1);
    }

    const allSessionsData: any[] = [];
    for (const date of sessionDates) {
      for (const h of halaqas) {
        allSessionsData.push({
          id: crypto.randomUUID(),
          forumId: forum.id,
          halaqaId: h.id,
          sessionDate: date,
          startedAt: date,
          endedAt: new Date(date.getTime() + 2.5 * 3600 * 1000),
          notes: 'حلقة التسميع والمراجعة اليومية المعتادة',
        });
      }
    }

    for (let i = 0; i < allSessionsData.length; i += 500) {
      await prisma.attendanceSession.createMany({
        data: allSessionsData.slice(i, i + 500),
      });
    }

    const createdSessions = await prisma.attendanceSession.findMany({
      where: { forumId: forum.id },
      select: { id: true, halaqaId: true, sessionDate: true },
    });

    const attendanceRecordsData: any[] = [];
    const memorizationRecordsData: any[] = [];
    const revisionRecordsData: any[] = [];

    const todayStr = END_DATE.toISOString().split('T')[0];

    for (const s of createdSessions) {
      const students = halaqaStudentsMap.get(s.halaqaId) || [];
      const isToday = s.sessionDate.toISOString().split('T')[0] === todayStr;

      for (const st of students) {
        let status: AttendanceStatus = AttendanceStatus.PRESENT;

        const rand = rng.next();
        if (st.persona === 0) {
          status = rand < 0.98 ? AttendanceStatus.PRESENT : (rand < 0.99 ? AttendanceStatus.LATE : AttendanceStatus.ABSENT);
        } else if (st.persona === 1) {
          status = rand < 0.92 ? AttendanceStatus.PRESENT : (rand < 0.96 ? AttendanceStatus.LATE : (rand < 0.98 ? AttendanceStatus.EXCUSED : AttendanceStatus.ABSENT));
        } else {
          status = rand < 0.78 ? AttendanceStatus.PRESENT : (rand < 0.85 ? AttendanceStatus.LATE : (rand < 0.90 ? AttendanceStatus.EXCUSED : AttendanceStatus.ABSENT));
        }

        if (isToday) {
          status = rand < 0.92 ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT;
        }

        attendanceRecordsData.push({
          sessionId: s.id,
          studentId: st.id,
          status,
          notes: status === AttendanceStatus.ABSENT ? 'غياب بعذر مسبق' : (status === AttendanceStatus.LATE ? 'تأخر 10 دقائق' : null),
        });

        if (status === AttendanceStatus.PRESENT) {
          const surah = rng.choice(SURAHS);
          const fromAyah = 1;
          const toAyah = Math.min(surah.ayahs, rng.nextInt(5, 20));

          if (rng.next() < 0.55 || (isToday && rng.next() < 0.80)) {
            const score = st.persona === 0 ? rng.nextInt(95, 100) : (st.persona === 1 ? rng.nextInt(80, 94) : rng.nextInt(65, 80));
            const rating = score >= 95 ? RecitationRating.EXCELLENT : (score >= 85 ? RecitationRating.VERY_GOOD : (score >= 75 ? RecitationRating.GOOD : RecitationRating.ACCEPTABLE));
            memorizationRecordsData.push({
              forumId: forum.id,
              studentId: st.id,
              halaqaId: s.halaqaId,
              date: s.sessionDate,
              surahNumber: surah.number,
              fromAyah,
              toAyah,
              rating,
              evaluationScore: score,
              teacherNotes: score >= 90 ? 'أداء متقن ومخارج حروف سليمة' : 'يحتاج ضبط أحكام النون الساكنة والتنوين',
            });
          }

          if (rng.next() < 0.45 || (isToday && rng.next() < 0.70)) {
            const revSurah = rng.choice(SURAHS);
            const score = st.persona === 0 ? 100 : (st.persona === 1 ? 90 : 75);
            const rating = st.persona === 0 ? RecitationRating.EXCELLENT : (st.persona === 1 ? RecitationRating.VERY_GOOD : RecitationRating.GOOD);
            revisionRecordsData.push({
              forumId: forum.id,
              studentId: st.id,
              halaqaId: s.halaqaId,
              date: s.sessionDate,
              surahNumber: revSurah.number,
              fromAyah: 1,
              toAyah: Math.min(revSurah.ayahs, 30),
              rating,
              evaluationScore: score,
              teacherNotes: 'مراجعة دورية ممتازة وتثبيت متقن',
            });
          }
        }
      }
    }

    console.log(`  -> Inserting ${attendanceRecordsData.length} Attendance Records...`);
    for (let i = 0; i < attendanceRecordsData.length; i += 1000) {
      await prisma.attendanceRecord.createMany({ data: attendanceRecordsData.slice(i, i + 1000) });
    }

    console.log(`  -> Inserting ${memorizationRecordsData.length} Memorization Records...`);
    for (let i = 0; i < memorizationRecordsData.length; i += 1000) {
      await prisma.memorizationRecord.createMany({ data: memorizationRecordsData.slice(i, i + 1000) });
    }

    console.log(`  -> Inserting ${revisionRecordsData.length} Revision Records...`);
    for (let i = 0; i < revisionRecordsData.length; i += 1000) {
      await prisma.revisionRecord.createMany({ data: revisionRecordsData.slice(i, i + 1000) });
    }

    // ========================================================================
    // 5. Exams & Evaluations
    // ========================================================================
    currentPhase = '5. Exams / Evaluations';
    console.log(`📝 [Phase ${currentPhase}] Creating 25 Exams, Criteria, 339 Results, and 600 Evaluations...`);

    const examTitles = [
      'اختبار حفظ جزء عم الشهري',
      'اختبار جزء تبارك والإتقان',
      'اختبار سورة الكهف والرحمن',
      'اختبار أحكام التجويد ومخارج الحروف',
      'الاختبار الفصلي الشامل للمقررات',
    ];

    for (let i = 0; i < 25; i++) {
      const isUpcoming = i >= 23;
      const h = isUpcoming ? halaqas[0] : halaqas[i % halaqas.length];
      const title = `${rng.choice(examTitles)} - ${h.name} (${i + 1})`;
      const examDate = isUpcoming
        ? new Date(END_DATE.getTime() + (i - 22) * 2 * 24 * 3600 * 1000)
        : new Date(START_DATE.getTime() + (i / 25) * (END_DATE.getTime() - START_DATE.getTime()));

      const exam = await prisma.exam.create({
        data: {
          forumId: forum.id,
          termId: i < 15 ? term1.id : term2.id,
          halaqaId: h.id,
          title,
          description: 'اختبار تقييمي دوري لقياس مستوى الحفظ وجودة الأداء والتجويد',
          examType: ExamType.MONTHLY,
          maxScore: 100,
          passScore: 60,
          status: isUpcoming ? ExamStatus.SCHEDULED : ExamStatus.COMPLETED,
          scheduledDate: examDate,
          isPublished: true,
        },
      });

      await prisma.examCriterion.create({
        data: {
          examId: exam.id,
          name: 'جودة الحفظ واستحضار الآيات',
          maxScore: 60,
          order: 1,
        },
      });
      await prisma.examCriterion.create({
        data: {
          examId: exam.id,
          name: 'أحكام التجويد ومخارج الحروف والوقف',
          maxScore: 40,
          order: 2,
        },
      });

      if (!isUpcoming) {
        const students = halaqaStudentsMap.get(h.id) || [];
        for (const st of students) {
          let totalScore = 0;
          if (st.persona === 0) totalScore = rng.nextInt(92, 100) - (rng.next() < 0.5 ? 0.5 : 0);
          else if (st.persona === 1) totalScore = rng.nextInt(75, 91) - (rng.next() < 0.5 ? 0.5 : 0);
          else totalScore = rng.nextInt(52, 74) - (rng.next() < 0.5 ? 0.5 : 0);

          const status = totalScore >= 60 ? ExamResultStatus.PASSED : ExamResultStatus.FAILED;

          await prisma.examResult.create({
            data: {
              examId: exam.id,
              studentId: st.id,
              score: totalScore,
              percentage: totalScore,
              status,
              isPassed: totalScore >= 60,
              isPublished: true,
              notes: status === ExamResultStatus.PASSED ? 'أداء ممتاز ومبارك' : 'يحتاج مراجعة وإعادة اختبار',
            },
          });
        }
      }
    }

    const evalNotes = [
      'طالب متميز ومواظب على الحضور، حسن الخلق والتأدب مع زملائه والمعلم.',
      'مستوى ممتاز في الحفظ والتجويد، نرجو الاستمرار في هذا النشاط المبارك.',
      'يحتاج لمزيد من المراجعة اليومية في المنزل بمتابعة ولي أمره الكريم.',
      'حضور منتظم ومشاركة فاعلة في أنشطة الحلقة والمسابقات القرآنية.',
      'تطور ملحوظ في مخارج الحروف وأحكام المدود والغنة.',
    ];

    const evaluationsData: any[] = [];
    for (let month = 0; month < 4; month++) {
      const evalDate = new Date(START_DATE.getTime() + (month + 0.5) * 30 * 24 * 3600 * 1000);
      for (const st of studentProfiles) {
        const rating = st.persona === 0
          ? StudentEvaluationRating.EXCELLENT
          : (st.persona === 1 ? StudentEvaluationRating.VERY_GOOD : StudentEvaluationRating.GOOD);

        const bScore = st.persona === 0 ? 100 : (st.persona === 1 ? 90 : 75);
        const mScore = st.persona === 0 ? 98 : (st.persona === 1 ? 85 : 70);
        const aScore = st.persona === 0 ? 100 : (st.persona === 1 ? 92 : 80);
        const overall = ((bScore + mScore + aScore) / 3).toFixed(1);

        evaluationsData.push({
          forumId: forum.id,
          studentId: st.id,
          halaqaId: st.halaqaId,
          termId: month < 2 ? term1.id : term2.id,
          evaluationDate: evalDate,
          rating,
          behaviorScore: bScore,
          discipline: aScore,
          participation: mScore,
          overallScore: parseFloat(overall),
          teacherNotes: rng.choice(evalNotes),
          isPublished: true,
        });
      }
    }

    for (let i = 0; i < evaluationsData.length; i += 500) {
      await prisma.studentEvaluation.createMany({ data: evaluationsData.slice(i, i + 500) });
    }

    // ========================================================================
    // 6. Activities / Competitions / Awards
    // ========================================================================
    currentPhase = '6. Activities / Competitions / Awards';
    console.log(`🏆 [Phase ${currentPhase}] Creating 15 Activities, 8 Competitions, and 50 Awards...`);

    const activityDefs = [
      { title: 'الرحلة التربوية القرآنية إلى جبل صبر', type: ActivityType.TRIP, status: ActivityStatus.COMPLETED },
      { title: 'دورة إتقان مخارج الحروف وصفاتها', type: ActivityType.COURSE, status: ActivityStatus.COMPLETED },
      { title: 'اليوم المفتوح والمسابقات الترفيهية', type: ActivityType.ENTERTAINMENT, status: ActivityStatus.COMPLETED },
      { title: 'ملتقى حفظة القرآن السنوي', type: ActivityType.CEREMONY, status: ActivityStatus.COMPLETED },
      { title: 'دورة تجويد جزء عم للمبتدئين', type: ActivityType.COURSE, status: ActivityStatus.COMPLETED },
      { title: 'برنامج المراجعة المكثفة الصيفية', type: ActivityType.PROGRAM, status: ActivityStatus.COMPLETED },
      { title: 'المخيم القرآني الصيفي الأول', type: ActivityType.CAMP, status: ActivityStatus.COMPLETED },
      { title: 'لقاء أولياء الأمور والشورى التربوية', type: ActivityType.MEETING, status: ActivityStatus.COMPLETED },
      { title: 'دوري كرة القدم لطلاب الحلقات', type: ActivityType.SPORTS, status: ActivityStatus.COMPLETED },
      { title: 'برنامج التحفيز والإتقان الأسبوعي', type: ActivityType.INITIATIVE, status: ActivityStatus.COMPLETED },
      { title: 'ندوة فضل القرآن وأخلاق حملته', type: ActivityType.EDUCATIONAL, status: ActivityStatus.COMPLETED },
      { title: 'دورة أحكام النون الساكنة والتنوين', type: ActivityType.COURSE, status: ActivityStatus.COMPLETED },
      { title: 'المسابقة المنهجية العامة', type: ActivityType.CONTEST, status: ActivityStatus.IN_PROGRESS },
      { title: 'رحلة حديقة السبعين الترفيهية', type: ActivityType.TRIP, status: ActivityStatus.PUBLISHED },
      { title: 'حفل تكريم حفظة القرآن الكريم الختامي', type: ActivityType.CEREMONY, status: ActivityStatus.PUBLISHED },
    ];

    for (let i = 0; i < activityDefs.length; i++) {
      const aDef = activityDefs[i];
      const aDate = new Date(START_DATE.getTime() + (i / 15) * (END_DATE.getTime() - START_DATE.getTime()));

      const act = await prisma.activity.create({
        data: {
          forumId: forum.id,
          branchId: branches[i % branches.length].id,
          title: aDef.title,
          description: `نشاط متميز ضمن برامج ملتقى القرآن التجريبي لتعزيز الروح الإيمانية والتربوية`,
          type: aDef.type,
          status: aDef.status,
          startsAt: aDate,
          endsAt: new Date(aDate.getTime() + 4 * 3600 * 1000),
          capacity: 40,
        },
      });

      const sampleStudents = rng.shuffle(studentProfiles).slice(0, 12);
      for (const st of sampleStudents) {
        await prisma.activityParticipant.create({
          data: {
            activityId: act.id,
            studentId: st.id,
            nominationStatus: ParticipantNominationStatus.APPROVED,
            attendanceStatus: aDef.status === ActivityStatus.COMPLETED ? ParticipantAttendanceStatus.PRESENT : ParticipantAttendanceStatus.NOT_RECORDED,
          },
        });
      }
    }

    const compDefs = [
      { title: 'مسابقة مزامير داوود لحسن الصوت والتلاوة', category: CompetitionCategory.RECITATION, maxScore: 100 },
      { title: 'مسابقة فرسان القرآن لحفظ 5 أجزاء', category: CompetitionCategory.MEMORIZATION, maxScore: 100 },
      { title: 'مسابقة حفظ جزء عم للبراعم', category: CompetitionCategory.MEMORIZATION, maxScore: 100 },
      { title: 'مسابقة دقائق التجويد وقواعد الترتيل', category: CompetitionCategory.TAJWEED, maxScore: 100 },
      { title: 'مسابقة الحديث النبوي الشريف والأربعين النووية', category: CompetitionCategory.HADITH, maxScore: 100 },
      { title: 'مسابقة تدبر القرآن الكريم وتفسيره', category: CompetitionCategory.INTERPRETATION, maxScore: 100 },
      { title: 'مسابقة الخط العربي والزخرفة القرآنية', category: CompetitionCategory.CALLIGRAPHY, maxScore: 100 },
      { title: 'المسابقة الثقافية العامة بين الحلقات', category: CompetitionCategory.GENERAL_KNOWLEDGE, maxScore: 100 },
    ];

    for (let i = 0; i < compDefs.length; i++) {
      const cDef = compDefs[i];
      const comp = await prisma.competition.create({
        data: {
          forumId: forum.id,
          title: cDef.title,
          description: `مسابقة تنافسية مباركة لطلاب الحلقات القرآنية لتشجيع الإتقان والتميز`,
          category: cDef.category,
          maxScore: cDef.maxScore,
          status: i < 6 ? CompetitionStatus.RESULTS_PUBLISHED : CompetitionStatus.PUBLISHED,
          startsAt: new Date(START_DATE.getTime() + (i / 8) * (END_DATE.getTime() - START_DATE.getTime())),
        },
      });

      const sampleStudents = rng.shuffle(studentProfiles).slice(0, 10);
      for (let r = 0; r < sampleStudents.length; r++) {
        const st = sampleStudents[r];
        await prisma.competitionParticipant.create({
          data: {
            competitionId: comp.id,
            studentId: st.id,
          },
        });

        if (i < 6) {
          const score = 100 - r * 2.5;
          await prisma.competitionResult.create({
            data: {
              competitionId: comp.id,
              studentId: st.id,
              score,
              rank: r + 1,
              notes: r < 3 ? 'فائز بالمراكز الأولى ومتميز' : 'أداء جيد ومنافسة قوية',
            },
          });
        }
      }
    }

    const awardTypesList = [
      { name: 'وسام التميز في الحفظ والإتقان', type: AwardType.MEDAL, desc: 'يمنح للطلاب المتميزين في حفظ السور المقررة' },
      { name: 'درع المواظبة والانضباط المثالي', type: AwardType.SHIELD, desc: 'يمنح لأصحاب أعلى نسب حضور وانضباط' },
      { name: 'شارة الإتقان والتجويد المتميز', type: AwardType.BADGE, desc: 'يمنح للمتميزين في مخارج الحروف والترتيل' },
      { name: 'شهادة تقدير وتفوق في الاختبار الفصلي', type: AwardType.CERTIFICATE, desc: 'يمنح للحاصلين على درجات امتياز في الاختبارات' },
      { name: 'وسام فرسان المراجعة وتثبيت المحفوظ', type: AwardType.HONORARY, desc: 'يمنح للمتفوقين في جلسات المراجعة اليومية' },
    ];

    const createdAwards: any[] = [];
    for (const a of awardTypesList) {
      const aw = await prisma.award.create({
        data: {
          forumId: forum.id,
          name: a.name,
          description: a.desc,
          type: a.type,
        },
      });
      createdAwards.push(aw);
    }

    const sampleAwardStudents = rng.shuffle(studentProfiles).slice(0, 50);
    for (let i = 0; i < 50; i++) {
      const st = sampleAwardStudents[i];
      const aw = createdAwards[i % createdAwards.length];
      const grantDate = new Date(START_DATE.getTime() + (i / 50) * (END_DATE.getTime() - START_DATE.getTime()));

      await prisma.studentAward.create({
        data: {
          awardId: aw.id,
          studentId: st.id,
          reason: 'تقديرًا للجهود المباركة والتميز المستمر في رحاب القرآن الكريم',
          awardedById: teacherUsers[0].id,
          awardedAt: grantDate,
        },
      });
    }

    // ========================================================================
    // 7. General Shelf
    // ========================================================================
    currentPhase = '7. Shelf';
    console.log(`📚 [Phase ${currentPhase}] Creating 4 Shelf Sections and 50 Published Posts...`);

    const shelfSectionsDefs = [
      { name: 'لوحة الإعلانات والتنبيهات العامة', slug: 'announcements', desc: 'إعلانات البرامج والمواعيد الرسمية للملتقى' },
      { name: 'الفوائد والعلوم القرآنية', slug: 'quranic-benefits', desc: 'مقالات وفوائد في التجويد والتفسير والتدبر' },
      { name: 'نتائج المسابقات والأنشطة', slug: 'competition-results', desc: 'أخبار الفائزين والمتميزين في الفعاليات' },
      { name: 'التوجيهات التربوية والإرشادية', slug: 'educational-guidance', desc: 'نصائح ورسائل تربوية للطلاب وأولياء الأمور' },
    ];

    const shelfSections: any[] = [];
    for (let i = 0; i < shelfSectionsDefs.length; i++) {
      const sDef = shelfSectionsDefs[i];
      const sec = await prisma.shelfSection.create({
        data: {
          forumId: forum.id,
          name: sDef.name,
          slug: sDef.slug,
          description: sDef.desc,
          order: i + 1,
          isActive: true,
          visibility: ShelfVisibility.ALL_USERS,
        },
      });
      shelfSections.push(sec);
    }

    const shelfPosts = [
      { title: 'انطلاق الفصل الدراسي الصيفي المكثف', content: 'يسر إدارة الملتقى الإعلان عن بدء برامج الفصل الصيفي المكثف لجميع الحلقات، سائلين الله التوفيق والسداد.', type: ShelfContentType.ANNOUNCEMENT },
      { title: 'فضل المداومة على تلاوة القرآن وتدبره', content: 'القرآن العظيم ربيع القلوب ونور الصدور، وفضل تلاوته مضاعف الأجور، فلنحرص على وردنا اليومي.', type: ShelfContentType.ARTICLE },
      { title: 'تنبيه مهم بشأن موعد الاختبارات الشهرية', content: 'نهيب بجميع الطلاب الاستعداد الجيد للاختبارات الشهرية القادمة ومراجعة المحفوظ مع أولياء الأمور.', type: ShelfContentType.EXAM_ANNOUNCEMENT },
      { title: 'تكريم كوكبة من الطلاب المتفوقين في الحفظ', content: 'نبارك لطلابنا الأفاضل تفوقهم الباهر في اختبارات جزء تبارك، ونسأل الله أن يجعلهم قرة عين لوالديهم.', type: ShelfContentType.ACTIVITY_RESULT },
      { title: 'نصائح ذهبية لتثبيت الحفظ والمراجعة الدائمة', content: 'أهم قواعد التثبيت: القراءة في الصلاة، التكرار المنتظم، وربط الآيات بالسياق والمعنى.', type: ShelfContentType.RESOURCE },
    ];

    for (let i = 0; i < 50; i++) {
      const pDef = shelfPosts[i % shelfPosts.length];
      const postDate = new Date(START_DATE.getTime() + (i / 50) * (END_DATE.getTime() - START_DATE.getTime()));

      await prisma.shelfItem.create({
        data: {
          forumId: forum.id,
          sectionId: shelfSections[i % shelfSections.length].id,
          title: `${pDef.title} (${i + 1})`,
          content: pDef.content,
          type: pDef.type,
          isPinned: i % 10 === 0,
          isPublished: true,
          publishedAt: postDate,
          targetAudience: ShelfVisibility.ALL_USERS,
          authorId: teacherUsers[0].id,
          authorName: teacherUsers[0].displayName,
          authorRole: 'معلم ومربي فاضل',
          downloadCount: rng.nextInt(5, 50),
        },
      });
    }

    // ========================================================================
    // 8. Chat (Safe Conversation Members & Messages)
    // ========================================================================
    currentPhase = '8. Chat';
    console.log(`💬 [Phase ${currentPhase}] Creating 20 Chat Conversations & 300 Messages using Safe SQL Member Inserts...`);

    const chatMessagesList = [
      'السلام عليكم ورحمة الله وبركاته، تم إرسال تقرير إنجاز الحلقة لهذا اليوم.',
      'وعليكم السلام ورحمة الله، ما شاء الله تبارك الله، جهود مباركة ومشكورة.',
      'نرجو التأكيد على ولي أمر الطالب للمتابعة المنزلية المكثفة.',
      'تم التواصل مع ولي الأمر وسيقوم بمتابعة جدول الحفظ يوميًا.',
      'موعد الاختبار الشهري بعد غد بإذن الله تعالى في تمام الساعة الرابعة.',
      'جزاكم الله خيرًا وبارك في جهودكم الكريمة.',
      'تم تسجيل حضور وتسميع جميع الطلاب بنجاح.',
      'نرجو تزويدنا ببيانات الخطة التعليمية المحدثة للأسبوع القادم.',
    ];

    for (let i = 0; i < 20; i++) {
      let convType: ConversationType = ConversationType.HALAQA;
      let title = `مجموعة ${halaqas[i % halaqas.length].name}`;
      let memberUsers: { user: any; role: string }[] = [];

      if (i < 10) {
        convType = ConversationType.HALAQA;
        title = `مجموعة ${halaqas[i].name}`;
        memberUsers = [
          { user: teacherUsers[i], role: 'TEACHER' },
          { user: gmUser, role: 'GENERAL_MANAGER' },
          { user: execUser, role: 'EXECUTIVE_MANAGER' },
        ];
      } else if (i < 15) {
        convType = ConversationType.STAFF;
        title = `متابعة إشرافية: ${teacherUsers[i - 10].displayName}`;
        memberUsers = [
          { user: teacherUsers[i - 10], role: 'TEACHER' },
          { user: supervisorUsers[0], role: 'TECHNICAL_SUPERVISOR' },
        ];
      } else {
        convType = ConversationType.PARENT_STUDENT_CHANNEL;
        title = `قناة تواصل: ${parentUsers[i - 15].displayName}`;
        memberUsers = [
          { user: teacherUsers[0], role: 'TEACHER' },
          { user: parentUsers[i - 15], role: 'PARENT' },
        ];
      }

      const conv = await prisma.conversation.create({
        data: {
          forumId: forum.id,
          type: convType,
          halaqaId: i < 10 ? halaqas[i].id : null,
          title,
        },
      });

      for (const mObj of memberUsers) {
        let lastReadAt: Date | null = END_DATE;
        if (i === 0 && mObj.user.id === teacherUsers[0].id) {
          lastReadAt = new Date(END_DATE.getTime() - 4 * 3600 * 1000);
        }

        await safeInsertConversationMember(prisma, {
          conversationId: conv.id,
          userId: mObj.user.id,
          role: mObj.role,
          isActive: true,
          lastReadAt,
        });
      }

      for (let m = 0; m < 15; m++) {
        let msgDate = new Date(START_DATE.getTime() + ((i * 15 + m) / 300) * (END_DATE.getTime() - START_DATE.getTime()));
        let senderObj = memberUsers[m % memberUsers.length];

        if (i === 0 && m >= 12) {
          senderObj = m % 2 === 0 ? memberUsers[1] : memberUsers[2];
          msgDate = new Date(END_DATE.getTime() - (15 - m) * 3600 * 1000);
        }

        await prisma.chatMessage.create({
          data: {
            conversationId: conv.id,
            senderId: senderObj.user.id,
            type: ChatMessageType.TEXT,
            text: rng.choice(chatMessagesList),
            createdAt: msgDate,
          },
        });
      }
    }

    // ========================================================================
    // 9. Notifications
    // ========================================================================
    currentPhase = '9. Notifications';
    console.log(`🔔 [Phase ${currentPhase}] Creating 400 Notifications (including 5 unread for demo_teacher)...`);

    const notifDefs = [
      { title: 'تسجيل الحضور اليومي', body: 'تم تسجيل حضوركم بنجاح في الحلقة القرآنية اليوم.', type: NotificationType.SYSTEM },
      { title: 'إعلان موعد اختبار', body: 'تم تحديد موعد الاختبار الشهري لمقرر جزء عم.', type: NotificationType.SYSTEM },
      { title: 'رصد درجات الاختبار', body: 'تم رصد درجات الاختبار وحصول الطالب على تقدير ممتاز.', type: NotificationType.SYSTEM },
      { title: 'منح وسام التميز', body: 'مبارك! تم منحكم وسام التميز في الحفظ والإتقان.', type: NotificationType.SYSTEM },
      { title: 'نشاط قرآني جديد', body: 'تم نشر نشاط جديد في الملتقى، تفضل بالاطلاع والتسجيل.', type: NotificationType.SYSTEM },
    ];

    const targetNotifUsers = [gmUser, execUser, ...supervisorUsers, ...teacherUsers.slice(1), ...parentUsers.slice(0, 20), ...studentUsers.slice(0, 20)];
    for (let i = 0; i < 395; i++) {
      const nDef = notifDefs[i % notifDefs.length];
      const user = targetNotifUsers[i % targetNotifUsers.length];
      const notifDate = new Date(START_DATE.getTime() + (i / 400) * (END_DATE.getTime() - START_DATE.getTime()));
      const isUnread = i % 3 === 0;

      await prisma.notification.create({
        data: {
          userId: user.id,
          type: nDef.type,
          title: nDef.title,
          body: nDef.body,
          readAt: isUnread ? null : notifDate,
          createdAt: notifDate,
        },
      });
    }

    const teacherUnreadNotifsData = [
      { title: 'زيارة إشرافية قادمة', body: 'تم جدولة زيارة إشرافية لحلقة الإمام نافع يوم الأحد القادم.', type: NotificationType.SYSTEM },
      { title: 'تذكير برصد الدرجات', body: 'يرجى استكمال رصد درجات الاختبار الشهري قبل نهاية الأسبوع.', type: NotificationType.SYSTEM },
      { title: 'اعتماد الخطة التعليمية', body: 'تم اعتماد خطة الحفظ الصيفية لحلقة الإمام نافع المدني.', type: NotificationType.SYSTEM },
      { title: 'رسالة من ولي أمر', body: 'تلقيتم رسالة استفسار جديدة من ولي أمر الطالب في حلقة الإمام نافع.', type: NotificationType.SYSTEM },
      { title: 'تنبيه مسابقة المزامير', body: 'بدأ التسجيل في مسابقة مزامير داوود لحسن الصوت والتلاوة.', type: NotificationType.SYSTEM },
    ];
    for (let j = 0; j < teacherUnreadNotifsData.length; j++) {
      const un = teacherUnreadNotifsData[j];
      await prisma.notification.create({
        data: {
          userId: teacherUsers[0].id,
          type: un.type,
          title: un.title,
          body: un.body,
          readAt: null,
          createdAt: new Date(END_DATE.getTime() - (j + 1) * 3600 * 1000),
        },
      });
    }

    // ========================================================================
    // 10. Administrative Operations
    // ========================================================================
    currentPhase = '10. Administrative';
    console.log(`📋 [Phase ${currentPhase}] Creating 40 Administrative Tasks & 25 Requests...`);

    const taskTitles = [
      'إعداد تقرير الإنجاز الشهري للحلقات',
      'مراجعة وتحديث خطط الحفظ الصيفية',
      'فحص وتقييم مستويات التسميع والمراجعة',
      'تنظيم مسابقة التجويد ومخارج الحروف',
      'إجراء المقابلات التربوية مع أولياء الأمور',
      'تجهيز قاعات الاختبارات وتوزيع النماذج',
      'حصر الطلاب المرشحين للجوائز والأوسمة',
      'إعداد التقرير الإحصائي الفصلي للملتقى',
    ];

    for (let i = 0; i < 40; i++) {
      const status = i < 20 ? AdminTaskStatus.COMPLETED : (i < 32 ? AdminTaskStatus.IN_PROGRESS : AdminTaskStatus.OPEN);
      const assignedUser = teacherUsers[i % teacherUsers.length];
      const taskDate = new Date(START_DATE.getTime() + (i / 40) * (END_DATE.getTime() - START_DATE.getTime()));

      await prisma.adminTask.create({
        data: {
          forumId: forum.id,
          branchId: branchMain.id,
          title: `${rng.choice(taskTitles)} (${i + 1})`,
          description: 'مهمة إدارية وتعليمية معتمدة لمتابعة سير الأداء وتحقيق أعلى معايير الجودة',
          assignedToId: assignedUser.id,
          createdById: gmUser.id,
          priority: i % 4 === 0 ? AdminPriority.HIGH : AdminPriority.NORMAL,
          status,
          dueAt: new Date(taskDate.getTime() + 7 * 24 * 3600 * 1000),
          completedAt: status === AdminTaskStatus.COMPLETED ? new Date(taskDate.getTime() + 3 * 24 * 3600 * 1000) : null,
          createdAt: taskDate,
        },
      });
    }

    const reqTitles = [
      'طلب اعتماد خطة تعليمية إضافية للحلقة',
      'طلب تنظيم نشاط رحلة تعليمية للطلاب',
      'طلب توفير مصاحف ومراجع تجويد جديدة',
      'طلب إجازة اضطرارية لمعلم الحلقة',
      'طلب نقل طالب بين الحلقات لملاءمة مستواه',
    ];

    for (let i = 0; i < 25; i++) {
      const status = i < 15 ? AdminRequestStatus.APPROVED : (i < 20 ? AdminRequestStatus.UNDER_REVIEW : AdminRequestStatus.SUBMITTED);
      const reqUser = teacherUsers[i % teacherUsers.length];
      const reqDate = new Date(START_DATE.getTime() + (i / 25) * (END_DATE.getTime() - START_DATE.getTime()));

      await prisma.administrativeRequest.create({
        data: {
          forumId: forum.id,
          branchId: branchMain.id,
          title: `${rng.choice(reqTitles)} (${i + 1})`,
          description: 'طلب رسمي مقدم لإدارة الملتقى لاعتماد الإجراءات التعليمية والتربوية المطلوبة',
          type: AdminRequestType.GENERAL,
          status,
          priority: AdminPriority.NORMAL,
          requestedById: reqUser.id,
          submittedAt: reqDate,
          resolvedAt: status === AdminRequestStatus.APPROVED ? new Date(reqDate.getTime() + 2 * 24 * 3600 * 1000) : null,
          createdAt: reqDate,
        },
      });
    }

    // ========================================================================
    // 11. Supervisory Data (Visits & Recommendations)
    // ========================================================================
    currentPhase = '11. Supervisor Data';
    console.log(`🔍 [Phase ${currentPhase}] Creating 25 Field Visits & 20 Recommendations...`);

    for (let i = 0; i < 25; i++) {
      const h = halaqas[i % halaqas.length];
      const teacher = teacherProfiles[h.teacherIdx];
      const sup = supervisorProfiles[i < 15 ? 0 : 1];
      const vDate = new Date(START_DATE.getTime() + (i / 25) * (END_DATE.getTime() - START_DATE.getTime()));

      const visit = await prisma.fieldVisit.create({
        data: {
          forumId: forum.id,
          branchId: h.branchId,
          halaqaId: h.id,
          teacherId: teacher.id,
          supervisorId: sup.id,
          visitNumber: `VIS-2026-${String(i + 1).padStart(3, '0')}`,
          visitType: VisitType.ROUTINE,
          status: VisitStatus.COMPLETED,
          scheduledDate: vDate,
          startedAt: vDate,
          completedAt: new Date(vDate.getTime() + 2 * 3600 * 1000),
          generalNotes: 'زيارة إشرافية ميدانية ممتازة، انتظام ملموس في التسميع وتفاعل إيجابي من الطلاب.',
        },
      });

      if (i < 20) {
        await prisma.recommendation.create({
          data: {
            forumId: forum.id,
            branchId: h.branchId,
            visitId: visit.id,
            halaqaId: h.id,
            teacherId: teacher.id,
            supervisorId: sup.id,
            title: `توصية إشرافية: تعزيز مهارات الوقف والابتداء (${i + 1})`,
            description: 'يوصى بتكثيف تمارين الوقف والابتداء وحسن الأداء لطلاب المستوى المتقدم.',
            priority: RecommendationPriority.MEDIUM,
            status: i < 12 ? RecommendationStatus.COMPLETED : RecommendationStatus.OPEN,
            createdAt: vDate,
          },
        });
      }
    }

    // ========================================================================
    // 12. Credentials Export
    // ========================================================================
    currentPhase = '12. Credentials Export';
    console.log(`\n📄 [Phase ${currentPhase}] Writing Demo Credentials to backend/demo-four-months-accounts.txt...`);

    const credentialsFilePath = path.join(__dirname, '../demo-four-months-accounts.txt');
    const credentialsContent = [
      '======================================================================',
      'STUDENTSPRAY — 4-MONTH COMPREHENSIVE DEMO ACCOUNTS CREDENTIALS',
      '======================================================================',
      `Forum Slug: ${DEMO_FORUM_SLUG}`,
      `Forum Name: ملتقى القرآن التجريبي`,
      `Default Password: ${DEFAULT_DEMO_PASSWORD}`,
      `Timeline: 2026-04-20 to 2026-08-20`,
      '----------------------------------------------------------------------',
      'PRIMARY TEST ACCOUNTS FOR ALL ROLES:',
      '----------------------------------------------------------------------',
      ...credentialsList.map((c) => `[${c.role.padEnd(20)}] Username: ${c.username.padEnd(20)} Name: ${c.name.padEnd(30)} Note: ${c.info}`),
      '======================================================================',
    ].join('\n');

    fs.writeFileSync(credentialsFilePath, credentialsContent, 'utf-8');

    const localDir = path.join(__dirname, '../.local');
    if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
    fs.writeFileSync(
      path.join(localDir, 'demo-four-months-manifest.json'),
      JSON.stringify({ forumId: forum.id, forumSlug: DEMO_FORUM_SLUG, createdAt: new Date().toISOString() }, null, 2),
      'utf-8',
    );

    console.log('\n✅ 4-Month Demo Dataset Seed Completed Successfully!');
  } catch (err: any) {
    console.error(`\n❌ [DEMO SEEDER FAILED AT PHASE: "${currentPhase}"]`);
    console.error(`Error details: ${err?.message || err}`);
    throw err;
  }
}

async function main() {
  try {
    await seedDemoFourMonths();
  } catch (err) {
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main();
}
