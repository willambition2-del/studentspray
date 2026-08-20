import 'dotenv/config';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DEMO_FORUM_SLUG } from '../scripts/clean-demo-four-months';

describe('Demo Dataset Role Access & API Contract E2E Tests', () => {
  let app: INestApplication;
  const password = process.env.DEMO_SEED_PASSWORD || 'Demo@Quran2026!Secure';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();
  }, 60000);

  afterAll(async () => {
    await app.close();
  });

  async function login(identifier: string) {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/mobile/login')
      .send({
        forumSlug: DEMO_FORUM_SLUG,
        identifier,
        password,
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    return res.body.accessToken as string;
  }

  it('1. TEACHER: login & full feature workflow', async () => {
    const token = await login('demo_teacher');

    // Mobile Home
    const homeRes = await request(app.getHttpServer())
      .get('/api/v1/teacher/me/mobile-home')
      .set('Authorization', `Bearer ${token}`);
    expect(homeRes.status).toBe(200);
    expect(homeRes.body.totalStudents).toBeGreaterThan(0);
    expect(homeRes.body.halaqasSummary.length).toBeGreaterThan(0);

    // Halaqas
    const halaqasRes = await request(app.getHttpServer())
      .get('/api/v1/teacher/me/halaqas')
      .set('Authorization', `Bearer ${token}`);
    expect(halaqasRes.status).toBe(200);
    expect(Array.isArray(halaqasRes.body)).toBe(true);
    expect(halaqasRes.body.length).toBeGreaterThan(0);

    // Halaqa Today Workspace
    const halaqaId = halaqasRes.body[0].id;
    const workspaceRes = await request(app.getHttpServer())
      .get(`/api/v1/teacher/me/halaqas/${halaqaId}/today`)
      .set('Authorization', `Bearer ${token}`);
    expect(workspaceRes.status).toBe(200);
    expect(workspaceRes.body.students.length).toBeGreaterThan(0);

    // Exams
    const examRes = await request(app.getHttpServer())
      .get('/api/v1/exams')
      .set('Authorization', `Bearer ${token}`);
    expect(examRes.status).toBe(200);
    expect(Array.isArray(examRes.body)).toBe(true);
    expect(examRes.body.length).toBeGreaterThan(0);

    // Educational Plans
    const planRes = await request(app.getHttpServer())
      .get('/api/v1/educational-plans')
      .set('Authorization', `Bearer ${token}`);
    expect(planRes.status).toBe(200);
    expect(planRes.body.items).toBeDefined();

    // Activities
    const actRes = await request(app.getHttpServer())
      .get('/api/v1/activities')
      .set('Authorization', `Bearer ${token}`);
    expect(actRes.status).toBe(200);
    expect(actRes.body.items).toBeDefined();

    // Competitions
    const compRes = await request(app.getHttpServer())
      .get('/api/v1/competitions')
      .set('Authorization', `Bearer ${token}`);
    expect(compRes.status).toBe(200);
    expect(compRes.body.items).toBeDefined();

    // Awards
    const awardRes = await request(app.getHttpServer())
      .get('/api/v1/awards')
      .set('Authorization', `Bearer ${token}`);
    expect(awardRes.status).toBe(200);
    expect(awardRes.body.items).toBeDefined();
  });

  it('2. SUPERVISOR: login & workspace workflow', async () => {
    const token = await login('demo_supervisor');

    // Dashboard
    const dashRes = await request(app.getHttpServer())
      .get('/api/v1/supervisor/me/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(dashRes.status).toBe(200);

    // Halaqas
    const halRes = await request(app.getHttpServer())
      .get('/api/v1/supervisor/me/halaqas')
      .set('Authorization', `Bearer ${token}`);
    expect(halRes.status).toBe(200);

    // Teachers
    const tchRes = await request(app.getHttpServer())
      .get('/api/v1/supervisor/me/teachers')
      .set('Authorization', `Bearer ${token}`);
    expect(tchRes.status).toBe(200);

    // Visits
    const visRes = await request(app.getHttpServer())
      .get('/api/v1/supervisor/me/visits')
      .set('Authorization', `Bearer ${token}`);
    expect(visRes.status).toBe(200);

    // Recommendations
    const recRes = await request(app.getHttpServer())
      .get('/api/v1/supervisor/me/recommendations')
      .set('Authorization', `Bearer ${token}`);
    expect(recRes.status).toBe(200);
  });

  it('3. STUDENT: login & portal endpoints', async () => {
    const token = await login('demo_student');

    // Dashboard
    const dashRes = await request(app.getHttpServer())
      .get('/api/v1/student/me/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(dashRes.status).toBe(200);
    expect(dashRes.body.student).toBeDefined();

    // Attendance
    const attRes = await request(app.getHttpServer())
      .get('/api/v1/student/me/attendance')
      .set('Authorization', `Bearer ${token}`);
    expect(attRes.status).toBe(200);

    // Memorization
    const memRes = await request(app.getHttpServer())
      .get('/api/v1/student/me/memorization')
      .set('Authorization', `Bearer ${token}`);
    expect(memRes.status).toBe(200);

    // Revision
    const revRes = await request(app.getHttpServer())
      .get('/api/v1/student/me/revision')
      .set('Authorization', `Bearer ${token}`);
    expect(revRes.status).toBe(200);

    // Exams
    const exRes = await request(app.getHttpServer())
      .get('/api/v1/student/me/exams')
      .set('Authorization', `Bearer ${token}`);
    expect(exRes.status).toBe(200);

    // Evaluations
    const evRes = await request(app.getHttpServer())
      .get('/api/v1/student/me/evaluations')
      .set('Authorization', `Bearer ${token}`);
    expect(evRes.status).toBe(200);
  });

  it('4. PARENT: login & children workflow', async () => {
    const token = await login('demo_parent');

    // Mobile Home
    const homeRes = await request(app.getHttpServer())
      .get('/api/v1/parent/me/mobile-home')
      .set('Authorization', `Bearer ${token}`);
    expect(homeRes.status).toBe(200);
    expect(homeRes.body.children.length).toBeGreaterThan(0);

    const childId = homeRes.body.children[0].id;

    // Child Dashboard
    const childDashRes = await request(app.getHttpServer())
      .get(`/api/v1/parent/me/children/${childId}/dashboard`)
      .set('Authorization', `Bearer ${token}`);
    expect(childDashRes.status).toBe(200);

    // Child Attendance
    const childAttRes = await request(app.getHttpServer())
      .get(`/api/v1/parent/me/children/${childId}/attendance`)
      .set('Authorization', `Bearer ${token}`);
    expect(childAttRes.status).toBe(200);

    // Child Memorization
    const childMemRes = await request(app.getHttpServer())
      .get(`/api/v1/parent/me/children/${childId}/memorization`)
      .set('Authorization', `Bearer ${token}`);
    expect(childMemRes.status).toBe(200);
  });

  it('5. GENERAL_MANAGER & EXECUTIVE_MANAGER: login & overview', async () => {
    const gmToken = await login('demo_gm');
    expect(gmToken).toBeDefined();

    const execToken = await login('demo_exec');
    expect(execToken).toBeDefined();
  });
});
