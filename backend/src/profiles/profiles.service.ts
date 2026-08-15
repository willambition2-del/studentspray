/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import {
  normalizeEmail,
  normalizePhone,
  normalizeUsername,
} from "../auth/utils/identifier";
import { PasswordService } from "../auth/password.service";
import { AuditService } from "../audit/audit.service";
import { AccessScopeService } from "../authorization/access-scope.service";
import { AuthorizationService } from "../authorization/authorization.service";
import { pageArgs, paginated } from "../common/dto/pagination-query.dto";
import { PrismaService } from "../database/prisma.service";
import type {
  CreateProfileAccountDto,
  ProfileQueryDto,
  UpdateProfileAccountDto,
} from "./dto/profile.dto";
export type ProfileKind = "student" | "parent" | "teacher" | "supervisor";
const roleName: Record<ProfileKind, string> = {
  student: "STUDENT",
  parent: "PARENT",
  teacher: "TEACHER",
  supervisor: "TECHNICAL_SUPERVISOR",
};
const modelKey: Record<ProfileKind, string> = {
  student: "studentProfile",
  parent: "parentProfile",
  teacher: "teacherProfile",
  supervisor: "supervisorProfile",
};
@Injectable()
export class ProfilesService {
  constructor(
    private readonly p: PrismaService,
    private readonly pw: PasswordService,
    private readonly scopes: AccessScopeService,
    private readonly z: AuthorizationService,
    private readonly audit: AuditService,
  ) {}
  private async branch(u: AuthenticatedUser, id: string) {
    if (!(await this.scopes.canAccessBranch(u, id)))
      throw new ForbiddenException({
        code: "BRANCH_SCOPE_DENIED",
        message: "Branch is outside your access scope",
      });
  }
  private scopedBranch(u: AuthenticatedUser) {
    const ids = this.z.scopedBranches(u);
    return this.z.hasRole(u, "GENERAL_MANAGER") || ids.length === 0
      ? {}
      : { branchId: { in: ids } };
  }
  private delegate(k: ProfileKind, client: any = this.p): any {
    return client[modelKey[k]];
  }
  private safeAccount(d: CreateProfileAccountDto | UpdateProfileAccountDto) {
    return {
      displayName: d.displayName?.trim(),
      email: d.email?.trim(),
      emailNormalized: d.email ? normalizeEmail(d.email) : undefined,
      phone: d.phone?.trim(),
      phoneNormalized: d.phone ? normalizePhone(d.phone) : undefined,
      branchId: d.branchId,
    };
  }
  async list(k: ProfileKind, u: AuthenticatedUser, q: ProfileQueryDto) {
    if (q.branchId) await this.branch(u, q.branchId);
    const where = {
      deletedAt: null,
      user: {
        forumId: u.forumId,
        deletedAt: null,
        ...this.scopedBranch(u),
        ...(q.branchId ? { branchId: q.branchId } : {}),
        ...(q.search
          ? {
              OR: [
                { displayName: { contains: q.search, mode: "insensitive" } },
                { username: { contains: q.search, mode: "insensitive" } },
              ],
            }
          : {}),
      },
    };
    const d = this.delegate(k);
    const [items, total] = await this.p.$transaction([
      d.findMany({
        where,
        ...pageArgs(q),
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
        },
        orderBy: { createdAt: "desc" },
      }),
      d.count({ where }),
    ]);
    return paginated(items, total, q);
  }
  async get(k: ProfileKind, u: AuthenticatedUser, id: string) {
    const item = await this.delegate(k).findFirst({
      where: {
        id,
        deletedAt: null,
        user: { forumId: u.forumId, deletedAt: null, ...this.scopedBranch(u) },
      },
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
        ...(k === "parent"
          ? {
              students: {
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
              },
            }
          : {}),
      },
    });
    if (!item)
      throw new NotFoundException({
        code: `${k.toUpperCase()}_NOT_FOUND`,
        message: `${k} not found`,
      });
    return item;
  }
  async create(
    k: ProfileKind,
    u: AuthenticatedUser,
    d: CreateProfileAccountDto,
    profileData: Record<string, unknown>,
    c: AuthContext,
  ) {
    await this.branch(u, d.branchId);
    const role = await this.p.role.findFirst({
      where: { forumId: u.forumId, name: roleName[k], isActive: true },
    });
    if (!role)
      throw new NotFoundException({
        code: "SYSTEM_ROLE_NOT_FOUND",
        message: `${roleName[k]} role not found`,
      });
    const hash = await this.pw.hashPassword(d.temporaryPassword);
    try {
      return await this.p.$transaction(async (tx) => {
        const account = await tx.user.create({
          data: {
            forumId: u.forumId,
            username: d.username.trim(),
            usernameNormalized: normalizeUsername(d.username),
            ...this.safeAccount(d),
            passwordHash: hash,
            passwordChangedAt: new Date(),
            mustChangePassword: true,
            roles: { create: { roleId: role.id, branchId: d.branchId } },
          },
        });
        const profile = await this.delegate(k, tx).create({
          data: { userId: account.id, ...profileData },
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
              },
            },
          },
        });
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: "USER_CREATED",
            entityType: "User",
            entityId: account.id,
            after: {
              username: account.username,
              displayName: account.displayName,
              branchId: account.branchId,
              role: role.name,
            },
          },
          tx,
        );
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: `${k.toUpperCase()}_CREATED`,
            entityType: `${k[0].toUpperCase() + k.slice(1)}Profile`,
            entityId: profile.id,
            after: profile,
          },
          tx,
        );
        return profile;
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002")
        throw new ConflictException({
          code: "PROFILE_IDENTIFIER_ALREADY_EXISTS",
          message: "Account identifier or profile number already exists",
        });
      throw e;
    }
  }
  async update(
    k: ProfileKind,
    u: AuthenticatedUser,
    id: string,
    d: UpdateProfileAccountDto,
    profileData: Record<string, unknown>,
    c: AuthContext,
  ) {
    const before = await this.get(k, u, id);
    if (d.branchId) await this.branch(u, d.branchId);
    return this.p.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: before.user.id },
        data: this.safeAccount(d),
      });
      const after = await this.delegate(k, tx).update({
        where: { id },
        data: profileData,
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
            },
          },
        },
      });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: `${k.toUpperCase()}_UPDATED`,
          entityType: `${k[0].toUpperCase() + k.slice(1)}Profile`,
          entityId: id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
  async archiveStudent(
    u: AuthenticatedUser,
    id: string,
    restore: boolean,
    c: AuthContext,
  ) {
    const before = restore
      ? await this.p.studentProfile.findFirst({
          where: {
            id,
            deletedAt: { not: null },
            user: { forumId: u.forumId, ...this.scopedBranch(u) },
          },
          include: { user: true },
        })
      : await this.get("student", u, id);
    if (!before)
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    return this.p.$transaction(async (tx) => {
      const after = await tx.studentProfile.update({
        where: { id },
        data: { deletedAt: restore ? null : new Date() },
      });
      await tx.user.update({
        where: { id: before.user.id },
        data: { isActive: restore, deletedAt: restore ? null : new Date() },
      });
      if (!restore)
        await tx.authSession.updateMany({
          where: { userId: before.user.id, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: "ACCOUNT_DISABLED" },
        });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: restore ? "STUDENT_RESTORED" : "STUDENT_ARCHIVED",
          entityType: "StudentProfile",
          entityId: id,
        },
        tx,
      );
      return after;
    });
  }
}
