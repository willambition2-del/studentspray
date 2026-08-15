/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { RequestIdMiddleware } from '../src/common/middleware/request-id.middleware';
import { PrismaService } from '../src/database/prisma.service';
import { PasswordService } from '../src/auth/password.service';
import { BootstrapGeneralManagerService } from '../src/auth/bootstrap-general-manager.service';
import { AccessScopeService } from '../src/authorization/access-scope.service';
import type { AuthenticatedUser } from '../src/auth/types/authenticated-user';
import { normalizeUsername } from '../src/auth/utils/identifier';

type LoginResult = {
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt?: string;
  sessionId?: string;
};

describe('Authentication and authorization (e2e)', () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  let scopes: AccessScopeService;
  let bootstrapManagers: BootstrapGeneralManagerService;
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const forumSlug = `auth-e2e-${runId}`;
  const initialPassword = 'Initial-Test-Password-2026!';
  const changedPassword = 'Changed-Test-Password-2026!';
  const userIds: string[] = [];
  let forumId: string;
  let branchAId: string;
  let branchBId: string;
  let managerRoleId: string;
  let teacherRoleId: string;
  let studentRoleId: string;
  let parentRoleId: string;
  let managerUsername: string;
  let inactiveUsername: string;
  let lockUsername: string;
  let passwordUsername: string;
  let logoutAllUsername: string;
  let concurrentUsername: string;
  let teacherAUser: AuthenticatedUser;
  let studentAUser: AuthenticatedUser;
  let parentAUser: AuthenticatedUser;
  let halaqaAId: string;
  let halaqaBId: string;
  let studentAProfileId: string;
  let studentBProfileId: string;

  const origin = 'http://localhost:5173';

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix('api/v1');
    const requestId = new RequestIdMiddleware();
    app.use(requestId.use.bind(requestId));
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);
    passwords = app.get(PasswordService);
    scopes = app.get(AccessScopeService);
    bootstrapManagers = app.get(BootstrapGeneralManagerService);
    await prisma.securityAuditLog.deleteMany({ where: { requestId: { startsWith: 'auth-e2e-' } } });
    const passwordHash = await passwords.hashPassword(initialPassword);
    const forum = await prisma.forum.create({ data: { name: `Auth E2E ${runId}`, slug: forumSlug } });
    forumId = forum.id;
    const [branchA, branchB] = await Promise.all([
      prisma.branch.create({ data: { forumId, name: 'Branch A', code: `A-${runId}` } }),
      prisma.branch.create({ data: { forumId, name: 'Branch B', code: `B-${runId}` } }),
    ]);
    branchAId = branchA.id;
    branchBId = branchB.id;
    const [managerRole, teacherRole, studentRole, parentRole] = await Promise.all([
      prisma.role.create({ data: { forumId, name: 'GENERAL_MANAGER', displayName: 'General Manager', isSystem: true } }),
      prisma.role.create({ data: { forumId, name: 'TEACHER', displayName: 'Teacher', isSystem: true } }),
      prisma.role.create({ data: { forumId, name: 'STUDENT', displayName: 'Student', isSystem: true } }),
      prisma.role.create({ data: { forumId, name: 'PARENT', displayName: 'Parent', isSystem: true } }),
    ]);
    managerRoleId = managerRole.id;
    teacherRoleId = teacherRole.id;
    studentRoleId = studentRole.id;
    parentRoleId = parentRole.id;

    const createUser = async (prefix: string, roleId: string, branchId: string, active = true) => {
      const username = `${prefix}_${runId}`;
      const user = await prisma.user.create({
        data: {
          forumId,
          branchId,
          username,
          usernameNormalized: normalizeUsername(username),
          passwordHash,
          passwordChangedAt: new Date(),
          isActive: active,
          roles: { create: { roleId, branchId } },
        },
      });
      userIds.push(user.id);
      return user;
    };

    const manager = await createUser('manager', managerRoleId, branchAId);
    managerUsername = manager.username;
    inactiveUsername = (await createUser('inactive', managerRoleId, branchAId, false)).username;
    lockUsername = (await createUser('lock', managerRoleId, branchAId)).username;
    passwordUsername = (await createUser('password', managerRoleId, branchAId)).username;
    logoutAllUsername = (await createUser('logoutall', managerRoleId, branchAId)).username;
    concurrentUsername = (await createUser('concurrent', managerRoleId, branchAId)).username;

    const teacherA = await createUser('teacher-a', teacherRoleId, branchAId);
    const teacherB = await createUser('teacher-b', teacherRoleId, branchBId);
    const studentA = await createUser('student-a', studentRoleId, branchAId);
    const studentB = await createUser('student-b', studentRoleId, branchBId);
    const parentA = await createUser('parent-a', parentRoleId, branchAId);
    const teacherAProfile = await prisma.teacherProfile.create({ data: { userId: teacherA.id } });
    const teacherBProfile = await prisma.teacherProfile.create({ data: { userId: teacherB.id } });
    const studentAProfile = await prisma.studentProfile.create({ data: { userId: studentA.id } });
    const studentBProfile = await prisma.studentProfile.create({ data: { userId: studentB.id } });
    const parentAProfile = await prisma.parentProfile.create({ data: { userId: parentA.id } });
    studentAProfileId = studentAProfile.id;
    studentBProfileId = studentBProfile.id;
    await prisma.studentGuardian.create({ data: { studentId: studentAProfile.id, parentId: parentAProfile.id, relationship: 'FATHER' } });
    const halaqaA = await prisma.halaqa.create({ data: { forumId, branchId: branchAId, name: 'Halaqa A', code: `HA-${runId}` } });
    const halaqaB = await prisma.halaqa.create({ data: { forumId, branchId: branchBId, name: 'Halaqa B', code: `HB-${runId}` } });
    halaqaAId = halaqaA.id;
    halaqaBId = halaqaB.id;
    await Promise.all([
      prisma.halaqaTeacher.create({ data: { halaqaId: halaqaA.id, teacherId: teacherAProfile.id } }),
      prisma.halaqaTeacher.create({ data: { halaqaId: halaqaB.id, teacherId: teacherBProfile.id } }),
      prisma.halaqaMember.create({ data: { halaqaId: halaqaA.id, studentId: studentAProfile.id } }),
      prisma.halaqaMember.create({ data: { halaqaId: halaqaB.id, studentId: studentBProfile.id } }),
    ]);
    teacherAUser = authUser(teacherA.id, teacherA.username, 'TEACHER', branchAId);
    studentAUser = authUser(studentA.id, studentA.username, 'STUDENT', branchAId);
    parentAUser = authUser(parentA.id, parentA.username, 'PARENT', branchAId);
  }, 60_000);

  afterAll(async () => {
    await prisma.securityAuditLog.deleteMany({
      where: { OR: [{ actorUserId: { in: userIds } }, { requestId: { startsWith: 'auth-e2e-' } }] },
    });
    await prisma.authSession.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.halaqaMember.deleteMany({ where: { halaqa: { forumId } } });
    await prisma.halaqaTeacher.deleteMany({ where: { halaqa: { forumId } } });
    await prisma.halaqaSupervisor.deleteMany({ where: { halaqa: { forumId } } });
    await prisma.studentGuardian.deleteMany({ where: { student: { user: { forumId } } } });
    await prisma.halaqa.deleteMany({ where: { forumId } });
    await prisma.userRole.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
    await prisma.role.deleteMany({ where: { forumId } });
    await prisma.branch.deleteMany({ where: { forumId } });
    await prisma.forum.delete({ where: { id: forumId } });
    await app.close();
  }, 30_000);

  it('protects endpoints and exposes no public registration', async () => {
    await request(app.getHttpServer()).get('/api/v1/auth/me').expect(HttpStatus.UNAUTHORIZED);
    await request(app.getHttpServer()).post('/api/v1/auth/register').send({}).expect(HttpStatus.NOT_FOUND);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Authorization', 'Bearer invalid').expect(HttpStatus.UNAUTHORIZED);
  });

  it('returns the same generic error for wrong passwords and unknown users', async () => {
    const wrong = await mobileLogin(managerUsername, 'Wrong-Test-Password-2026!', HttpStatus.UNAUTHORIZED);
    const unknown = await mobileLogin(`unknown_${runId}`, 'Wrong-Test-Password-2026!', HttpStatus.UNAUTHORIZED);
    expect(wrong.body.message).toBe('Invalid credentials');
    expect(unknown.body.message).toBe('Invalid credentials');
  });

  it('rejects inactive users', async () => {
    await mobileLogin(inactiveUsername, initialPassword, HttpStatus.UNAUTHORIZED);
  });

  it('locks an account after repeated failures', async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await mobileLogin(lockUsername, 'Wrong-Test-Password-2026!', HttpStatus.UNAUTHORIZED);
    }
    await mobileLogin(lockUsername, initialPassword, HttpStatus.UNAUTHORIZED);
    const account = await prisma.user.findFirstOrThrow({ where: { forumId, username: lockUsername } });
    expect(account.lockedUntil?.getTime()).toBeGreaterThan(Date.now());
  }, 30_000);

  it('supports web login, /auth/me, rotation, reuse detection, and logout', async () => {
    const agent = request.agent(app.getHttpServer());
    const login = await agent.post('/api/v1/auth/web/login').send(loginBody(managerUsername)).expect(HttpStatus.OK);
    const cookieA = cookiePair(login.headers['set-cookie']);
    expect(login.headers['set-cookie']?.[0]).toContain('HttpOnly');
    expect(login.headers['set-cookie']?.[0]).toContain('SameSite=Strict');
    expect(login.body.refreshToken).toBeUndefined();
    await agent.get('/api/v1/auth/me').set('Authorization', `Bearer ${login.body.accessToken}`).expect(HttpStatus.OK)
      .expect(({ body }) => expect(body).not.toHaveProperty('passwordHash'));

    const refreshed = await agent.post('/api/v1/auth/web/refresh').set('Origin', origin).expect(HttpStatus.OK);
    expect(refreshed.body.accessToken).toBeDefined();
    await request(app.getHttpServer()).post('/api/v1/auth/web/refresh').set('Origin', origin).set('Cookie', cookieA).expect(HttpStatus.UNAUTHORIZED);
    await agent.post('/api/v1/auth/web/refresh').set('Origin', origin).expect(HttpStatus.UNAUTHORIZED);

    const secondLogin = await agent.post('/api/v1/auth/web/login').send(loginBody(managerUsername)).expect(HttpStatus.OK);
    await agent.post('/api/v1/auth/web/logout').set('Origin', origin).expect(HttpStatus.NO_CONTENT);
    await request(app.getHttpServer()).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${secondLogin.body.accessToken}`).expect(HttpStatus.UNAUTHORIZED);
  }, 30_000);

  it('rejects web cookie operations without a trusted Origin', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent.post('/api/v1/auth/web/login').send(loginBody(managerUsername)).expect(HttpStatus.OK);
    await agent.post('/api/v1/auth/web/refresh').expect(HttpStatus.FORBIDDEN);
    await agent.post('/api/v1/auth/web/logout').expect(HttpStatus.FORBIDDEN);
  });

  it('supports mobile login, refresh rotation, and logout', async () => {
    const login = await mobileLogin(managerUsername, initialPassword, HttpStatus.OK);
    const first = login.body as LoginResult;
    expect(first.refreshToken).toBeDefined();
    const refresh = await request(app.getHttpServer()).post('/api/v1/auth/mobile/refresh')
      .send({ refreshToken: first.refreshToken }).expect(HttpStatus.OK);
    await request(app.getHttpServer()).post('/api/v1/auth/mobile/logout')
      .send({ refreshToken: refresh.body.refreshToken }).expect(HttpStatus.NO_CONTENT);
    await request(app.getHttpServer()).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${refresh.body.accessToken}`).expect(HttpStatus.UNAUTHORIZED);
  });

  it('rejects access when the backing session expires', async () => {
    const login = (await mobileLogin(managerUsername, initialPassword, HttpStatus.OK)).body as LoginResult;
    await prisma.authSession.update({ where: { id: login.sessionId }, data: { expiresAt: new Date(Date.now() - 1_000) } });
    await request(app.getHttpServer()).get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${login.accessToken}`).expect(HttpStatus.UNAUTHORIZED);
  });

  it('allows only one concurrent refresh outcome', async () => {
    const login = await mobileLogin(concurrentUsername, initialPassword, HttpStatus.OK);
    const token = (login.body as LoginResult).refreshToken!;
    const outcomes = await Promise.all([
      request(app.getHttpServer()).post('/api/v1/auth/mobile/refresh').send({ refreshToken: token }),
      request(app.getHttpServer()).post('/api/v1/auth/mobile/refresh').send({ refreshToken: token }),
    ]);
    expect(outcomes.map((response) => response.status).sort()).toEqual([HttpStatus.OK, HttpStatus.UNAUTHORIZED]);
    const source = await prisma.authSession.findUniqueOrThrow({ where: { id: (login.body as LoginResult).sessionId } });
    expect(await prisma.authSession.count({ where: { tokenFamilyId: source.tokenFamilyId, revokedAt: null } })).toBeLessThanOrEqual(1);
  });

  it('changes password, revokes other sessions, and accepts only the new password', async () => {
    const first = (await mobileLogin(passwordUsername, initialPassword, HttpStatus.OK)).body as LoginResult;
    const second = (await mobileLogin(passwordUsername, initialPassword, HttpStatus.OK)).body as LoginResult;
    await request(app.getHttpServer()).post('/api/v1/auth/change-password')
      .set('Authorization', `Bearer ${first.accessToken}`)
      .send({ currentPassword: initialPassword, newPassword: changedPassword })
      .expect(HttpStatus.NO_CONTENT);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Authorization', `Bearer ${second.accessToken}`).expect(HttpStatus.UNAUTHORIZED);
    await mobileLogin(passwordUsername, initialPassword, HttpStatus.UNAUTHORIZED);
    await mobileLogin(passwordUsername, changedPassword, HttpStatus.OK);
  }, 30_000);

  it('logout-all revokes every session including the caller', async () => {
    const first = (await mobileLogin(logoutAllUsername, initialPassword, HttpStatus.OK)).body as LoginResult;
    const second = (await mobileLogin(logoutAllUsername, initialPassword, HttpStatus.OK)).body as LoginResult;
    await request(app.getHttpServer()).post('/api/v1/auth/logout-all')
      .set('Authorization', `Bearer ${first.accessToken}`).expect(HttpStatus.NO_CONTENT);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Authorization', `Bearer ${first.accessToken}`).expect(HttpStatus.UNAUTHORIZED);
    await request(app.getHttpServer()).get('/api/v1/auth/me').set('Authorization', `Bearer ${second.accessToken}`).expect(HttpStatus.UNAUTHORIZED);
  });

  it('enforces Halaqa and student IDOR scopes', async () => {
    await expect(scopes.canAccessHalaqa(teacherAUser, halaqaAId)).resolves.toBe(true);
    await expect(scopes.canAccessHalaqa(teacherAUser, halaqaBId)).resolves.toBe(false);
    await expect(scopes.canAccessStudent(teacherAUser, studentAProfileId)).resolves.toBe(true);
    await expect(scopes.canAccessStudent(teacherAUser, studentBProfileId)).resolves.toBe(false);
    await expect(scopes.canAccessStudent(parentAUser, studentAProfileId)).resolves.toBe(true);
    await expect(scopes.canAccessStudent(parentAUser, studentBProfileId)).resolves.toBe(false);
    await expect(scopes.canAccessStudent(studentAUser, studentAProfileId)).resolves.toBe(true);
    await expect(scopes.canAccessStudent(studentAUser, studentBProfileId)).resolves.toBe(false);
  });

  it('bootstraps exactly one General Manager without storing plaintext', async () => {
    const slug = `bootstrap-${runId}`;
    const forum = await prisma.forum.create({ data: { name: 'Bootstrap Test Forum', slug } });
    const role = await prisma.role.create({ data: { forumId: forum.id, name: 'GENERAL_MANAGER', displayName: 'General Manager' } });
    try {
      const created = await bootstrapManagers.createFirst({
        forumSlug: slug,
        username: `bootstrap_${runId}`,
        password: 'Bootstrap-Test-Password-2026!',
      });
      const account = await prisma.user.findUniqueOrThrow({ where: { id: created.id } });
      expect(account.passwordHash).toMatch(/^\$argon2id\$/);
      expect(account.passwordHash).not.toContain('Bootstrap-Test-Password-2026!');
      expect(account.mustChangePassword).toBe(true);
      await expect(bootstrapManagers.createFirst({
        forumSlug: slug,
        username: `second_${runId}`,
        password: 'Bootstrap-Test-Password-2026!',
      })).rejects.toThrow('already exists');
    } finally {
      await prisma.userRole.deleteMany({ where: { roleId: role.id } });
      await prisma.user.deleteMany({ where: { forumId: forum.id } });
      await prisma.role.delete({ where: { id: role.id } });
      await prisma.forum.delete({ where: { id: forum.id } });
    }
  });

  it('records security audit events without token or password material', async () => {
    const events = await prisma.securityAuditLog.findMany({ where: { actorUserId: { in: userIds } } });
    expect(events.some((event) => event.event === 'LOGIN_SUCCESS')).toBe(true);
    expect(events.some((event) => event.event === 'LOGIN_FAILED')).toBe(true);
    expect(events.some((event) => event.event === 'REFRESH_REUSE_DETECTED')).toBe(true);
    expect(events.some((event) => event.event === 'PASSWORD_CHANGED')).toBe(true);
    expect(JSON.stringify(events)).not.toContain(initialPassword);
  });

  function loginBody(username: string, password = initialPassword) {
    return { forumSlug, identifier: username, password };
  }

  function mobileLogin(username: string, password: string, status: number) {
    return request(app.getHttpServer()).post('/api/v1/auth/mobile/login')
      .set('x-request-id', `auth-e2e-${runId}-${Math.random().toString(16).slice(2)}`)
      .send(loginBody(username, password)).expect(status);
  }

  function cookiePair(setCookie: string | string[] | undefined): string {
    const first = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    if (!first) throw new Error('Refresh cookie was not set');
    return first.split(';')[0];
  }

  function authUser(id: string, username: string, role: string, branchId: string): AuthenticatedUser {
    return {
      id,
      username,
      branchId,
      forumId,
      sessionId: 'scope-test-session',
      mustChangePassword: false,
      roles: [{ id: `${role}-role`, name: role, branchId }],
      permissions: ['students.read', 'halaqas.read'],
    };
  }
});
