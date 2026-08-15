/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AuditService } from "../audit/audit.service";
import { AccessScopeService } from "../authorization/access-scope.service";
import { pageArgs, paginated } from "../common/dto/pagination-query.dto";
import { PrismaService } from "../database/prisma.service";
import type {
  CreateStudentDto,
  UpdateStudentDto,
} from "../profiles/dto/profile.dto";
import { ProfilesService } from "../profiles/profiles.service";
import type { StudentQueryDto } from "./dto/student-query.dto";
@Injectable()
export class StudentsService {
  constructor(
    private readonly p: PrismaService,
    private readonly profiles: ProfilesService,
    private readonly scopes: AccessScopeService,
    private readonly audit: AuditService,
  ) {}
  create(u: AuthenticatedUser, d: CreateStudentDto, c: AuthContext) {
    return this.profiles.create(
      "student",
      u,
      d,
      {
        studentNumber: d.studentNumber,
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
        enrollmentDate: d.enrollmentDate
          ? new Date(d.enrollmentDate)
          : undefined,
      },
      c,
    );
  }
  async update(
    u: AuthenticatedUser,
    id: string,
    d: UpdateStudentDto,
    c: AuthContext,
  ) {
    if (!(await this.scopes.canAccessStudent(u, id)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    return this.profiles.update(
      "student",
      u,
      id,
      d,
      {
        studentNumber: d.studentNumber,
        dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth) : undefined,
        enrollmentDate: d.enrollmentDate
          ? new Date(d.enrollmentDate)
          : undefined,
      },
      c,
    );
  }
  async get(u: AuthenticatedUser, id: string) {
    if (!(await this.scopes.canAccessStudent(u, id)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    return this.p.studentProfile.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
            email: true,
            phone: true,
            branchId: true,
            isActive: true,
            branch: true,
          },
        },
        guardians: {
          include: {
            parent: {
              include: {
                user: {
                  select: { id: true, displayName: true, username: true },
                },
              },
            },
          },
        },
        halaqaMemberships: {
          orderBy: { startedAt: "desc" },
          include: { halaqa: true },
        },
      },
    });
  }
  async archive(u: AuthenticatedUser, id: string, r: boolean, c: AuthContext) {
    if (!r && !(await this.scopes.canAccessStudent(u, id)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    return this.profiles.archiveStudent(u, id, r, c);
  }
  async list(u: AuthenticatedUser, q: StudentQueryDto) {
    if (q.halaqaId && !(await this.scopes.canAccessHalaqa(u, q.halaqaId)))
      throw new ForbiddenException({
        code: "HALAQA_SCOPE_DENIED",
        message: "Halaqa is outside your access scope",
      });
    const branchIds = u.roles
      .map((r) => r.branchId)
      .filter((x): x is string => !!x);
    const isGm = u.roles.some((r) => r.name === "GENERAL_MANAGER");
    const where = {
      deletedAt: q.status === "archived" ? { not: null } : null,
      user: {
        forumId: u.forumId,
        ...(q.branchId
          ? { branchId: q.branchId }
          : !isGm && branchIds.length
            ? { branchId: { in: branchIds } }
            : {}),
        ...(q.search
          ? {
              OR: [
                {
                  displayName: {
                    contains: q.search,
                    mode: "insensitive" as const,
                  },
                },
                {
                  username: {
                    contains: q.search,
                    mode: "insensitive" as const,
                  },
                },
              ],
            }
          : {}),
      },
      ...(q.halaqaId
        ? {
            halaqaMemberships: {
              some: { halaqaId: q.halaqaId, isActive: true, endedAt: null },
            },
          }
        : u.roles.some((r) => r.name === "TEACHER")
          ? {
              halaqaMemberships: {
                some: {
                  isActive: true,
                  endedAt: null,
                  halaqa: {
                    teachers: {
                      some: {
                        isActive: true,
                        endedAt: null,
                        teacher: { userId: u.id },
                      },
                    },
                  },
                },
              },
            }
          : u.roles.some((r) => r.name === "PARENT")
            ? { guardians: { some: { parent: { userId: u.id } } } }
            : u.roles.some((r) => r.name === "STUDENT")
              ? { userId: u.id }
              : {}),
    };
    const [items, total] = await this.p.$transaction([
      this.p.studentProfile.findMany({
        where,
        ...pageArgs(q),
        include: {
          user: {
            select: {
              id: true,
              username: true,
              displayName: true,
              branchId: true,
              isActive: true,
              branch: true,
            },
          },
          halaqaMemberships: {
            where: { isActive: true, endedAt: null },
            include: { halaqa: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.p.studentProfile.count({ where }),
    ]);
    return paginated(items, total, q);
  }
  async transfer(
    u: AuthenticatedUser,
    id: string,
    halaqaId: string,
    c: AuthContext,
  ) {
    if (
      !(await this.scopes.canAccessStudent(u, id)) ||
      !(await this.scopes.canAccessHalaqa(u, halaqaId))
    )
      throw new ForbiddenException({
        code: "TRANSFER_SCOPE_DENIED",
        message: "Student or halaqa is outside your access scope",
      });
    const h = await this.p.halaqa.findFirst({
      where: {
        id: halaqaId,
        forumId: u.forumId,
        isActive: true,
        deletedAt: null,
      },
    });
    if (!h)
      throw new NotFoundException({
        code: "HALAQA_NOT_FOUND",
        message: "Halaqa not found",
      });
    return this.p.$transaction(
      async (tx) => {
        const old = await tx.halaqaMember.findFirst({
          where: { studentId: id, isActive: true, endedAt: null },
        });
        if (old?.halaqaId === halaqaId) return old;
        if (old)
          await tx.halaqaMember.update({
            where: { id: old.id },
            data: { isActive: false, endedAt: new Date(), status: "WITHDRAWN" },
          });
        const next = await tx.halaqaMember.create({
          data: { studentId: id, halaqaId },
        });
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: "STUDENT_TRANSFERRED",
            entityType: "StudentProfile",
            entityId: id,
            metadata: {
              fromHalaqaId: old?.halaqaId ?? null,
              toHalaqaId: halaqaId,
            },
          },
          tx,
        );
        return next;
      },
      { isolationLevel: "Serializable" },
    );
  }
}
