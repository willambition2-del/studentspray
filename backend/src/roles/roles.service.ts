import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AuditService } from "../audit/audit.service";
import { AuthorizationService } from "../authorization/authorization.service";
import { pageArgs, paginated } from "../common/dto/pagination-query.dto";
import { PrismaService } from "../database/prisma.service";
import type {
  CreateRoleDto,
  RoleQueryDto,
  SetRolePermissionsDto,
  UpdateRoleDto,
} from "./dto/role.dto";
@Injectable()
export class RolesService {
  constructor(
    private readonly p: PrismaService,
    private readonly a: AuditService,
    private readonly z: AuthorizationService,
  ) {}
  private gm(u: AuthenticatedUser) {
    return this.z.hasRole(u, "GENERAL_MANAGER");
  }
  private async role(u: AuthenticatedUser, id: string) {
    const r = await this.p.role.findFirst({
      where: { id, forumId: u.forumId },
      include: {
        permissions: { include: { permission: true } },
        _count: { select: { users: true } },
      },
    });
    if (!r)
      throw new NotFoundException({
        code: "ROLE_NOT_FOUND",
        message: "Role not found",
      });
    return r;
  }
  private assertTarget(u: AuthenticatedUser, name: string) {
    if (!this.gm(u) && name === "GENERAL_MANAGER")
      throw new ForbiddenException({
        code: "ROLE_ESCALATION_DENIED",
        message: "General manager role is protected",
      });
  }
  async list(u: AuthenticatedUser, q: RoleQueryDto) {
    const where = {
      forumId: u.forumId,
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: "insensitive" as const } },
              {
                displayName: {
                  contains: q.search,
                  mode: "insensitive" as const,
                },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.p.$transaction([
      this.p.role.findMany({
        where,
        ...pageArgs(q),
        include: {
          permissions: { include: { permission: true } },
          _count: { select: { users: true } },
        },
        orderBy: { createdAt: "asc" },
      }),
      this.p.role.count({ where }),
    ]);
    return paginated(items, total, q);
  }
  get(u: AuthenticatedUser, id: string) {
    return this.role(u, id);
  }
  async create(u: AuthenticatedUser, d: CreateRoleDto, c: AuthContext) {
    try {
      return await this.p.$transaction(async (tx) => {
        const r = await tx.role.create({
          data: {
            forumId: u.forumId,
            name: d.name,
            displayName: d.displayName,
            description: d.description,
          },
        });
        await this.a.record(
          {
            ...c,
            actorUserId: u.id,
            action: "ROLE_CREATED",
            entityType: "Role",
            entityId: r.id,
            after: r,
          },
          tx,
        );
        return r;
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002")
        throw new ConflictException({
          code: "ROLE_ALREADY_EXISTS",
          message: "Role name already exists",
        });
      throw e;
    }
  }
  async update(
    u: AuthenticatedUser,
    id: string,
    d: UpdateRoleDto,
    c: AuthContext,
  ) {
    const before = await this.role(u, id);
    this.assertTarget(u, before.name);
    return this.p.$transaction(async (tx) => {
      const after = await tx.role.update({ where: { id }, data: d });
      await this.a.record(
        {
          ...c,
          actorUserId: u.id,
          action: "ROLE_UPDATED",
          entityType: "Role",
          entityId: id,
          before: {
            displayName: before.displayName,
            description: before.description,
            isActive: before.isActive,
          },
          after,
        },
        tx,
      );
      return after;
    });
  }
  async permissions(
    u: AuthenticatedUser,
    id: string,
    d: SetRolePermissionsDto,
    c: AuthContext,
  ) {
    const before = await this.role(u, id);
    this.assertTarget(u, before.name);
    const unique = [...new Set(d.permissionCodes)];
    const permissions = await this.p.permission.findMany({
      where: { code: { in: unique } },
    });
    if (permissions.length !== unique.length)
      throw new NotFoundException({
        code: "PERMISSION_NOT_FOUND",
        message: "One or more permissions do not exist",
      });
    if (!this.gm(u) && unique.some((code) => !u.permissions.includes(code)))
      throw new ForbiddenException({
        code: "ROLE_ESCALATION_DENIED",
        message: "Cannot grant permissions you do not hold",
      });
    return this.p.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });
      if (permissions.length)
        await tx.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: id,
            permissionId: permission.id,
          })),
        });
      await this.a.record(
        {
          ...c,
          actorUserId: u.id,
          action: "ROLE_PERMISSIONS_CHANGED",
          entityType: "Role",
          entityId: id,
          before: {
            permissionCodes: before.permissions.map((x) => x.permission.code),
          },
          after: { permissionCodes: unique },
        },
        tx,
      );
      return this.role(u, id);
    });
  }
}
