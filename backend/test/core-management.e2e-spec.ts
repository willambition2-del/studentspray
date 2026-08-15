/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, ValidationPipe } from "@nestjs/common";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import cookieParser from "cookie-parser";
import request from "supertest";
import { AppModule } from "../src/app.module";
import { PasswordService } from "../src/auth/password.service";
import { normalizeUsername } from "../src/auth/utils/identifier";
import { PERMISSION_CATALOG } from "../src/authorization/permission-catalog";
import { HttpExceptionFilter } from "../src/common/filters/http-exception.filter";
import { RequestIdMiddleware } from "../src/common/middleware/request-id.middleware";
import { PrismaService } from "../src/database/prisma.service";

describe("Core management APIs (e2e)", () => {
  let app: NestExpressApplication;
  let prisma: PrismaService;
  let passwords: PasswordService;
  const run = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const slug = `core-e2e-${run}`;
  const password = "Core-E2E-Password-2026!";
  let forumId: string;
  let branchA: string;
  let branchB: string;
  let managerToken: string;
  let executiveToken: string;
  let managerId: string;
  let executiveId: string;
  let managerRoleId: string;
  let executiveRoleId: string;
  let teacherRoleId: string;

  const bearer = (token = managerToken) => ({
    Authorization: `Bearer ${token}`,
  });
  const login = async (username: string) =>
    (
      await request(app.getHttpServer())
        .post("/api/v1/auth/mobile/login")
        .send({ forumSlug: slug, identifier: username, password })
        .expect(HttpStatus.OK)
    ).body.accessToken as string;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = module.createNestApplication<NestExpressApplication>();
    app.setGlobalPrefix("api/v1");
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

    const forum = await prisma.forum.create({
      data: { name: "Core E2E", slug },
    });
    forumId = forum.id;
    const branches = await Promise.all([
      prisma.branch.create({ data: { forumId, name: "A", code: `A-${run}` } }),
      prisma.branch.create({ data: { forumId, name: "B", code: `B-${run}` } }),
    ]);
    branchA = branches[0].id;
    branchB = branches[1].id;

    const permissionIds = new Map<string, string>();
    for (const [code, description] of Object.entries(PERMISSION_CATALOG)) {
      const permission = await prisma.permission.upsert({
        where: { code },
        update: { description },
        create: { code, description },
      });
      permissionIds.set(code, permission.id);
    }
    const createRole = async (name: string, codes: string[]) =>
      prisma.role.create({
        data: {
          forumId,
          name,
          displayName: name,
          isSystem: true,
          permissions: {
            create: codes.map((code) => ({
              permissionId: permissionIds.get(code)!,
            })),
          },
        },
      });
    const all = Object.keys(PERMISSION_CATALOG);
    const [gm, executiveRole, teacher] =
      await Promise.all([
        createRole("GENERAL_MANAGER", all),
        createRole("EXECUTIVE_MANAGER", [
          "branches.read",
          "users.read",
          "users.manage",
          "roles.read",
          "roles.manage",
          "students.read",
          "students.manage",
          "halaqas.read",
          "halaqas.manage",
        ]),
        createRole("TEACHER", [
          "students.read",
          "halaqas.read",
          "halaqas.manage",
        ]),
        createRole("PARENT", ["students.read"]),
        createRole("STUDENT", ["students.read"]),
        createRole("TECHNICAL_SUPERVISOR", ["students.read", "halaqas.read"]),
      ]);
    managerRoleId = gm.id;
    executiveRoleId = executiveRole.id;
    teacherRoleId = teacher.id;
    const hash = await passwords.hashPassword(password);
    const createAccount = (
      username: string,
      roleId: string,
      targetBranch: string,
    ) =>
      prisma.user.create({
        data: {
          forumId,
          branchId: targetBranch,
          username,
          displayName: username,
          usernameNormalized: normalizeUsername(username),
          passwordHash: hash,
          passwordChangedAt: new Date(),
          roles: { create: { roleId, branchId: targetBranch } },
        },
      });
    const [manager, executiveAccount] = await Promise.all([
      createAccount(`gm_${run}`, managerRoleId, branchA),
      createAccount(`exec_${run}`, executiveRoleId, branchA),
    ]);
    managerId = manager.id;
    executiveId = executiveAccount.id;
    managerToken = await login(manager.username);
    executiveToken = await login(executiveAccount.username);
  }, 60_000);

  afterAll(async () => {
    await prisma.auditLog.deleteMany({ where: { actorUser: { forumId } } });
    await prisma.securityAuditLog.deleteMany({
      where: { actorUser: { forumId } },
    });
    await prisma.authSession.deleteMany({ where: { user: { forumId } } });
    await prisma.halaqaMember.deleteMany({ where: { halaqa: { forumId } } });
    await prisma.halaqaTeacher.deleteMany({ where: { halaqa: { forumId } } });
    await prisma.halaqaSupervisor.deleteMany({
      where: { halaqa: { forumId } },
    });
    await prisma.studentGuardian.deleteMany({
      where: { student: { user: { forumId } } },
    });
    await prisma.halaqa.deleteMany({ where: { forumId } });
    await prisma.userRole.deleteMany({ where: { user: { forumId } } });
    await prisma.user.deleteMany({ where: { forumId } });
    await prisma.role.deleteMany({ where: { forumId } });
    await prisma.branch.deleteMany({ where: { forumId } });
    await prisma.forum.delete({ where: { id: forumId } });
    await app.close();
  }, 30_000);

  it("manages the current forum and paginated branches while enforcing scope", async () => {
    await request(app.getHttpServer())
      .get("/api/v1/forums/current")
      .set(bearer())
      .expect(HttpStatus.OK)
      .expect(({ body }) => expect(body.id).toBe(forumId));
    await request(app.getHttpServer())
      .patch("/api/v1/forums/current")
      .set(bearer())
      .send({ name: "Core E2E Updated" })
      .expect(HttpStatus.OK);
    const created = await request(app.getHttpServer())
      .post("/api/v1/branches")
      .set(bearer())
      .send({ name: "Branch C", code: `C-${run}` })
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/branches/${created.body.id}/archive`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/branches/${created.body.id}/restore`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    const list = await request(app.getHttpServer())
      .get("/api/v1/branches?page=1&limit=1")
      .set(bearer())
      .expect(HttpStatus.OK);
    expect(list.body.items).toHaveLength(1);
    expect(list.body.meta.total).toBeGreaterThanOrEqual(3);
    await request(app.getHttpServer())
      .get(`/api/v1/branches/${branchB}`)
      .set(bearer(executiveToken))
      .expect(HttpStatus.NOT_FOUND);
  });

  it("creates users safely, rejects duplicates and unauthorized creation, and revokes sessions on suspension", async () => {
    const dto = {
      username: `managed_${run}`,
      displayName: "Managed User",
      branchId: branchA,
      roleId: teacherRoleId,
      temporaryPassword: password,
    };
    const created = await request(app.getHttpServer())
      .post("/api/v1/users")
      .set(bearer())
      .send(dto)
      .expect(HttpStatus.CREATED);
    expect(created.body).not.toHaveProperty("passwordHash");
    expect(created.body).not.toHaveProperty("failedLoginAttempts");
    await request(app.getHttpServer())
      .post("/api/v1/users")
      .set(bearer())
      .send(dto)
      .expect(HttpStatus.CONFLICT);
    await request(app.getHttpServer())
      .post("/api/v1/users")
      .send(dto)
      .expect(HttpStatus.UNAUTHORIZED);
    const token = await login(dto.username);
    await request(app.getHttpServer())
      .post(`/api/v1/users/${created.body.id}/suspend`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(token))
      .expect(HttpStatus.UNAUTHORIZED);
  });

  it("denies executive manager role and permission escalation", async () => {
    await request(app.getHttpServer())
      .put(`/api/v1/users/${executiveId}/role`)
      .set(bearer(executiveToken))
      .send({ roleId: managerRoleId, branchId: branchA })
      .expect(HttpStatus.FORBIDDEN);
    await request(app.getHttpServer())
      .put(`/api/v1/roles/${executiveRoleId}/permissions`)
      .set(bearer(executiveToken))
      .send({ permissionCodes: ["roles.manage", "settings.manage"] })
      .expect(HttpStatus.FORBIDDEN);
    await request(app.getHttpServer())
      .get("/api/v1/permissions")
      .set(bearer())
      .expect(HttpStatus.OK);
  });

  it("creates all profile account types and supports student pagination/update/archive", async () => {
    const base = (kind: string) => ({
      username: `${kind}_${run}`,
      displayName: kind,
      branchId: branchA,
      temporaryPassword: password,
    });
    const student = await request(app.getHttpServer())
      .post("/api/v1/students")
      .set(bearer())
      .send({ ...base("student"), studentNumber: `S-${run}` })
      .expect(HttpStatus.CREATED);
    const parent = await request(app.getHttpServer())
      .post("/api/v1/parents")
      .set(bearer())
      .send({ ...base("parent"), occupation: "Teacher" })
      .expect(HttpStatus.CREATED);
    const teacher = await request(app.getHttpServer())
      .post("/api/v1/teachers")
      .set(bearer())
      .send({ ...base("teacher"), employeeNumber: `T-${run}` })
      .expect(HttpStatus.CREATED);
    const supervisor = await request(app.getHttpServer())
      .post("/api/v1/supervisors")
      .set(bearer())
      .send({ ...base("supervisor"), employeeNumber: `V-${run}` })
      .expect(HttpStatus.CREATED);
    expect([
      student.body.id,
      parent.body.id,
      teacher.body.id,
      supervisor.body.id,
    ]).toHaveLength(4);
    await request(app.getHttpServer())
      .patch(`/api/v1/students/${student.body.id}`)
      .set(bearer())
      .send({ displayName: "Student Updated" })
      .expect(HttpStatus.OK);
    const page = await request(app.getHttpServer())
      .get("/api/v1/students?page=1&limit=1&search=Student")
      .set(bearer())
      .expect(HttpStatus.OK);
    expect(page.body.meta.limit).toBe(1);
    await request(app.getHttpServer())
      .post(`/api/v1/students/${student.body.id}/archive`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/students/${student.body.id}/restore`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
  });

  it("protects guardian links from duplication and parent IDOR", async () => {
    const make = (name: string) => ({
      username: `${name}_${run}`,
      displayName: name,
      branchId: branchA,
      temporaryPassword: password,
    });
    const parent = await request(app.getHttpServer())
      .post("/api/v1/parents")
      .set(bearer())
      .send(make("parentidor"))
      .expect(HttpStatus.CREATED);
    const related = await request(app.getHttpServer())
      .post("/api/v1/students")
      .set(bearer())
      .send(make("related"))
      .expect(HttpStatus.CREATED);
    const unrelated = await request(app.getHttpServer())
      .post("/api/v1/students")
      .set(bearer())
      .send(make("unrelated"))
      .expect(HttpStatus.CREATED);
    const link = {
      relationship: "FATHER",
      isPrimary: true,
      canReceiveNotifications: true,
    };
    await request(app.getHttpServer())
      .post(`/api/v1/parents/${parent.body.id}/students/${related.body.id}`)
      .set(bearer())
      .send(link)
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/parents/${parent.body.id}/students/${related.body.id}`)
      .set(bearer())
      .send(link)
      .expect(HttpStatus.CONFLICT);
    const parentToken = await login(make("parentidor").username);
    await request(app.getHttpServer())
      .get(`/api/v1/students/${related.body.id}`)
      .set(bearer(parentToken))
      .expect(HttpStatus.OK);
    await request(app.getHttpServer())
      .get(`/api/v1/students/${unrelated.body.id}`)
      .set(bearer(parentToken))
      .expect(HttpStatus.NOT_FOUND);
    await request(app.getHttpServer())
      .delete(`/api/v1/parents/${parent.body.id}/students/${related.body.id}`)
      .set(bearer())
      .expect(HttpStatus.OK);
  });

  it("preserves halaqa memberships and assignments, prevents duplicates, transfers atomically, and enforces teacher scope", async () => {
    const account = (name: string, branchId = branchA) => ({
      username: `${name}_${run}`,
      displayName: name,
      branchId,
      temporaryPassword: password,
    });
    const student = await request(app.getHttpServer())
      .post("/api/v1/students")
      .set(bearer())
      .send(account("transfer"))
      .expect(HttpStatus.CREATED);
    const teacher = await request(app.getHttpServer())
      .post("/api/v1/teachers")
      .set(bearer())
      .send(account("scope-teacher"))
      .expect(HttpStatus.CREATED);
    const supervisor = await request(app.getHttpServer())
      .post("/api/v1/supervisors")
      .set(bearer())
      .send(account("assign-supervisor"))
      .expect(HttpStatus.CREATED);
    const h1 = await request(app.getHttpServer())
      .post("/api/v1/halaqas")
      .set(bearer())
      .send({ branchId: branchA, name: "H1", code: `H1-${run.slice(-8)}` })
      .expect(HttpStatus.CREATED);
    const h2 = await request(app.getHttpServer())
      .post("/api/v1/halaqas")
      .set(bearer())
      .send({ branchId: branchA, name: "H2", code: `H2-${run.slice(-8)}` })
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/halaqas/${h1.body.id}/students/${student.body.id}`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    const duplicateMembers = await Promise.all([
      request(app.getHttpServer())
        .post(`/api/v1/halaqas/${h2.body.id}/students/${student.body.id}`)
        .set(bearer()),
      request(app.getHttpServer())
        .post(`/api/v1/halaqas/${h2.body.id}/students/${student.body.id}`)
        .set(bearer()),
    ]);
    expect(
      duplicateMembers.every((res) => res.status === 409),
    ).toBe(true);
    await request(app.getHttpServer())
      .post(`/api/v1/halaqas/${h1.body.id}/teachers/${teacher.body.id}`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/halaqas/${h1.body.id}/teachers/${teacher.body.id}`)
      .set(bearer())
      .expect(HttpStatus.CONFLICT);
    await request(app.getHttpServer())
      .post(`/api/v1/halaqas/${h1.body.id}/supervisors/${supervisor.body.id}`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(`/api/v1/students/${student.body.id}/transfer-halaqa`)
      .set(bearer())
      .send({ halaqaId: h2.body.id })
      .expect(HttpStatus.CREATED);
    const history = await prisma.halaqaMember.findMany({
      where: { studentId: student.body.id },
      orderBy: { startedAt: "asc" },
    });
    expect(history).toHaveLength(2);
    expect(history.filter((item) => item.isActive)).toHaveLength(1);
    expect(history[0].endedAt).not.toBeNull();
    const teacherToken = await login(account("scope-teacher").username);
    await request(app.getHttpServer())
      .patch(`/api/v1/halaqas/${h2.body.id}`)
      .set(bearer(teacherToken))
      .send({ name: "Forbidden" })
      .expect(HttpStatus.NOT_FOUND);
    await request(app.getHttpServer())
      .post(`/api/v1/halaqas/${h1.body.id}/teachers/${teacher.body.id}/end`)
      .set(bearer())
      .expect(HttpStatus.CREATED);
    await request(app.getHttpServer())
      .post(
        `/api/v1/halaqas/${h1.body.id}/supervisors/${supervisor.body.id}/end`,
      )
      .set(bearer())
      .expect(HttpStatus.CREATED);
  });

  it("records business audit events without password material", async () => {
    const logs = await prisma.auditLog.findMany({
      where: { actorUserId: managerId },
    });
    expect(logs.length).toBeGreaterThan(10);
    expect(logs.some((log) => log.action === "STUDENT_TRANSFERRED")).toBe(true);
    expect(JSON.stringify(logs)).not.toContain(password);
  });
});
