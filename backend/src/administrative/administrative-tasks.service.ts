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
  AdminPriority,
  AdminTaskStatus,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import {
  AddTaskFollowUpDto,
  CreateAdminTaskDto,
  UpdateAdminTaskDto,
} from './dto/administrative.dto';

@Injectable()
export class AdministrativeTasksService {
  private readonly logger = new Logger(AdministrativeTasksService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  // 1. Create Task
  async create(user: AuthenticatedUser, dto: CreateAdminTaskDto) {
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    if (!isManager && !isSupervisor) {
      throw new ForbiddenException('Only managers and supervisors can assign administrative tasks');
    }

    // Verify assigned user belongs to the same forum
    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assignedToId, forumId: user.forumId, isActive: true, deletedAt: null },
    });
    if (!assignee) throw new NotFoundException('Assigned user not found in this forum');

    const branchId = dto.branchId ?? assignee.branchId ?? user.branchId ?? null;

    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.adminTask.create({
        data: {
          forumId: user.forumId,
          branchId,
          title: dto.title.trim(),
          description: dto.description?.trim() || null,
          assignedToId: dto.assignedToId,
          createdById: user.id,
          relatedDecisionId: dto.relatedDecisionId,
          relatedRequestId: dto.relatedRequestId,
          relatedAlertId: dto.relatedAlertId,
          priority: dto.priority ?? AdminPriority.NORMAL,
          status: AdminTaskStatus.OPEN,
          dueAt: dto.dueAt ? new Date(dto.dueAt) : null,
        },
        include: {
          assignedTo: { select: { id: true, displayName: true, username: true } },
          createdBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
          relatedDecision: { select: { id: true, decisionNumber: true, title: true } },
          relatedRequest: { select: { id: true, title: true } },
        },
      });

      // Add initial follow-up creation entry
      await tx.taskFollowUp.create({
        data: {
          taskId: created.id,
          actorId: user.id,
          status: AdminTaskStatus.OPEN,
          note: 'تم إنشاء التكليف وإسناده للمسؤول',
        },
      });

      return created;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_TASK_CREATED',
      entityType: 'AdminTask',
      entityId: task.id,
      after: {
        title: task.title,
        assignedToId: task.assignedToId,
        priority: task.priority,
        dueAt: task.dueAt,
      },
    });

    this.notifyAssignee(task, user).catch(() => {});

    return {
      ...task,
      isOverdue: this.isTaskOverdue(task.dueAt, task.status),
    };
  }

  // 2. Find All Tasks
  async findAll(
    user: AuthenticatedUser,
    query: PaginationQueryDto & {
      status?: AdminTaskStatus;
      priority?: AdminPriority;
      branchId?: string;
      assignedToId?: string;
      myOnly?: boolean;
    },
  ) {
    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    const where: Prisma.AdminTaskWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (query.myOnly || (!isGeneralManager && !isExecutiveManager && !isSupervisor)) {
      where.assignedToId = user.id;
    } else if (isExecutiveManager && user.branchId) {
      where.OR = [
        { branchId: user.branchId },
        { branchId: null },
        { assignedToId: user.id },
        { createdById: user.id },
      ];
    }

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.branchId) where.branchId = query.branchId;
    if (query.assignedToId) where.assignedToId = query.assignedToId;

    if (query.search?.trim()) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { description: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.adminTask.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ priority: 'desc' }, { dueAt: 'asc' }, { createdAt: 'desc' }],
        include: {
          assignedTo: { select: { id: true, displayName: true, username: true } },
          createdBy: { select: { id: true, displayName: true, username: true } },
          branch: { select: { id: true, name: true } },
          followUps: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              actor: { select: { id: true, displayName: true, username: true } },
            },
          },
        },
      }),
      this.prisma.adminTask.count({ where }),
    ]);

    const mapped = items.map((task) => ({
      ...task,
      isOverdue: this.isTaskOverdue(task.dueAt, task.status),
    }));

    return paginated(mapped, total, query);
  }

  // 3. Find One Task
  async findOne(user: AuthenticatedUser, id: string) {
    const task = await this.prisma.adminTask.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        createdBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
        relatedDecision: { select: { id: true, decisionNumber: true, title: true, status: true } },
        relatedRequest: { select: { id: true, title: true, status: true } },
        relatedAlert: { select: { id: true, title: true, severity: true } },
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: {
            actor: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    });

    if (!task) throw new NotFoundException('Administrative task not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    if (
      !isGeneralManager &&
      !isExecutiveManager &&
      !isSupervisor &&
      task.assignedToId !== user.id &&
      task.createdById !== user.id
    ) {
      throw new ForbiddenException('Access denied to this task');
    }

    return {
      ...task,
      isOverdue: this.isTaskOverdue(task.dueAt, task.status),
    };
  }

  // 4. Update Task
  async update(user: AuthenticatedUser, id: string, dto: UpdateAdminTaskDto) {
    const task = await this.prisma.adminTask.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');

    const isAssignee = task.assignedToId === user.id;
    const isCreator = task.createdById === user.id;

    if (!isGeneralManager && !isExecutiveManager && !isSupervisor && !isAssignee && !isCreator) {
      throw new ForbiddenException('You do not have permission to modify this task');
    }

    const isCompleting = dto.status === AdminTaskStatus.COMPLETED;

    const updated = await this.prisma.adminTask.update({
      where: { id },
      data: {
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
        ...(dto.dueAt !== undefined ? { dueAt: dto.dueAt ? new Date(dto.dueAt) : null } : {}),
        ...(isCompleting ? { completedAt: new Date() } : {}),
      },
      include: {
        assignedTo: { select: { id: true, displayName: true, username: true } },
        createdBy: { select: { id: true, displayName: true, username: true } },
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: isCompleting ? 'ADMIN_TASK_COMPLETED' : 'ADMIN_TASK_UPDATED',
      entityType: 'AdminTask',
      entityId: updated.id,
      after: { status: updated.status, priority: updated.priority },
    });

    return {
      ...updated,
      isOverdue: this.isTaskOverdue(updated.dueAt, updated.status),
    };
  }

  // 5. Add Follow-Up Note & Progress
  async addFollowUp(user: AuthenticatedUser, id: string, dto: AddTaskFollowUpDto) {
    const task = await this.prisma.adminTask.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!task) throw new NotFoundException('Task not found');

    const isGeneralManager = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    const isExecutiveManager = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');
    const isAssignee = task.assignedToId === user.id;
    const isCreator = task.createdById === user.id;

    if (!isGeneralManager && !isExecutiveManager && !isSupervisor && !isAssignee && !isCreator) {
      throw new ForbiddenException('You cannot add follow-up notes to this task');
    }

    const targetStatus = dto.status ?? task.status;
    const isCompleting = targetStatus === AdminTaskStatus.COMPLETED;

    const followUp = await this.prisma.$transaction(async (tx) => {
      const createdNote = await tx.taskFollowUp.create({
        data: {
          taskId: id,
          actorId: user.id,
          status: targetStatus,
          note: dto.note.trim(),
        },
        include: {
          actor: { select: { id: true, displayName: true, username: true } },
        },
      });

      await tx.adminTask.update({
        where: { id },
        data: {
          status: targetStatus,
          ...(isCompleting ? { completedAt: new Date() } : {}),
          updatedAt: new Date(),
        },
      });

      return createdNote;
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ADMIN_TASK_FOLLOWUP_ADDED',
      entityType: 'AdminTask',
      entityId: id,
      after: {
        note: followUp.note,
        status: followUp.status,
      },
    });

    return followUp;
  }

  // 6. Check Overdue Tasks & Generate Alerts (Callable by Admin / Worker)
  async checkOverdue(user: AuthenticatedUser) {
    const now = new Date();

    const overdueTasks = await this.prisma.adminTask.findMany({
      where: {
        forumId: user.forumId,
        status: { in: [AdminTaskStatus.OPEN, AdminTaskStatus.IN_PROGRESS] },
        dueAt: { lt: now },
        deletedAt: null,
      },
      include: {
        assignedTo: { select: { id: true, displayName: true } },
      },
    });

    let createdAlertCount = 0;

    for (const task of overdueTasks) {
      const existingAlert = await this.prisma.adminAlert.findFirst({
        where: {
          forumId: user.forumId,
          type: AdminAlertType.TASK_OVERDUE,
          relatedEntityId: task.id,
          status: { in: [AdminAlertStatus.OPEN, AdminAlertStatus.ACKNOWLEDGED] },
        },
      });

      if (!existingAlert) {
        await this.prisma.adminAlert.create({
          data: {
            forumId: user.forumId,
            branchId: task.branchId,
            type: AdminAlertType.TASK_OVERDUE,
            severity: AdminAlertSeverity.HIGH,
            title: `تأخر إنجاز مهمة: ${task.title}`,
            message: `المهمة المسندة إلى (${task.assignedTo?.displayName || 'المسؤول'}) تجاوزت الموعد المحدد (${task.dueAt?.toISOString().split('T')[0]}).`,
            relatedEntityType: 'AdminTask',
            relatedEntityId: task.id,
            assignedToId: task.assignedToId,
          },
        });
        createdAlertCount++;
      }
    }

    return {
      checkedTotal: overdueTasks.length,
      alertsGenerated: createdAlertCount,
    };
  }

  // Helper: Derived overdue check
  private isTaskOverdue(dueAt: Date | null, status: AdminTaskStatus): boolean {
    if (!dueAt) return false;
    if (status === AdminTaskStatus.COMPLETED || status === AdminTaskStatus.CANCELLED) return false;
    return new Date(dueAt).getTime() < Date.now();
  }

  private async notifyAssignee(task: any, creator: AuthenticatedUser) {
    try {
      await this.notifications.notifyUsers({
        userIds: [task.assignedToId],
        type: NotificationType.ADMIN_TASK,
        title: `تكليف جديد: (${task.title})`,
        body: `تم تكليفك بمهمة جديدة بواسطة ${creator.username}. الموعد المحدد: ${task.dueAt ? new Date(task.dueAt).toISOString().split('T')[0] : 'غير محدد'}`,
        data: {
          type: 'ADMIN_TASK',
          taskId: task.id,
          priority: task.priority,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
