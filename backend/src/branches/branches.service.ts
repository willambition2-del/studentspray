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
  BranchQueryDto,
  CreateBranchDto,
  UpdateBranchDto,
} from "./dto/branch.dto";

@Injectable()
export class BranchesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopes: AccessScopeService,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditService,
  ) {}
  private where(user: AuthenticatedUser, archived = false) {
    const scoped = this.authz.scopedBranches(user);
    return {
      forumId: user.forumId,
      deletedAt: archived ? { not: null } : null,
      ...(this.authz.hasRole(user, "GENERAL_MANAGER") || scoped.length === 0
        ? {}
        : { id: { in: scoped } }),
    };
  }
  async list(user: AuthenticatedUser, query: BranchQueryDto) {
    const where = {
      ...this.where(user, query.archived),
      ...(query.search
        ? {
            OR: [
              {
                name: { contains: query.search, mode: "insensitive" as const },
              },
              {
                code: { contains: query.search, mode: "insensitive" as const },
              },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.branch.findMany({
        where,
        ...pageArgs(query),
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.branch.count({ where }),
    ]);
    return paginated(items, total, query);
  }
  async get(user: AuthenticatedUser, id: string) {
    if (!(await this.scopes.canAccessBranch(user, id)))
      throw new NotFoundException({
        code: "BRANCH_NOT_FOUND",
        message: "Branch not found",
      });
    return this.prisma.branch.findFirstOrThrow({
      where: { id, forumId: user.forumId },
    });
  }
  async create(
    user: AuthenticatedUser,
    dto: CreateBranchDto,
    context: AuthContext,
  ) {
    if (!this.authz.hasRole(user, "GENERAL_MANAGER"))
      throw new ForbiddenException({
        code: "BRANCH_CREATE_FORBIDDEN",
        message: "Only a general manager can create branches",
      });
    try {
      return await this.prisma.$transaction(async (tx) => {
        const after = await tx.branch.create({
          data: {
            forumId: user.forumId,
            name: dto.name,
            code: dto.code.toUpperCase(),
          },
        });
        await this.audit.record(
          {
            ...context,
            actorUserId: user.id,
            action: "BRANCH_CREATED",
            entityType: "Branch",
            entityId: after.id,
            after,
          },
          tx,
        );
        return after;
      });
    } catch (error) {
      if ((error as { code?: string }).code === "P2002")
        throw new ConflictException({
          code: "BRANCH_CODE_ALREADY_EXISTS",
          message: "Branch code already exists",
        });
      throw error;
    }
  }
  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateBranchDto,
    context: AuthContext,
  ) {
    if (!(await this.scopes.canAccessBranch(user, id)))
      throw new NotFoundException({
        code: "BRANCH_NOT_FOUND",
        message: "Branch not found",
      });
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.branch.findUniqueOrThrow({ where: { id } });
      const after = await tx.branch.update({
        where: { id },
        data: { ...dto, code: dto.code?.toUpperCase() },
      });
      await this.audit.record(
        {
          ...context,
          actorUserId: user.id,
          action: "BRANCH_UPDATED",
          entityType: "Branch",
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
    user: AuthenticatedUser,
    id: string,
    restore: boolean,
    context: AuthContext,
  ) {
    const canRestore = restore && Boolean(await this.prisma.branch.findFirst({
      where: { id, ...this.where(user, true) },
      select: { id: true },
    }));
    if (!canRestore && !(await this.scopes.canAccessBranch(user, id)))
      throw new NotFoundException({
        code: "BRANCH_NOT_FOUND",
        message: "Branch not found",
      });
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.branch.findUniqueOrThrow({ where: { id } });
      const after = await tx.branch.update({
        where: { id },
        data: { deletedAt: restore ? null : new Date(), isActive: restore },
      });
      await this.audit.record(
        {
          ...context,
          actorUserId: user.id,
          action: restore ? "BRANCH_RESTORED" : "BRANCH_ARCHIVED",
          entityType: "Branch",
          entityId: id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
}
