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
import { randomUUID } from 'crypto';

describe('Technical Supervisor Engine & Workspace APIs (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  const run = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const slug = `sup-e2e-${run}`;
  const password = 'Supervisor-Test-Password-2026!';
  let forumId: string;
  let branchId: string;
  let managerToken: string;
  let supervisorAToken: string;
  let supervisorBToken: string;

  let supervisorAProfileId: string;
  let supervisorBProfileId: string;
  let teacherAProfileId: string;
  let teacherBProfileId: string;
  let halaqaAId: string;
  let halaqaBId: string;
  let templateId: string;

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
      data: { name: `Forum ${run}`, slug },
    });
    forumId = forum.id;

    const branch = await prisma.branch.create({
      data: { forumId, name: 'Main Branch', code: 'MAIN' },
    });
    branchId = branch.id;

    const gmRole = await prisma.role.create({
      data: { forumId, name: 'GENERAL_MANAGER', displayName: 'General Manager', isSystem: true },
    });
    const supervisorRole = await prisma.role.create({
      data: { forumId, name: 'TECHNICAL_SUPERVISOR', displayName: 'المشرف التعليمي', isSystem: true },
    });
    const teacherRole = await prisma.role.create({
      data: { forumId, name: 'TEACHER', displayName: 'المعلم', isSystem: true },
    });

    const supPerms = [
      'students.read',
      'halaqas.read',
      'field_visits.read',
      'field_visits.write',
      'evaluations.read',
      'evaluations.write',
      'evaluation_templates.read',
      'recommendations.read',
      'recommendations.write',
      'supervisor_reports.read',
      'reports.read',
    ];

    const tchPerms = [
      'students.read',
      'halaqas.read',
      'attendance.read',
      'attendance.write',
      'memorization.read',
      'memorization.write',
      'revision.read',
      'revision.write',
      'field_visits.read',
      'recommendations.read',
    ];

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
      if (supPerms.includes(code)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: supervisorRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: supervisorRole.id, permissionId: permission.id },
        });
      }
      if (tchPerms.includes(code)) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: teacherRole.id, permissionId: permission.id } },
          update: {},
          create: { roleId: teacherRole.id, permissionId: permission.id },
        });
      }
    }

    const hash = await passwords.hashPassword(password);

    const createUserWithRole = async (username: string, roleId: string, displayName: string) => {
      const u = await prisma.user.create({
        data: {
          forumId,
          branchId,
          username,
          usernameNormalized: normalizeUsername(username),
          displayName,
          passwordHash: hash,
          isActive: true,
          roles: { create: { roleId, branchId } },
        },
      });
      return u;
    };

    const gmUser = await createUserWithRole(`gm_${run}`, gmRole.id, 'General Manager');
    const supAUser = await createUserWithRole(`sup_a_${run}`, supervisorRole.id, 'المشرف أحمد');
    const supBUser = await createUserWithRole(`sup_b_${run}`, supervisorRole.id, 'المشرف بدر');
    const tchAUser = await createUserWithRole(`tch_a_${run}`, teacherRole.id, 'الأستاذ عاصم');
    const tchBUser = await createUserWithRole(`tch_b_${run}`, teacherRole.id, 'الأستاذ بلال');

    const supAProf = await prisma.supervisorProfile.create({ data: { userId: supAUser.id } });
    supervisorAProfileId = supAProf.id;

    const supBProf = await prisma.supervisorProfile.create({ data: { userId: supBUser.id } });
    supervisorBProfileId = supBProf.id;

    const tchAProf = await prisma.teacherProfile.create({ data: { userId: tchAUser.id } });
    teacherAProfileId = tchAProf.id;

    const tchBProf = await prisma.teacherProfile.create({ data: { userId: tchBUser.id } });
    teacherBProfileId = tchBProf.id;

    // Halaqas
    const hA = await prisma.halaqa.create({
      data: {
        forumId,
        branchId,
        name: 'حلقة النور',
        code: `HAL-A-${run}`,
        supervisors: { create: { supervisorId: supervisorAProfileId } },
        teachers: { create: { teacherId: teacherAProfileId } },
      },
    });
    halaqaAId = hA.id;

    const hB = await prisma.halaqa.create({
      data: {
        forumId,
        branchId,
        name: 'حلقة الفتح',
        code: `HAL-B-${run}`,
        supervisors: { create: { supervisorId: supervisorBProfileId } },
        teachers: { create: { teacherId: teacherBProfileId } },
      },
    });
    halaqaBId = hB.id;

    // Tokens
    managerToken = await login(gmUser.username);
    supervisorAToken = await login(supAUser.username);
    supervisorBToken = await login(supBUser.username);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Evaluation Templates & Criteria Management', () => {
    it('creates an evaluation template with multiple weighted axes and criteria', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/evaluation-templates')
        .set(bearer(managerToken))
        .send({
          name: 'استمارة التقييم الميداني النموذجية',
          description: 'معايير تقييم الحلقات والمعلمين',
          isDefault: true,
          axes: [
            {
              name: 'الجانب التعليمي',
              weight: 50.0,
              criteria: [
                { name: 'جودة التلاوة ومخارج الحروف', type: 'SCALE_5', maxScore: 5.0, order: 1 },
                { name: 'تصحيح الأخطاء والتجويد', type: 'SCALE_5', maxScore: 5.0, order: 2 },
              ],
            },
            {
              name: 'الجانب الإداري والانضباط',
              weight: 50.0,
              criteria: [
                { name: 'حضور المعلم والبدء في الموعد', type: 'SCALE_5', maxScore: 5.0, order: 1 },
                { name: 'تسجيل الحضور في النظام', type: 'SCALE_5', maxScore: 5.0, order: 2 },
              ],
            },
          ],
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(res.body.version).toBe(1);
      expect(res.body.isDefault).toBe(true);
      expect(res.body.axes).toHaveLength(2);
      expect(res.body.axes[0].criteria).toHaveLength(2);
      templateId = res.body.id;
    });

    it('rejects template creation if axis weights sum is not 100%', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/evaluation-templates')
        .set(bearer(managerToken))
        .send({
          name: 'استمارة غير متوازنة',
          axes: [
            {
              name: 'محور 1',
              weight: 40.0,
              criteria: [{ name: 'معيار 1', maxScore: 5.0 }],
            },
          ],
        })
        .expect(HttpStatus.BAD_REQUEST);
    });

    it('retrieves active template via /api/v1/evaluation-templates/active', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/evaluation-templates/active')
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(res.body.id).toBe(templateId);
      expect(res.body.axes).toHaveLength(2);
    });
  });

  describe('2. Scoping & IDOR Enforcement', () => {
    it('supervisor A cannot access Halaqa B (outside scope)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/supervisor/me/visits')
        .set(bearer(supervisorAToken))
        .send({
          halaqaId: halaqaBId,
          teacherId: teacherBProfileId,
          visitType: 'ROUTINE',
        })
        .expect(HttpStatus.FORBIDDEN);
    });

    it('supervisor A cannot view teacher B detail', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/supervisor/me/teachers/${teacherBProfileId}`)
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.NOT_FOUND);
    });

    it('supervisor A lists only their assigned halaqas and teachers', async () => {
      const halaqasRes = await request(app.getHttpServer())
        .get('/api/v1/supervisor/me/halaqas')
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(halaqasRes.body).toHaveLength(1);
      expect(halaqasRes.body[0].id).toBe(halaqaAId);

      const teachersRes = await request(app.getHttpServer())
        .get('/api/v1/supervisor/me/teachers')
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(teachersRes.body).toHaveLength(1);
      expect(teachersRes.body[0].id).toBe(teacherAProfileId);
    });
  });

  describe('3. Field Visit Lifecycle & Idempotency', () => {
    let visitId: string;
    const clientMutationId = randomUUID();

    it('creates a field visit with clientMutationId idempotency', async () => {
      const res1 = await request(app.getHttpServer())
        .post('/api/v1/supervisor/me/visits')
        .set(bearer(supervisorAToken))
        .send({
          halaqaId: halaqaAId,
          teacherId: teacherAProfileId,
          visitType: 'ROUTINE',
          reason: 'زيارة دورية لمتابعة الحلقة',
          clientMutationId,
        })
        .expect(HttpStatus.CREATED);

      expect(res1.body.id).toBeDefined();
      expect(res1.body.status).toBe('PLANNED');
      expect(res1.body.visitNumber).toMatch(/^VIS-/);
      visitId = res1.body.id;

      // Idempotent retry returns same record
      const res2 = await request(app.getHttpServer())
        .post('/api/v1/supervisor/me/visits')
        .set(bearer(supervisorAToken))
        .send({
          halaqaId: halaqaAId,
          teacherId: teacherAProfileId,
          visitType: 'ROUTINE',
          clientMutationId,
        })
        .expect(HttpStatus.CREATED);

      expect(res2.body.id).toBe(visitId);
    });

    it('updates visit status to IN_PROGRESS', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/api/v1/supervisor/me/visits/${visitId}/status`)
        .set(bearer(supervisorAToken))
        .send({
          status: 'IN_PROGRESS',
          generalNotes: 'تم الوصول إلى المسجد وبدء الزيارة الميدانية',
        })
        .expect(HttpStatus.OK);

      expect(res.body.status).toBe('IN_PROGRESS');
      expect(res.body.startedAt).toBeDefined();
    });

    it('gets visit preparation workspace with live metrics & template', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/supervisor/me/visits/${visitId}/workspace`)
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(res.body.visit.id).toBe(visitId);
      expect(res.body.liveSnapshot).toBeDefined();
      expect(res.body.activeTemplate.id).toBe(templateId);
    });

    it('supervisor B cannot access or modify supervisor A visit', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/supervisor/me/visits/${visitId}`)
        .set(bearer(supervisorBToken))
        .expect(HttpStatus.FORBIDDEN);

      await request(app.getHttpServer())
        .patch(`/api/v1/supervisor/me/visits/${visitId}/status`)
        .set(bearer(supervisorBToken))
        .send({ status: 'CANCELLED' })
        .expect(HttpStatus.FORBIDDEN);
    });
  });

  describe('4. Evaluation Scoring Engine & Final Submit', () => {
    let visitId: string;
    let criteriaIds: string[];

    beforeAll(async () => {
      const tpl = await request(app.getHttpServer())
        .get('/api/v1/evaluation-templates/active')
        .set(bearer(supervisorAToken));
      const body = tpl.body as { axes: Array<{ criteria: Array<{ id: string }> }> };
      criteriaIds = body.axes.flatMap((a) => a.criteria.map((c) => c.id));

      const v = await request(app.getHttpServer())
        .post('/api/v1/supervisor/me/visits')
        .set(bearer(supervisorAToken))
        .send({
          halaqaId: halaqaAId,
          teacherId: teacherAProfileId,
          visitType: 'ROUTINE',
        });
      visitId = v.body.id;
    });

    it('saves an evaluation draft with partial scores', async () => {
      const res = await request(app.getHttpServer())
        .put(`/api/v1/supervisor/me/visits/${visitId}/evaluation`)
        .set(bearer(supervisorAToken))
        .send({
          templateId,
          status: 'DRAFT',
          strengths: 'تسميع متميز وهدوء بالحلقة',
          criteria: [
            { criterionId: criteriaIds[0], score: 4.5, notes: 'مخارج ممتازة' },
            { criterionId: criteriaIds[1], score: 4.0 },
          ],
        })
        .expect(HttpStatus.OK);

      expect(res.body.status).toBe('DRAFT');
      expect(res.body.criteriaEvaluations).toHaveLength(2);
    });

    it('submits final evaluation, verifies server-side score calculation, and completes visit', async () => {
      // Axis 1: max 10, earned 9 -> 90% (weight 50) -> 45
      // Axis 2: max 10, earned 9 -> 90% (weight 50) -> 45
      // Total: 90% -> level EXCELLENT
      const res = await request(app.getHttpServer())
        .post(`/api/v1/supervisor/me/visits/${visitId}/evaluation/submit`)
        .set(bearer(supervisorAToken))
        .send({
          templateId,
          strengths: 'إتقان التجويد والانضباط',
          improvementAreas: 'تفعيل المراجعة الصغرى',
          summary: 'أداء ممتاز وفق المعايير',
          criteria: [
            { criterionId: criteriaIds[0], score: 4.5 },
            { criterionId: criteriaIds[1], score: 4.5 },
            { criterionId: criteriaIds[2], score: 4.5 },
            { criterionId: criteriaIds[3], score: 4.5 },
          ],
        })
        .expect(HttpStatus.OK);

      expect(res.body.status).toBe('SUBMITTED');
      expect(Number(res.body.percentage)).toBe(90);
      expect(res.body.level).toBe('EXCELLENT');
      expect(res.body.submittedAt).toBeDefined();

      // Check visit is now COMPLETED
      const visitRes = await request(app.getHttpServer())
        .get(`/api/v1/supervisor/me/visits/${visitId}`)
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(visitRes.body.status).toBe('COMPLETED');
      expect(visitRes.body.completedAt).toBeDefined();
    });
  });

  describe('5. Recommendations & Follow-Up Timeline', () => {
    let recommendationId: string;
    let visitId: string;

    beforeAll(async () => {
      const v = await request(app.getHttpServer())
        .post('/api/v1/supervisor/me/visits')
        .set(bearer(supervisorAToken))
        .send({ halaqaId: halaqaAId, teacherId: teacherAProfileId });
      visitId = v.body.id;
    });

    it('creates a recommendation for a visit', async () => {
      const pastDue = new Date();
      pastDue.setDate(pastDue.getDate() - 2);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/supervisor/me/visits/${visitId}/recommendations`)
        .set(bearer(supervisorAToken))
        .send({
          halaqaId: halaqaAId,
          teacherId: teacherAProfileId,
          title: 'تطبيق التسميع المزدوج بين الطلاب',
          description: 'تنظيم الطلاب في ثنائيات لتثبيت الحفظ الجديد',
          priority: 'HIGH',
          dueDate: pastDue.toISOString().slice(0, 10),
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.id).toBeDefined();
      expect(res.body.status).toBe('OPEN');
      expect(res.body.priority).toBe('HIGH');
      recommendationId = res.body.id;
    });

    it('lists recommendations and correctly flags overdue items', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/supervisor/me/recommendations')
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(res.body.items).toHaveLength(1);
      expect(res.body.items[0].id).toBe(recommendationId);
      expect(res.body.items[0].isOverdue).toBe(true);
    });

    it('adds a follow-up record and completes the recommendation', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/supervisor/me/recommendations/${recommendationId}/follow-ups`)
        .set(bearer(supervisorAToken))
        .send({
          status: 'COMPLETED',
          notes: 'تم التحقق من تطبيق التسميع الثنائي وتفاعل الطلاب ممتاز',
        })
        .expect(HttpStatus.CREATED);

      expect(res.body.status).toBe('COMPLETED');
      expect(res.body.notes).toContain('تفاعل الطلاب ممتاز');

      // Verify recommendation is now COMPLETED and not overdue
      const listRes = await request(app.getHttpServer())
        .get('/api/v1/supervisor/me/recommendations')
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(listRes.body.items[0].status).toBe('COMPLETED');
      expect(listRes.body.items[0].isOverdue).toBe(false);
    });
  });

  describe('6. Supervisor Personal Dashboard & Reports', () => {
    it('returns accurate dashboard KPIs for supervisor', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/supervisor/me/dashboard')
        .set(bearer(supervisorAToken))
        .expect(HttpStatus.OK);

      expect(res.body.metrics.totalHalaqas).toBe(1);
      expect(res.body.metrics.totalTeachers).toBe(1);
      expect(res.body.metrics.totalVisitsCompleted).toBeGreaterThanOrEqual(1);
      expect(res.body.metrics.averageEvaluationScore).toBeGreaterThan(0);
      expect(res.body.recentVisits).toBeDefined();
    });
  });

  describe('7. Audit Trail Logging', () => {
    it('verifies audit logs recorded for supervisor engine actions', async () => {
      const logs = await prisma.auditLog.findMany({
        where: {
          action: {
            in: [
              'EVALUATION_TEMPLATE_CREATED',
              'FIELD_VISIT_CREATED',
              'EVALUATION_SUBMITTED',
              'RECOMMENDATION_CREATED',
              'RECOMMENDATION_FOLLOWUP_ADDED',
            ],
          },
        },
      });

      expect(logs.length).toBeGreaterThanOrEqual(5);
    });
  });
});
