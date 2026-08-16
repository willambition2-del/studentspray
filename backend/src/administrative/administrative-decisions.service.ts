import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginationQueryDto, pageArgs, paginated } from '../common/dto/pagination-query.dto';
import {
  AdminDecisionStatus,
  AdminDecisionType,
  DecisionTargetType,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import {
  CreateAdminDecisionDto,
  UpdateAdminDecisionDto,
} from './dto/administrative.dto';

@Injectable()
export class AdministrativeDecisionsService {
  private readonly logger = new Logger(AdministrativeDecisionsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  // 1. Create Decision
  async create(user: AuthenticatedUser, dto: CreateAdminDecisionDto) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager) {
      throw new ForbiddenException('Only managers can issue administrative decisions');
    }

    const branchId = dto.branchId ?? (isExecutiveManager ? user.branchId : null);
    const initialStatus = dto.issueNow
      ? AdminDecisionStatus.ACTIVE
      : AdminDecisionStatus.DRAFT;

    const decisionNumber = await this.generateDecisionNumber(user.forumId);

    const decision = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adminDecision.create({
        data: {
          forumId: user.forumId,
          branchId,
          decisionNumber,
          title: dto.title.trim(),
          content: dto.content.trim(),
          type: dto.type,
          status: initialStatus,
          issuedById: user.id,
          issuedAt: new Date(),
          effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null,
          effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null,
          relatedRequestId: dto.relatedRequestId,
          audiences: {
            create: (dto.audiences && dto.audiences.length > 0)
              ? dto.audiences.map((aud) => ({
                  targetType: aud.targetType,
                  targetId: aud.targetId,
                }))
              : [{ targetType: DecisionTargetType.ALL_FORUM }],
          },
        },
        include: {
          issuedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
          audiences: true,
          relatedRequest: { select: { id: true, title: true, type: true } },
        },
      });

      return created;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: dto.issueNow ? 'ADMIN_DECISION_ISSUED' : 'ADMIN_DECISION_CREATED',
      entityType: 'AdminDecision',
      entityId: decision.id,
      after: {
        decisionNumber: decision.decisionNumber,
        title: decision.title,
        type: decision.type,
        status: decision.status,
      },
    });

    if (dto.issueNow) {
      this.notifyAudience(decision, user).catch(() => {});
    }

    return decision;
  }

  // 2. Find All Decisions (Role & Audience Scoped)
  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & {
      status?: AdminDecisionStatus;
      type?: AdminDecisionType;
      branchId?: string;
    },
  ) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    const where: Prisma.AdminDecisionWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (isExecutiveManager && user.branchId) {
      where.OR = [
        { branchId: user.branchId },
        { branchId: null },
      ];
    } else if (!isGeneralManager && !isExecutiveManager) {
      // Non-managers only see active/issued decisions targeted to them
      const userRoleIds = user.roles.map((r) => r.id);
      where.status = { in: [AdminDecisionStatus.ACTIVE, AdminDecisionStatus.ISSUED] };
      where.audiences = {
        some: {
          OR: [
            { targetType: DecisionTargetType.ALL_FORUM },
            ...(user.branchId ? [{ targetType: DecisionTargetType.BRANCH, targetId: user.branchId }] : []),
            { targetType: DecisionTargetType.ROLE, targetId: { in: userRoleIds } },
            { targetType: DecisionTargetType.USER, targetId: user.id },
          ],
        },
      };
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.branchId) where.branchId = query.branchId;

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { decisionNumber: { contains: query.search.trim(), mode: 'insensitive' } },
        { content: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.adminDecision.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ issuedAt: 'desc' }],
        include: {
          issuedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
          audiences: true,
          relatedRequest: { select: { id: true, title: true } },
          tasks: { select: { id: true, title: true, status: true } },
        },
      }),
      this.prisma.adminDecision.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  // 3. Find One Decision
  async findOne(user: AuthenticatedUser, id: string) {
    const decision = await this.prisma.adminDecision.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        issuedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
        audiences: true,
        relatedRequest: { select: { id: true, title: true, type: true, status: true } },
        tasks: {
          include: {
            assignedTo: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    });

    if (!decision) throw new NotFoundException('Administrative decision not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager) {
      if (
        decision.status !== AdminDecisionStatus.ACTIVE &&
        decision.status !== AdminDecisionStatus.ISSUED
      ) {
        throw new ForbiddenException('You do not have permission to view draft decisions');
      }
    }

    return decision;
  }

  // 4. Update Decision
  async update(user: AuthenticatedUser, id: string, dto: UpdateAdminDecisionDto) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager) {
      throw new ForbiddenException('Only managers can update decisions');
    }

    const decision = await this.prisma.adminDecision.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!decision) throw new NotFoundException('Decision not found');

    if (decision.status === AdminDecisionStatus.CANCELLED) {
      throw new BadRequestException('Cannot modify a cancelled decision');
    }

    const updated = await this.prisma.adminDecision.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.effectiveFrom !== undefined
          ? { effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : null }
          : {}),
        ...(dto.effectiveUntil !== undefined
          ? { effectiveUntil: dto.effectiveUntil ? new Date(dto.effectiveUntil) : null }
          : {}),
      },
      include: {
        issuedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
        audiences: true,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_DECISION_UPDATED',
      entityType: 'AdminDecision',
      entityId: updated.id,
      after: { title: updated.title, status: updated.status },
    });

    return updated;
  }

  // 5. Issue / Activate Decision
  async issue(user: AuthenticatedUser, id: string) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager) {
      throw new ForbiddenException('Only managers can issue decisions');
    }

    const decision = await this.prisma.adminDecision.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: { audiences: true },
    });
    if (!decision) throw new NotFoundException('Decision not found');

    if (decision.status === AdminDecisionStatus.ACTIVE) {
      throw new BadRequestException('Decision is already active and issued');
    }

    const issued = await this.prisma.adminDecision.update({
      where: { id },
      data: {
        status: AdminDecisionStatus.ACTIVE,
        issuedAt: new Date(),
      },
      include: {
        issuedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
        audiences: true,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_DECISION_ISSUED',
      entityType: 'AdminDecision',
      entityId: issued.id,
      after: { decisionNumber: issued.decisionNumber, status: issued.status },
    });

    this.notifyAudience(issued, user).catch(() => {});

    return issued;
  }

  // 6. Cancel Decision
  async cancel(user: AuthenticatedUser, id: string) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    if (!isGeneralManager) {
      throw new ForbiddenException('Only the General Manager can cancel official decisions');
    }

    const decision = await this.prisma.adminDecision.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!decision) throw new NotFoundException('Decision not found');

    const cancelled = await this.prisma.adminDecision.update({
      where: { id },
      data: {
        status: AdminDecisionStatus.CANCELLED,
      },
      include: {
        issuedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_DECISION_CANCELLED',
      entityType: 'AdminDecision',
      entityId: cancelled.id,
      after: { status: cancelled.status },
    });

    return cancelled;
  }

  // Helper: Sequential Decision Number Generator (DEC-YYYY-XXXX)
  private async generateDecisionNumber(forumId: string): Promise<string> {
    const currentYear = new Date().getFullYear();
    const prefix = `DEC-${currentYear}-`;

    const count = await this.prisma.adminDecision.count({
      where: {
        forumId,
        decisionNumber: { startsWith: prefix },
      },
    });

    const seq = String(count + 1).padStart(4, '0');
    return `${prefix}${seq}`;
  }

  // Helper: Audience Notification Dispatcher
  private async notifyAudience(decision: any, issuer: AuthenticatedUser) {
    try {
      const audiences = decision.audiences || [];
      const userIds = new Set<string>();

      for (const aud of audiences) {
        if (aud.targetType === DecisionTargetType.ALL_FORUM) {
          const allUsers = await this.prisma.user.findMany({
            where: { forumId: decision.forumId, isActive: true },
            select: { id: true },
          });
          allUsers.forEach((u) => userIds.add(u.id));
        } else if (aud.targetType === DecisionTargetType.BRANCH && aud.targetId) {
          const branchUsers = await this.prisma.user.findMany({
            where: { forumId: decision.forumId, branchId: aud.targetId, isActive: true },
            select: { id: true },
          });
          branchUsers.forEach((u) => userIds.add(u.id));
        } else if (aud.targetType === DecisionTargetType.ROLE && aud.targetId) {
          const roleUsers = await this.prisma.userRole.findMany({
            where: { roleId: aud.targetId, user: { forumId: decision.forumId, isActive: true } },
            select: { userId: true },
          });
          roleUsers.forEach((u) => userIds.add(u.userId));
        } else if (aud.targetType === DecisionTargetType.USER && aud.targetId) {
          userIds.add(aud.targetId);
        }
      }

      userIds.delete(issuer.id);

      if (userIds.size > 0) {
        await this.notifications.notifyUsers({
          userIds: Array.from(userIds),
          type: NotificationType.ADMIN_DECISION,
          title: `قرار إداري جديد: (${decision.decisionNumber})`,
          body: decision.title,
          data: {
            type: 'ADMIN_DECISION',
            decisionId: decision.id,
          },
        });
      }
    } catch {
      // Non-blocking
    }
  }
}
