/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AuditService } from "../audit/audit.service";
import { AccessScopeService } from "../authorization/access-scope.service";
import { AuthorizationService } from "../authorization/authorization.service";
import { pageArgs, paginated } from "../common/dto/pagination-query.dto";
import { PrismaService } from "../database/prisma.service";
import type {
  CreateHalaqaDto,
  HalaqaQueryDto,
  UpdateHalaqaDto,
} from "./dto/halaqa.dto";
const details = {
  branch: true,
  members: {
    where: { isActive: true, endedAt: null },
    include: {
      student: {
        include: {
          user: { select: { id: true, displayName: true, username: true } },
        },
      },
    },
  },
  teachers: {
    where: { isActive: true, endedAt: null },
    include: {
      teacher: {
        include: {
          user: { select: { id: true, displayName: true, username: true } },
        },
      },
    },
  },
  supervisors: {
    where: { isActive: true, endedAt: null },
    include: {
      supervisor: {
        include: {
          user: { select: { id: true, displayName: true, username: true } },
        },
      },
    },
  },
} as const;
@Injectable()
export class HalaqasService {
  constructor(
    private readonly p: PrismaService,
    private readonly scopes: AccessScopeService,
    private readonly z: AuthorizationService,
    private readonly audit: AuditService,
  ) {}
  private async access(u: AuthenticatedUser, id: string) {
    if (!(await this.scopes.canAccessHalaqa(u, id)))
      throw new NotFoundException({
        code: "HALAQA_NOT_FOUND",
        message: "Halaqa not found",
      });
  }
  private conflict(e: unknown): never {
    if ((e as { code?: string }).code === "P2002")
      throw new ConflictException({
        code: "ACTIVE_RELATIONSHIP_ALREADY_EXISTS",
        message: "An active membership or assignment already exists",
      });
    throw e;
  }
  async list(u: AuthenticatedUser, q: HalaqaQueryDto) {
    if (q.branchId && !(await this.scopes.canAccessBranch(u, q.branchId)))
      throw new ForbiddenException({
        code: "BRANCH_SCOPE_DENIED",
        message: "Branch is outside your access scope",
      });
    const branches = this.z.scopedBranches(u);
    const where = {
      forumId: u.forumId,
      deletedAt: q.status === "archived" ? { not: null } : null,
      ...(q.status === "inactive"
        ? { isActive: false }
        : q.status === "active" || !q.status
          ? { isActive: true }
          : {}),
      ...(q.branchId
        ? { branchId: q.branchId }
        : !this.z.hasRole(u, "GENERAL_MANAGER") && branches.length
          ? { branchId: { in: branches } }
          : {}),
      ...(q.teacherId
        ? {
            teachers: {
              some: { teacherId: q.teacherId, isActive: true, endedAt: null },
            },
          }
        : this.z.hasRole(u, "TEACHER")
          ? {
              teachers: {
                some: {
                  isActive: true,
                  endedAt: null,
                  teacher: { userId: u.id },
                },
              },
            }
          : {}),
      ...(q.supervisorId
        ? {
            supervisors: {
              some: {
                supervisorId: q.supervisorId,
                isActive: true,
                endedAt: null,
              },
            },
          }
        : this.z.hasRole(u, "TECHNICAL_SUPERVISOR")
          ? {
              supervisors: {
                some: {
                  isActive: true,
                  endedAt: null,
                  supervisor: { userId: u.id },
                },
              },
            }
          : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" as const } },
              { code: { contains: q.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.p.$transaction([
      this.p.halaqa.findMany({
        where,
        ...pageArgs(q),
        include: details,
        orderBy: { createdAt: "desc" },
      }),
      this.p.halaqa.count({ where }),
    ]);
    return paginated(items, total, q);
  }
  async get(u: AuthenticatedUser, id: string) {
    await this.access(u, id);
    return this.p.halaqa.findUnique({ where: { id }, include: details });
  }
  async create(u: AuthenticatedUser, d: CreateHalaqaDto, c: AuthContext) {
    if (!(await this.scopes.canAccessBranch(u, d.branchId)))
      throw new ForbiddenException({
        code: "BRANCH_SCOPE_DENIED",
        message: "Branch is outside your access scope",
      });
    try {
      return await this.p.$transaction(async (tx) => {
        const h = await tx.halaqa.create({
          data: {
            forumId: u.forumId,
            branchId: d.branchId,
            name: d.name,
            code: d.code.toUpperCase(),
            description: d.description,
          },
        });
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: "HALAQA_CREATED",
            entityType: "Halaqa",
            entityId: h.id,
            after: h,
          },
          tx,
        );
        return h;
      });
    } catch (e) {
      return this.conflict(e);
    }
  }
  async update(
    u: AuthenticatedUser,
    id: string,
    d: UpdateHalaqaDto,
    c: AuthContext,
  ) {
    await this.access(u, id);
    return this.p.$transaction(async (tx) => {
      const before = await tx.halaqa.findUniqueOrThrow({ where: { id } });
      const after = await tx.halaqa.update({
        where: { id },
        data: { ...d, code: d.code?.toUpperCase() },
      });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: "HALAQA_UPDATED",
          entityType: "Halaqa",
          entityId: id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
  async archive(
    u: AuthenticatedUser,
    id: string,
    restore: boolean,
    c: AuthContext,
  ) {
    if (restore) {
      const archived = await this.p.halaqa.findFirst({
        where: { id, forumId: u.forumId, deletedAt: { not: null } },
        select: { branchId: true },
      });
      if (!archived || !(await this.scopes.canAccessBranch(u, archived.branchId)))
        throw new NotFoundException({ code: "HALAQA_NOT_FOUND", message: "Halaqa not found" });
    } else {
      await this.access(u, id);
    }
    return this.p.$transaction(async (tx) => {
      const before = await tx.halaqa.findUniqueOrThrow({ where: { id } });
      const after = await tx.halaqa.update({
        where: { id },
        data: { deletedAt: restore ? null : new Date(), isActive: restore },
      });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: restore ? "HALAQA_RESTORED" : "HALAQA_ARCHIVED",
          entityType: "Halaqa",
          entityId: id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
  async students(u: AuthenticatedUser, id: string) {
    await this.access(u, id);
    return this.p.halaqaMember.findMany({
      where: { halaqaId: id },
      include: {
        student: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                branchId: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  }
  async addStudent(
    u: AuthenticatedUser,
    id: string,
    studentId: string,
    c: AuthContext,
  ) {
    await this.access(u, id);
    if (!(await this.scopes.canAccessStudent(u, studentId)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    try {
      return await this.p.$transaction(
        async (tx) => {
          const m = await tx.halaqaMember.create({
            data: { halaqaId: id, studentId },
          });
          await this.audit.record(
            {
              ...c,
              actorUserId: u.id,
              action: "HALAQA_MEMBER_ADDED",
              entityType: "HalaqaMember",
              entityId: m.id,
              metadata: { halaqaId: id, studentId },
            },
            tx,
          );
          return m;
        },
        { isolationLevel: "Serializable" },
      );
    } catch (e) {
      return this.conflict(e);
    }
  }
  async removeStudent(
    u: AuthenticatedUser,
    id: string,
    studentId: string,
    c: AuthContext,
  ) {
    await this.access(u, id);
    return this.p.$transaction(async (tx) => {
      const m = await tx.halaqaMember.findFirst({
        where: { halaqaId: id, studentId, isActive: true, endedAt: null },
      });
      if (!m)
        throw new NotFoundException({
          code: "ACTIVE_MEMBERSHIP_NOT_FOUND",
          message: "Active membership not found",
        });
      const after = await tx.halaqaMember.update({
        where: { id: m.id },
        data: { isActive: false, endedAt: new Date(), status: "WITHDRAWN" },
      });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: "HALAQA_MEMBER_REMOVED",
          entityType: "HalaqaMember",
          entityId: m.id,
          before: m,
          after,
        },
        tx,
      );
      return after;
    });
  }
  async teachers(u: AuthenticatedUser, id: string) {
    await this.access(u, id);
    return this.p.halaqaTeacher.findMany({
      where: { halaqaId: id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                branchId: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  }
  async assignTeacher(
    u: AuthenticatedUser,
    id: string,
    teacherId: string,
    c: AuthContext,
  ) {
    await this.access(u, id);
    const [h, t] = await Promise.all([
      this.p.halaqa.findUnique({ where: { id } }),
      this.p.teacherProfile.findFirst({
        where: {
          id: teacherId,
          deletedAt: null,
          user: { forumId: u.forumId, deletedAt: null },
        },
        include: { user: true },
      }),
    ]);
    if (!h || !t || t.user.branchId !== h.branchId)
      throw new NotFoundException({
        code: "TEACHER_NOT_FOUND",
        message: "Teacher not found in halaqa branch",
      });
    try {
      return await this.p.$transaction(async (tx) => {
        const a = await tx.halaqaTeacher.create({
          data: { halaqaId: id, teacherId },
        });
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: "TEACHER_ASSIGNED",
            entityType: "HalaqaTeacher",
            entityId: a.id,
            metadata: { halaqaId: id, teacherId },
          },
          tx,
        );
        return a;
      });
    } catch (e) {
      return this.conflict(e);
    }
  }
  async endTeacher(
    u: AuthenticatedUser,
    id: string,
    teacherId: string,
    c: AuthContext,
  ) {
    await this.access(u, id);
    return this.endAssignment("teacher", u, id, teacherId, c);
  }
  async supervisors(u: AuthenticatedUser, id: string) {
    await this.access(u, id);
    return this.p.halaqaSupervisor.findMany({
      where: { halaqaId: id },
      include: {
        supervisor: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                username: true,
                branchId: true,
              },
            },
          },
        },
      },
      orderBy: { startedAt: "desc" },
    });
  }
  async assignSupervisor(
    u: AuthenticatedUser,
    id: string,
    supervisorId: string,
    c: AuthContext,
  ) {
    await this.access(u, id);
    const [h, s] = await Promise.all([
      this.p.halaqa.findUnique({ where: { id } }),
      this.p.supervisorProfile.findFirst({
        where: {
          id: supervisorId,
          deletedAt: null,
          user: { forumId: u.forumId, deletedAt: null },
        },
        include: { user: true },
      }),
    ]);
    if (!h || !s || s.user.branchId !== h.branchId)
      throw new NotFoundException({
        code: "SUPERVISOR_NOT_FOUND",
        message: "Supervisor not found in halaqa branch",
      });
    try {
      return await this.p.$transaction(async (tx) => {
        const a = await tx.halaqaSupervisor.create({
          data: { halaqaId: id, supervisorId },
        });
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: "SUPERVISOR_ASSIGNED",
            entityType: "HalaqaSupervisor",
            entityId: a.id,
            metadata: { halaqaId: id, supervisorId },
          },
          tx,
        );
        return a;
      });
    } catch (e) {
      return this.conflict(e);
    }
  }
  async endSupervisor(
    u: AuthenticatedUser,
    id: string,
    supervisorId: string,
    c: AuthContext,
  ) {
    await this.access(u, id);
    return this.endAssignment("supervisor", u, id, supervisorId, c);
  }
  private async endAssignment(
    kind: "teacher" | "supervisor",
    u: AuthenticatedUser,
    halaqaId: string,
    profileId: string,
    c: AuthContext,
  ) {
    return this.p.$transaction(async (tx) => {
      const delegate: any =
        kind === "teacher" ? tx.halaqaTeacher : tx.halaqaSupervisor;
      const key = kind === "teacher" ? "teacherId" : "supervisorId";
      const before = await delegate.findFirst({
        where: { halaqaId, [key]: profileId, isActive: true, endedAt: null },
      });
      if (!before)
        throw new NotFoundException({
          code: "ACTIVE_ASSIGNMENT_NOT_FOUND",
          message: "Active assignment not found",
        });
      const after = await delegate.update({
        where: { id: before.id },
        data: { isActive: false, endedAt: new Date() },
      });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action:
            kind === "teacher"
              ? "TEACHER_ASSIGNMENT_ENDED"
              : "SUPERVISOR_ASSIGNMENT_ENDED",
          entityType: kind === "teacher" ? "HalaqaTeacher" : "HalaqaSupervisor",
          entityId: before.id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
}
