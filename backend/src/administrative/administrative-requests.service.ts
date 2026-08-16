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
  AdminPriority,
  AdminRequestStatus,
  AdminRequestType,
  ApprovalActionType,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import {
  CreateAdminRequestDto,
  ReviewAdminRequestDto,
  UpdateAdminRequestDto,
} from './dto/administrative.dto';

@Injectable()
export class AdministrativeRequestsService {
  private readonly logger = new Logger(AdministrativeRequestsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  // 1. Create Administrative Request
  async create(user: AuthenticatedUser, dto: CreateAdminRequestDto) {
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );

    const branchId = dto.branchId ?? user.branchId ?? null;
    const initialStatus = dto.submitNow
      ? AdminRequestStatus.SUBMITTED
      : AdminRequestStatus.DRAFT;

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.administrativeRequest.create({
        data: {
          forumId: user.forumId,
          branchId,
          type: dto.type,
          title: dto.title.trim(),
          description: dto.description.trim(),
          requestedById: user.id,
          relatedEntityType: dto.relatedEntityType,
          relatedEntityId: dto.relatedEntityId,
          status: initialStatus,
          priority: dto.priority ?? AdminPriority.NORMAL,
          submittedAt: dto.submitNow ? new Date() : null,
        },
        include: {
          requestedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      if (dto.submitNow) {
        await tx.approvalAction.create({
          data: {
            requestId: created.id,
            actorId: user.id,
            action: ApprovalActionType.SUBMITTED,
            comment: 'تم تقديم الطلب للاعتماد',
          },
        });
      }

      return created;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: dto.submitNow ? 'ADMIN_REQUEST_SUBMITTED' : 'ADMIN_REQUEST_CREATED',
      entityType: 'AdministrativeRequest',
      entityId: request.id,
      after: {
        title: request.title,
        type: request.type,
        status: request.status,
      },
    });

    if (dto.submitNow) {
      this.notifyApprovers(request, user).catch(() => {});
    }

    return request;
  }

  // 2. Find All Requests (Scoped)
  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & {
      status?: AdminRequestStatus;
      type?: AdminRequestType;
      priority?: AdminPriority;
      branchId?: string;
      myOnly?: boolean;
    },
  ) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    const where: Prisma.AdministrativeRequestWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    // Role-based visibility
    if (query.myOnly || (!isGeneralManager && !isExecutiveManager && !isSupervisor)) {
      where.requestedById = user.id;
    } else if (isExecutiveManager && user.branchId) {
      where.OR = [
        { branchId: user.branchId },
        { branchId: null },
        { requestedById: user.id },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;
    if (query.branchId) where.branchId = query.branchId;

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.administrativeRequest.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
        include: {
          requestedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
          approvalActions: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              actor: { select: { id: true, displayName: true, username: true } },
            },
          },
        },
      }),
      this.prisma.administrativeRequest.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  // 3. Find One Request
  async findOne(user: AuthenticatedUser, id: string) {
    const request = await this.prisma.administrativeRequest.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        requestedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
        approvalActions: {
          orderBy: { createdAt: 'asc' },
          include: {
            actor: { select: { id: true, displayName: true, username: true } },
          },
        },
        decisions: {
          select: { id: true, decisionNumber: true, title: true, status: true },
        },
        tasks: {
          select: { id: true, title: true, status: true, assignedTo: { select: { displayName: true } } },
        },
      },
    });

    if (!request) throw new NotFoundException('Administrative request not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    // Access authorization check
    if (
      !isGeneralManager &&
      !isExecutiveManager &&
      !isSupervisor &&
      request.requestedById !== user.id
    ) {
      throw new ForbiddenException('You do not have permission to view this request');
    }

    if (
      isExecutiveManager &&
      user.branchId &&
      request.branchId &&
      request.branchId !== user.branchId &&
      request.requestedById !== user.id
    ) {
      throw new ForbiddenException('Access denied outside your branch scope');
    }

    return request;
  }

  // 4. Update Request (Draft only)
  async update(user: AuthenticatedUser, id: string, dto: UpdateAdminRequestDto) {
    const request = await this.prisma.administrativeRequest.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });

    if (!request) throw new NotFoundException('Administrative request not found');

    if (request.requestedById !== user.id) {
      throw new ForbiddenException('Only the requester can modify this request');
    }

    if (request.status !== AdminRequestStatus.DRAFT) {
      throw new BadRequestException('Only draft requests can be edited');
    }

    const updated = await this.prisma.administrativeRequest.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
        ...(dto.description !== undefined ? { description: dto.description.trim() } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      },
      include: {
        requestedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_REQUEST_UPDATED',
      entityType: 'AdministrativeRequest',
      entityId: updated.id,
      after: { title: updated.title, priority: updated.priority },
    });

    return updated;
  }

  // 5. Submit Draft Request
  async submit(user: AuthenticatedUser, id: string) {
    const request = await this.prisma.administrativeRequest.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });

    if (!request) throw new NotFoundException('Administrative request not found');

    if (request.requestedById !== user.id) {
      throw new ForbiddenException('Only the requester can submit this request');
    }

    if (request.status !== AdminRequestStatus.DRAFT) {
      throw new BadRequestException('Request is already submitted or processed');
    }

    const submitted = await this.prisma.$transaction(async (tx) => {
      const res = await tx.administrativeRequest.update({
        where: { id },
        data: {
          status: AdminRequestStatus.SUBMITTED,
          submittedAt: new Date(),
        },
        include: {
          requestedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      await tx.approvalAction.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: ApprovalActionType.SUBMITTED,
          comment: 'تم تقديم الطلب للاعتماد والمراجعة',
        },
      });

      return res;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_REQUEST_SUBMITTED',
      entityType: 'AdministrativeRequest',
      entityId: submitted.id,
      after: { status: submitted.status, submittedAt: submitted.submittedAt },
    });

    this.notifyApprovers(submitted, user).catch(() => {});

    return submitted;
  }

  // 6. Review Request (Approve / Reject / Return) — Concurrency Protected & No Self-Approval
  async review(user: AuthenticatedUser, id: string, dto: ReviewAdminRequestDto) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager) {
      throw new ForbiddenException('Only authorized managers can review requests');
    }

    const reviewed = await this.prisma.$transaction(async (tx) => {
      const request = await tx.administrativeRequest.findFirst({
        where: { id, forumId: user.forumId, deletedAt: null },
      });

      if (!request) throw new NotFoundException('Administrative request not found');

      // Check current state (concurrency safeguard)
      if (
        request.status !== AdminRequestStatus.SUBMITTED &&
        request.status !== AdminRequestStatus.UNDER_REVIEW
      ) {
        throw new BadRequestException(
          `Cannot review request in current status (${request.status}). It may have already been resolved.`,
        );
      }

      // Self-approval rule: requester cannot approve own request (unless GENERAL_MANAGER)
      if (request.requestedById === user.id && dto.action === 'APPROVED' && !isGeneralManager) {
        throw new ForbiddenException('Self-approval is not permitted for your role');
      }

      // Branch scope check for Executive Manager
      if (
        isExecutiveManager &&
        user.branchId &&
        request.branchId &&
        request.branchId !== user.branchId
      ) {
        throw new ForbiddenException('Cannot review requests outside your assigned branch');
      }

      let newStatus: AdminRequestStatus;
      let actionType: ApprovalActionType;

      switch (dto.action) {
        case 'APPROVED':
          newStatus = AdminRequestStatus.APPROVED;
          actionType = ApprovalActionType.APPROVED;
          break;
        case 'REJECTED':
          newStatus = AdminRequestStatus.REJECTED;
          actionType = ApprovalActionType.REJECTED;
          break;
        case 'RETURNED':
          newStatus = AdminRequestStatus.DRAFT;
          actionType = ApprovalActionType.RETURNED;
          break;
        default:
          throw new BadRequestException('Invalid review action');
      }

      const updated = await tx.administrativeRequest.update({
        where: { id },
        data: {
          status: newStatus,
          resolvedAt: newStatus !== AdminRequestStatus.DRAFT ? new Date() : null,
        },
        include: {
          requestedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      await tx.approvalAction.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: actionType,
          comment: dto.comment?.trim() || null,
        },
      });

      return updated;
    });

    const auditAction =
      dto.action === 'APPROVED'
        ? 'ADMIN_REQUEST_APPROVED'
        : dto.action === 'REJECTED'
          ? 'ADMIN_REQUEST_REJECTED'
          : 'ADMIN_REQUEST_RETURNED';

    await this.audit.record({
      actorUserId: user.id,
      action: auditAction,
      entityType: 'AdministrativeRequest',
      entityId: reviewed.id,
      after: { status: reviewed.status, action: dto.action, comment: dto.comment },
    });

    // Notify requester of decision
    this.notifyRequester(reviewed, user, dto.action, dto.comment).catch(() => {});

    return reviewed;
  }

  // 7. Cancel Request
  async cancel(user: AuthenticatedUser, id: string) {
    const request = await this.prisma.administrativeRequest.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });

    if (!request) throw new NotFoundException('Administrative request not found');

    if (request.requestedById !== user.id) {
      throw new ForbiddenException('Only the requester can cancel this request');
    }

    if (
      request.status === AdminRequestStatus.APPROVED ||
      request.status === AdminRequestStatus.REJECTED
    ) {
      throw new BadRequestException('Cannot cancel an already resolved request');
    }

    const cancelled = await this.prisma.$transaction(async (tx) => {
      const res = await tx.administrativeRequest.update({
        where: { id },
        data: {
          status: AdminRequestStatus.CANCELLED,
          resolvedAt: new Date(),
        },
        include: {
          requestedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
        },
      });

      await tx.approvalAction.create({
        data: {
          requestId: id,
          actorId: user.id,
          action: ApprovalActionType.CANCELLED,
          comment: 'تم إلغاء الطلب من قبل مقدمه',
        },
      });

      return res;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_REQUEST_CANCELLED',
      entityType: 'AdministrativeRequest',
      entityId: cancelled.id,
      after: { status: cancelled.status },
    });

    return cancelled;
  }

  // Helpers: Notification dispatching
  private async notifyApprovers(request: any, sender: AuthenticatedUser) {
    try {
      const managers = await this.prisma.user.findMany({
        where: {
          forumId: request.forumId,
          isActive: true,
          roles: {
            some: {
              role: { name: { in: ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'] } },
            },
          },
        },
        select: { id: true },
      });

      if (managers.length > 0) {
        await this.notifications.notifyUsers({
          userIds: managers.map((m) => m.id),
          type: NotificationType.ADMIN_REQUEST,
          title: `طلب اعتماد جديد: ${request.title}`,
          body: `مقدم الطلب: ${sender.username} — نوع الطلب: ${request.type}`,
          data: {
            type: 'ADMIN_REQUEST',
            requestId: request.id,
          },
        });
      }
    } catch {
      // Non-blocking
    }
  }

  private async notifyRequester(
    request: any,
    reviewer: AuthenticatedUser,
    action: string,
    comment?: string,
  ) {
    try {
      const actionTextAr =
        action === 'APPROVED' ? 'تمت الموافقة على' : action === 'REJECTED' ? 'تم رفض' : 'تمت إعادة';

      await this.notifications.notifyUsers({
        userIds: [request.requestedById],
        type: NotificationType.ADMIN_REQUEST,
        title: `${actionTextAr} طلبك: (${request.title})`,
        body: comment ? `ملاحظات المراجع: ${comment}` : `تمت مراجعة الطلب بواسطة الإدارة.`,
        data: {
          type: 'ADMIN_REQUEST',
          requestId: request.id,
          action,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
