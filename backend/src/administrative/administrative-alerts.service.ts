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
  AdminAlertSeverity,
  AdminAlertStatus,
  AdminAlertType,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import {
  CreateAdminAlertDto,
  ResolveAdminAlertDto,
} from './dto/administrative.dto';

@Injectable()
export class AdministrativeAlertsService {
  private readonly logger = new Logger(AdministrativeAlertsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  // 1. Create Alert
  async create(user: AuthenticatedUser, dto: CreateAdminAlertDto) {
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    if (!isManager && !isSupervisor) {
      throw new ForbiddenException('Only management and supervisors can create administrative alerts');
    }

    const branchId = dto.branchId ?? user.branchId ?? null;

    const alert = await this.prisma.adminAlert.create({
      data: {
        forumId: user.forumId,
        branchId,
        type: dto.type,
        severity: dto.severity ?? AdminAlertSeverity.INFO,
        title: dto.title.trim(),
        message: dto.message.trim(),
        relatedEntityType: dto.relatedEntityType,
        relatedEntityId: dto.relatedEntityId,
        assignedToId: dto.assignedToId,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
      },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_ALERT_CREATED',
      entityType: 'AdminAlert',
      entityId: alert.id,
      after: {
        title: alert.title,
        severity: alert.severity,
        type: alert.type,
        assignedToId: alert.assignedToId,
      },
    });

    if (alert.assignedToId) {
      this.notifyAssignee(alert).catch(() => {});
    }

    return alert;
  }

  // 2. Find All Alerts
  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & {
      status?: AdminAlertStatus;
      severity?: AdminAlertSeverity;
      type?: AdminAlertType;
      branchId?: string;
      assignedToId?: string;
    },
  ) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    const where: Prisma.AdminAlertWhereInput = {
      forumId: user.forumId,
    };

    if (isExecutiveManager && user.branchId) {
      where.OR = [
        { branchId: user.branchId },
        { branchId: null },
        { assignedToId: user.id },
      ];
    } else if (!isGeneralManager && !isExecutiveManager) {
      where.assignedToId = user.id;
    }

    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.type) where.type = query.type;
    if (query.branchId) where.branchId = query.branchId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { message: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.adminAlert.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: { select: { id: true, displayName: true, username: true } },
          resolvedBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
        },
      }),
      this.prisma.adminAlert.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  // 3. Find One Alert
  async findOne(user: AuthenticatedUser, id: string) {
    const alert = await this.prisma.adminAlert.findFirst({
      where: { id, forumId: user.forumId },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        resolvedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
        tasks: { select: { id: true, title: true, status: true } },
      },
    });

    if (!alert) throw new NotFoundException('Administrative alert not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager && alert.assignedToId !== user.id) {
      throw new ForbiddenException('You do not have access to this alert');
    }

    return alert;
  }

  // 4. Acknowledge Alert
  async acknowledge(user: AuthenticatedUser, id: string) {
    const alert = await this.prisma.adminAlert.findFirst({
      where: { id, forumId: user.forumId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager && alert.assignedToId !== user.id) {
      throw new ForbiddenException('Cannot acknowledge an alert not assigned to you');
    }

    const updated = await this.prisma.adminAlert.update({
      where: { id },
      data: { status: AdminAlertStatus.ACKNOWLEDGED },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_ALERT_ACKNOWLEDGED',
      entityType: 'AdminAlert',
      entityId: updated.id,
      after: { status: updated.status },
    });

    return updated;
  }

  // 5. Resolve or Dismiss Alert
  async resolve(user: AuthenticatedUser, id: string, dto: ResolveAdminAlertDto) {
    const alert = await this.prisma.adminAlert.findFirst({
      where: { id, forumId: user.forumId },
    });
    if (!alert) throw new NotFoundException('Alert not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');

    if (!isGeneralManager && !isExecutiveManager && alert.assignedToId !== user.id) {
      throw new ForbiddenException('Cannot resolve an alert not assigned to you');
    }

    const targetStatus = dto.status ?? AdminAlertStatus.RESOLVED;

    const resolved = await this.prisma.adminAlert.update({
      where: { id },
      data: {
        status: targetStatus,
        resolvedAt: new Date(),
        resolvedById: user.id,
      },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        resolvedBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_ALERT_RESOLVED',
      entityType: 'AdminAlert',
      entityId: resolved.id,
      after: {
        status: resolved.status,
        resolvedById: resolved.resolvedById,
        resolutionNote: dto.resolutionNote,
      },
    });

    return resolved;
  }

  private async notifyAssignee(alert: any) {
    try {
      if (!alert.assignedToId) return;

      await this.notifications.notifyUsers({
        userIds: [alert.assignedToId],
        type: NotificationType.ADMIN_ALERT,
        title: `تنبيه إداري: (${alert.title})`,
        body: alert.message,
        data: {
          type: 'ADMIN_ALERT',
          alertId: alert.id,
          severity: alert.severity,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
