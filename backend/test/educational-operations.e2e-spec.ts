/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PasswordService } from '../src/auth/password.service';
import { normalizeUsername } from '../src/auth/utils/identifier';
import { PERMISSION_CATALOG } from '../src/authorization/permission-catalog';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { RequestIdMiddleware } from '../src/common/middleware/request-id.middleware';
import { PrismaService } from '../src/database/prisma.service';

describe('Educational Operations APIs (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  const run = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const slug = `edu-e2e-${run}`;
  const password = 'Edu-E2E-Password-2026!';
  let forumId: string;
  let branchId: string;
  let managerToken: string;
  let teacherToken: string;
  let otherTeacherToken: string;
  let studentProfileId: string;
  let halaqaId: string;

  const bearer = (token = managerToken) => ({
    Authorization: `Bearer ${token}`,
  });

  const login = async (username: string) =>
    (
      await request(app.getHttpServer())
        .post('/api/v1/auth/mobile/login')
        .send({ forumSlug: slug, identifier: username, password })
        .expect(HttpStatus.OK)
    ).body.accessToken as string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api/v1');
    const requestId = new RequestIdMiddleware();
    app.use(requestId.use.bind(requestId));
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    passwords = app.get(PasswordService);

    // Setup Forum & Branch
    const forum = await prisma.forum.create({
      data: { name: 'ملتقى العمليات التعليمية', slug },
    });
    forumId = forum.id;

    const branch = await prisma.branch.create({
      data: { forumId, name: 'الفرع التعليمي', code: 'EDU_BRANCH' },
    });
    branchId = branch.id;

    // Roles & Permissions
    const gmRole = await prisma.role.create({
      data: { forumId, name: 'GENERAL_MANAGER', displayName: 'المدير العام', isSystem: true },
    });
    const teacherRole = await prisma.role.create({
      data: { forumId, name: 'TEACHER', displayName: 'المعلم', isSystem: true },
    });
    const studentRole = await prisma.role.create({
      data: { forumId, name: 'STUDENT', displayName: 'الطالب', isSystem: true },
    });

    for (const code of Object.keys(PERMISSION_CATALOG)) {
      const permission = await prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code, description: code },
      });
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: gmRole.id, permissionId: permission.id } },
        update: {},
        create: { roleId: gmRole.id, permissionId: permission.id },
      });
      if (
        [
          'students.read',
          'halaqas.read',
          'educational_plans.read',
          'attendance.read',
          'attendance.write',
          'memorization.read',
          'memorization.write',
          'revision.read',
          'revision.write',
          'student_progress.read',
        ].includes(code)
      ) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: teacherRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: teacherRole.id, permissionId: permission.id },
        });
      }
    }

    const passwordHash = await passwords.hashPassword(password);

    // Create GM User
    const gm = await prisma.user.create({
      data: {
        forumId,
        branchId,
        username: `gm_${run}`,
        usernameNormalized: normalizeUsername(`gm_${run}`),
        displayName: 'المدير العام',
        passwordHash,
      },
    });
    await prisma.userRole.create({
      data: { userId: gm.id, roleId: gmRole.id, branchId },
    });

    // Create Teacher 1 User & Profile
    const t1 = await prisma.user.create({
      data: {
        forumId,
        branchId,
        username: `teacher1_${run}`,
        usernameNormalized: normalizeUsername(`teacher1_${run}`),
        displayName: 'الأستاذ أحمد',
        passwordHash,
      },
    });
    await prisma.userRole.create({
      data: { userId: t1.id, roleId: teacherRole.id, branchId },
    });
    const tp1 = await prisma.teacherProfile.create({ data: { userId: t1.id } });

    // Create Teacher 2 User & Profile (Other Halaqa)
    const t2 = await prisma.user.create({
      data: {
        forumId,
        branchId,
        username: `teacher2_${run}`,
        usernameNormalized: normalizeUsername(`teacher2_${run}`),
        displayName: 'الأستاذ خالد',
        passwordHash,
      },
    });
    await prisma.userRole.create({
      data: { userId: t2.id, roleId: teacherRole.id, branchId },
    });
    const tp2 = await prisma.teacherProfile.create({ data: { userId: t2.id } });

    // Create Student User & Profile
    const s1 = await prisma.user.create({
      data: {
        forumId,
        branchId,
        username: `student_${run}`,
        usernameNormalized: normalizeUsername(`student_${run}`),
        displayName: 'الطالب بلال',
        passwordHash,
      },
    });
    await prisma.userRole.create({
      data: { userId: s1.id, roleId: studentRole.id, branchId },
    });
    const sp1 = await prisma.studentProfile.create({
      data: { userId: s1.id, studentNumber: `ST-${Date.now().toString().slice(-5)}` },
    });
    studentProfileId = sp1.id;

    // Create Halaqa 1 (Assigned to Teacher 1)
    const h1 = await prisma.halaqa.create({
      data: {
        forumId,
        branchId,
        name: 'حلقة الإتقان',
        code: `H1_${Date.now().toString().slice(-4)}`,
      },
    });
    halaqaId = h1.id;
    await prisma.halaqaTeacher.create({
      data: { halaqaId: h1.id, teacherId: tp1.id },
    });

    // Create Halaqa 2 (Assigned to Teacher 2)
    const h2 = await prisma.halaqa.create({
      data: {
        forumId,
        branchId,
        name: 'حلقة النور',
        code: `H2_${Date.now().toString().slice(-4)}`,
      },
    });
    await prisma.halaqaTeacher.create({
      data: { halaqaId: h2.id, teacherId: tp2.id },
    });

    // Enroll Student in Halaqa 1
    await prisma.halaqaMember.create({
      data: { halaqaId: h1.id, studentId: sp1.id },
    });

    managerToken = await login(`gm_${run}`);
    teacherToken = await login(`teacher1_${run}`);
    otherTeacherToken = await login(`teacher2_${run}`);
  });

  afterAll(async () => {
    if (app) await app.close();
  });

  describe('Academic Years & Terms', () => {
    let academicYearId: string;

    it('rejects creation when endsAt <= startsAt', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/academic-years')
        .set(bearer())
        .send({
          name: 'عام غير صالح',
          startsAt: '2026-09-01',
          endsAt: '2026-08-01',
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('creates an academic year successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/academic-years')
        .set(bearer())
        .send({
          name: `1448 هـ / 2026-2027 ${run}`,
          startsAt: '2026-09-01',
          endsAt: '2027-06-30',
          isActive: true,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(res.body.isActive).toBe(true);
      academicYearId = res.body.id;
    });

    it('enforces single active academic year per forum', async () => {
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/academic-years')
        .set(bearer())
        .send({
          name: `1449 هـ / 2027-2028 ${run}`,
          startsAt: '2027-09-01',
          endsAt: '2028-06-30',
          isActive: true,
        })
        .expect(HttpStatus.CREATED);

      const oldYear = await prisma.academicYear.findUnique({
        where: { id: academicYearId },
      });
      expect(oldYear?.isActive).toBe(false);
      expect(res2.body.isActive).toBe(true);

      // Re-activate first year
      await request(app.getHttpServer())
        .post(`/api/v1/academic-years/${academicYearId}/activate`)
        .set(bearer())
        .expect(HttpStatus.CREATED);

      const recheckedOldYear = await prisma.academicYear.findUnique({
        where: { id: academicYearId },
      });
      expect(recheckedOldYear?.isActive).toBe(true);
    });

    it('adds a term with date boundaries validated', async () => {
      // Out of bounds term date
      await request(app.getHttpServer())
        .post(`/api/v1/academic-years/${academicYearId}/terms`)
        .set(bearer())
        .send({
          name: 'الفترة الصيفية الشاذة',
          startsAt: '2025-01-01',
          endsAt: '2025-06-01',
        })
        .expect(HttpStatus.BAD_REQUEST);

      // Valid term
      const res = await request(app.getHttpServer())
        .post(`/api/v1/academic-years/${academicYearId}/terms`)
        .set(bearer())
        .send({
          name: 'الفصل الدراسي الأول',
          startsAt: '2026-09-01',
          endsAt: '2027-01-15',
          order: 1,
          isActive: true,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(res.body.name).toBe('الفصل الدراسي الأول');
    });
  });

  describe('Educational Plans', () => {
    let planId: string;
    let planItemId: string;

    it('creates an educational plan for a halaqa', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/educational-plans')
        .set(bearer())
        .send({
          name: 'خطة حفظ جزء عم لحلقة الإتقان',
          type: 'HIFZ',
          halaqaId,
          startDate: '2026-09-01',
          endDate: '2027-01-15',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      planId = res.body.id;
    });

    it('adds and updates plan items', async () => {
      const itemRes = await request(app.getHttpServer())
        .post(`/api/v1/educational-plans/${planId}/items`)
        .set(bearer())
        .send({
          type: 'MEMORIZATION',
          targetType: 'VERSES',
          surahNumber: 78,
          fromAyah: 1,
          toAyah: 20,
          order: 1,
        })
        .expect(HttpStatus.CREATED);

      expect(itemRes.body.id).toBeDefined();
      planItemId = itemRes.body.id;

      const updateRes = await request(app.getHttpServer())
        .patch(`/api/v1/educational-plans/items/${planItemId}`)
        .set(bearer())
        .send({ toAyah: 30 })
        .expect(HttpStatus.OK);

      expect(updateRes.body.toAyah).toBe(30);
    });

    it('activates and lists the educational plan', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/educational-plans/${planId}/activate`)
        .set(bearer())
        .expect(HttpStatus.CREATED);

      const listRes = await request(app.getHttpServer())
        .get(`/api/v1/educational-plans?halaqaId=${halaqaId}`)
        .set(bearer())
        .expect(HttpStatus.OK);

      expect(listRes.body.items.length).toBeGreaterThanOrEqual(1);
      expect(listRes.body.items[0].status).toBe('ACTIVE');
    });
  });

  describe('Attendance Sessions & IDOR Security', () => {
    const todayStr = new Date().toISOString().split('T')[0];

    it('denies Teacher 2 recording attendance for Halaqa 1 (IDOR protection)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/halaqas/${halaqaId}/attendance/sessions`)
        .set(bearer(otherTeacherToken))
        .send({
          sessionDate: todayStr,
          records: [{ studentId: studentProfileId, status: 'PRESENT' }],
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('rejects recording attendance for a student not in the halaqa', async () => {
      const fakeStudentId = '00000000-0000-0000-0000-000000000000';
      await request(app.getHttpServer())
        .post(`/api/v1/halaqas/${halaqaId}/attendance/sessions`)
        .set(bearer(teacherToken))
        .send({
          sessionDate: todayStr,
          records: [{ studentId: fakeStudentId, status: 'PRESENT' }],
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('records and updates bulk attendance successfully for Teacher 1', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/halaqas/${halaqaId}/attendance/sessions`)
        .set(bearer(teacherToken))
        .send({
          sessionDate: todayStr,
          notes: 'حضور منتظم وتفاعل ممتاز',
          records: [{ studentId: studentProfileId, status: 'PRESENT' }],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.records.length).toBe(1);
      expect(res.body.records[0].status).toBe('PRESENT');

      // Check summary
      const summaryRes = await request(app.getHttpServer())
        .get(`/api/v1/halaqas/${halaqaId}/attendance/summary`)
        .set(bearer(teacherToken))
        .expect(HttpStatus.OK);

      expect(summaryRes.body.present).toBe(1);
      expect(summaryRes.body.attendanceRate).toBe(100);
    });
  });

  describe('Memorization & Revision Operations', () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const mutationId = `11111111-2222-4333-8444-${Date.now().toString().slice(-12).padStart(12, '0')}`;

    it('denies Teacher 2 recording memorization for Student 1 in Halaqa 1', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/memorization')
        .set(bearer(otherTeacherToken))
        .send({
          studentId: studentProfileId,
          halaqaId,
          date: todayStr,
          surahNumber: 78,
          fromAyah: 1,
          toAyah: 10,
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('records memorization with score and rating', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/memorization')
        .set(bearer(teacherToken))
        .send({
          studentId: studentProfileId,
          halaqaId,
          date: todayStr,
          surahNumber: 78,
          fromAyah: 1,
          toAyah: 10,
          evaluationScore: 98.5,
          rating: 'EXCELLENT',
          mistakesCount: 0,
          clientMutationId: mutationId,
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(Number(res.body.evaluationScore)).toBe(98.5);

      // Idempotency check: sending duplicate with same mutation ID
      const dupRes = await request(app.getHttpServer())
        .post('/api/v1/memorization')
        .set(bearer(teacherToken))
        .send({
          studentId: studentProfileId,
          halaqaId,
          date: todayStr,
          surahNumber: 78,
          fromAyah: 1,
          toAyah: 10,
          clientMutationId: mutationId,
        })
        .expect(HttpStatus.CREATED);

      expect(dupRes.body.id).toBe(res.body.id);
    });

    it('records revision successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/revision')
        .set(bearer(teacherToken))
        .send({
          studentId: studentProfileId,
          halaqaId,
          date: todayStr,
          surahNumber: 1,
          fromAyah: 1,
          toAyah: 7,
          evaluationScore: 100,
          rating: 'EXCELLENT',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
    });
  });

  describe('Student Progress & Teacher Workspace APIs', () => {
    it('calculates comprehensive student progress', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/students/${studentProfileId}/progress`)
        .set(bearer())
        .expect(HttpStatus.OK);

      expect(res.body.student.id).toBe(studentProfileId);
      expect(res.body.metrics.attendanceRate).toBe(100);
      expect(res.body.metrics.totalMemorizationSessions).toBeGreaterThanOrEqual(1);
      expect(res.body.recentMemorization.length).toBeGreaterThanOrEqual(1);
      expect(res.body.recentRevision.length).toBeGreaterThanOrEqual(1);
    });

    it('returns teacher workspace with today snapshot', async () => {
      const myHalaqasRes = await request(app.getHttpServer())
        .get('/api/v1/teacher/me/halaqas')
        .set(bearer(teacherToken))
        .expect(HttpStatus.OK);

      expect(myHalaqasRes.body.length).toBe(1);
      expect(myHalaqasRes.body[0].id).toBe(halaqaId);

      const todayRes = await request(app.getHttpServer())
        .get(`/api/v1/teacher/me/halaqas/${halaqaId}/today`)
        .set(bearer(teacherToken))
        .expect(HttpStatus.OK);

      expect(todayRes.body.halaqa.id).toBe(halaqaId);
      expect(todayRes.body.students.length).toBe(1);
      expect(todayRes.body.students[0].todayAttendanceStatus).toBe('PRESENT');
      expect(todayRes.body.students[0].todayMemorization).toBeDefined();
    });
  });
});
