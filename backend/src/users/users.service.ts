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
import { Prisma } from "../generated/prisma/client";
import { ProfileType } from "./dto/user.dto";
import type {
  AssignUserRoleDto,
  CreateUserDto,
  UpdateUserDto,
  UserQueryDto,
} from "./dto/user.dto";

const publicSelect = {
  id: true,
  forumId: true,
  branchId: true,
  username: true,
  displayName: true,
  email: true,
  phone: true,
  isActive: true,
  mustChangePassword: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  branch: { select: { id: true, name: true, code: true } },
  roles: {
    where: {
      isActive: true,
      OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }],
    },
    include: { role: { select: { id: true, name: true, displayName: true } } },
  },
  studentProfile: true,
  parentProfile: true,
  teacherProfile: true,
  supervisorProfile: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly scopes: AccessScopeService,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditService,
  ) {}
  private isGm(user: AuthenticatedUser) {
    return this.authz.hasRole(user, "GENERAL_MANAGER");
  }
  private scopedWhere(user: AuthenticatedUser) {
    const ids = this.authz.scopedBranches(user);
    return {
      forumId: user.forumId,
      ...(this.isGm(user) || ids.length === 0 ? {} : { branchId: { in: ids } }),
    };
  }
  private async assertBranch(
    user: AuthenticatedUser,
    branchId?: string | null,
  ) {
    if (branchId && !(await this.scopes.canAccessBranch(user, branchId)))
      throw new ForbiddenException({
        code: "BRANCH_SCOPE_DENIED",
        message: "Branch is outside your access scope",
      });
  }
  private async roleForAssignment(user: AuthenticatedUser, roleId: string) {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, forumId: user.forumId, isActive: true },
      include: { permissions: { include: { permission: true } } },
    });
    if (!role)
      throw new NotFoundException({
        code: "ROLE_NOT_FOUND",
        message: "Role not found",
      });
    if (
      !this.isGm(user) &&
      (role.name === "GENERAL_MANAGER" ||
        role.permissions.some(
          (p) => !user.permissions.includes(p.permission.code),
        ))
    )
      throw new ForbiddenException({
        code: "ROLE_ESCALATION_DENIED",
        message: "Cannot assign a role above your privileges",
      });
    return role;
  }
  private conflict(error: unknown): never {
    if ((error as { code?: string }).code === "P2002")
      throw new ConflictException({
        code: "USER_IDENTIFIER_ALREADY_EXISTS",
        message: "Username, email, or phone already exists",
      });
    throw error;
  }
  async list(user: AuthenticatedUser, q: UserQueryDto) {
    await this.assertBranch(user, q.branchId);
    const where = {
      ...this.scopedWhere(user),
      ...(q.branchId ? { branchId: q.branchId } : {}),
      ...(q.status === "archived"
        ? { deletedAt: { not: null } }
        : q.status === "suspended"
          ? { isActive: false, deletedAt: null }
          : { isActive: true, deletedAt: null }),
      ...(q.search
        ? {
            OR: [
              {
                username: { contains: q.search, mode: "insensitive" as const },
              },
              {
                displayName: {
                  contains: q.search,
                  mode: "insensitive" as const,
                },
              },
              { email: { contains: q.search, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        ...pageArgs(q),
        select: publicSelect,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where }),
    ]);
    return paginated(items, total, q);
  }
  async get(user: AuthenticatedUser, id: string) {
    const account = await this.prisma.user.findFirst({
      where: { id, ...this.scopedWhere(user) },
      select: publicSelect,
    });
    if (!account)
      throw new NotFoundException({
        code: "USER_NOT_FOUND",
        message: "User not found",
      });
    return account;
  }
  async create(
    user: AuthenticatedUser,
    dto: CreateUserDto,
    context: AuthContext,
  ) {
    await this.assertBranch(user, dto.branchId);
    const role = await this.roleForAssignment(user, dto.roleId);
    const passwordHash = await this.passwords.hashPassword(
      dto.temporaryPassword,
    );
    try {
      return await this.prisma.$transaction(async (tx) => {
        const account = await tx.user.create({
          data: {
            forumId: user.forumId,
            branchId: dto.branchId,
            username: dto.username.trim(),
            usernameNormalized: normalizeUsername(dto.username),
            displayName: dto.displayName.trim(),
            email: dto.email?.trim(),
            emailNormalized: dto.email ? normalizeEmail(dto.email) : undefined,
            phone: dto.phone?.trim(),
            phoneNormalized: dto.phone ? normalizePhone(dto.phone) : undefined,
            passwordHash,
            passwordChangedAt: new Date(),
            mustChangePassword: true,
            roles: { create: { roleId: role.id, branchId: dto.branchId } },
            ...(dto.profileType === ProfileType.STUDENT
              ? { studentProfile: { create: {} } }
              : dto.profileType === ProfileType.PARENT
                ? { parentProfile: { create: {} } }
                : dto.profileType === ProfileType.TEACHER
                  ? { teacherProfile: { create: {} } }
                  : dto.profileType === ProfileType.TECHNICAL_SUPERVISOR
                    ? { supervisorProfile: { create: {} } }
                    : {}),
          },
          select: publicSelect,
        });
        await this.audit.record(
          {
            ...context,
            actorUserId: user.id,
            action: "USER_CREATED",
            entityType: "User",
            entityId: account.id,
            after: {
              id: account.id,
              username: account.username,
              displayName: account.displayName,
              branchId: account.branchId,
              role: role.name,
            },
          },
          tx,
        );
        return account;
      });
    } catch (e) {
      return this.conflict(e);
    }
  }
  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateUserDto,
    context: AuthContext,
  ) {
    const before = await this.get(user, id);
    if (
      !this.isGm(user) &&
      before.roles.some((r) => r.role.name === "GENERAL_MANAGER")
    )
      throw new ForbiddenException({
        code: "GENERAL_MANAGER_PROTECTED",
        message: "General manager account is protected",
      });
    await this.assertBranch(user, dto.branchId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        const after = await tx.user.update({
          where: { id },
          data: {
            ...dto,
            usernameNormalized: dto.username
              ? normalizeUsername(dto.username)
              : undefined,
            emailNormalized: dto.email ? normalizeEmail(dto.email) : undefined,
            phoneNormalized: dto.phone ? normalizePhone(dto.phone) : undefined,
          },
          select: publicSelect,
        });
        await this.audit.record(
          {
            ...context,
            actorUserId: user.id,
            action: "USER_UPDATED",
            entityType: "User",
            entityId: id,
            before: {
              username: before.username,
              displayName: before.displayName,
              branchId: before.branchId,
            },
            after: {
              username: after.username,
              displayName: after.displayName,
              branchId: after.branchId,
            },
          },
          tx,
        );
        return after;
      });
    } catch (e) {
      return this.conflict(e);
    }
  }
  async assignRole(
    user: AuthenticatedUser,
    id: string,
    dto: AssignUserRoleDto,
    context: AuthContext,
  ) {
    const target = await this.get(user, id);
    if (
      !this.isGm(user) &&
      target.roles.some((r) => r.role.name === "GENERAL_MANAGER")
    )
      throw new ForbiddenException({
        code: "GENERAL_MANAGER_PROTECTED",
        message: "General manager account is protected",
      });
    await this.assertBranch(user, dto.branchId ?? target.branchId);
    const role = await this.roleForAssignment(user, dto.roleId);
    return this.prisma.$transaction(async (tx) => {
      await tx.userRole.updateMany({
        where: { userId: id, isActive: true },
        data: { isActive: false, endsAt: new Date() },
      });
      const assigned = await tx.userRole.create({
        data: {
          userId: id,
          roleId: role.id,
          branchId: dto.branchId ?? target.branchId,
        },
      });
      await this.audit.record(
        {
          ...context,
          actorUserId: user.id,
          action: "USER_ROLE_ASSIGNED",
          entityType: "User",
          entityId: id,
          metadata: { roleId: role.id, roleName: role.name },
        },
        tx,
      );
      return assigned;
    });
  }
  async setActive(
    user: AuthenticatedUser,
    id: string,
    active: boolean,
    context: AuthContext,
  ) {
    const target = await this.get(user, id);
    if (
      !this.isGm(user) &&
      target.roles.some((r) => r.role.name === "GENERAL_MANAGER")
    )
      throw new ForbiddenException({
        code: "GENERAL_MANAGER_PROTECTED",
        message: "General manager account is protected",
      });
    return this.prisma.$transaction(async (tx) => {
      const after = await tx.user.update({
        where: { id },
        data: { isActive: active },
      });
      if (!active)
        await tx.authSession.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date(), revokedReason: "ACCOUNT_DISABLED" },
        });
      await this.audit.record(
        {
          ...context,
          actorUserId: user.id,
          action: active ? "USER_ACTIVATED" : "USER_SUSPENDED",
          entityType: "User",
          entityId: id,
          before: { isActive: target.isActive },
          after: { isActive: after.isActive },
        },
        tx,
      );
      return { id: after.id, isActive: after.isActive };
    });
  }
  async forcePasswordChange(
    user: AuthenticatedUser,
    id: string,
    context: AuthContext,
  ) {
    await this.get(user, id);
    await this.prisma.user.update({
      where: { id },
      data: { mustChangePassword: true },
    });
    await this.audit.record({
      ...context,
      actorUserId: user.id,
      action: "USER_PASSWORD_CHANGE_FORCED",
      entityType: "User",
      entityId: id,
    });
    return { id, mustChangePassword: true };
  }
  async revokeSessions(
    user: AuthenticatedUser,
    id: string,
    context: AuthContext,
  ) {
    await this.get(user, id);
    const result = await this.prisma.authSession.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: "LOGOUT_ALL" },
    });
    await this.audit.record({
      ...context,
      actorUserId: user.id,
      action: "USER_SESSIONS_REVOKED",
      entityType: "User",
      entityId: id,
      metadata: { count: result.count },
    });
    return { revokedSessions: result.count };
  }
}
