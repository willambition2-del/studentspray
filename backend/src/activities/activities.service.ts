import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';
import {
  ActivityStatus,
  ActivityType,
  NotificationType,
  ParticipantNominationStatus,
  Prisma,
} from '../generated/prisma/client';
import {
  ActivityQueryDto,
  CreateActivityDto,
  NominateParticipantDto,
  UpdateActivityDto,
  UpdateParticipantStatusDto,
} from './dto/activity.dto';

interface ActivitySummary {
  id: string;
  title: string;
  startsAt: Date;
  branchId: string | null;
  halaqaId: string | null;
}

@Injectable()
export class ActivitiesService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private canManageBranch(user: AuthenticatedUser, branchId?: string | null): boolean {
    if (user.roles.some((r) => r.name === 'GENERAL_MANAGER')) return true;
    if (!branchId) return false;
    return user.branchId === branchId;
  }

  // 1. Create Activity
  async create(user: AuthenticatedUser, dto: CreateActivityDto) {
    const branchId = dto.branchId ?? user.branchId;
    if (branchId && !this.canManageBranch(user, branchId)) {
      throw new ForbiddenException('Cannot create activity for another branch');
    }

    if (dto.halaqaId) {
      const halaqa = await this.prisma.halaqa.findFirst({
        where: { id: dto.halaqaId, forumId: user.forumId, deletedAt: null },
      });
      if (!halaqa) throw new NotFoundException('Halaqa not found');
    }

    const activity = await this.prisma.activity.create({
      data: {
        forumId: user.forumId,
        branchId,
        halaqaId: dto.halaqaId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        type: dto.type ?? ActivityType.EDUCATIONAL,
        status: ActivityStatus.DRAFT,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        location: dto.location?.trim(),
        capacity: dto.capacity,
        createdById: user.id,
      },
      include: {
        branch: { select: { id: true, name: true } },
        halaqa: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'ACTIVITY_CREATED',
      entityType: 'Activity',
      entityId: activity.id,
      after: activity as unknown as Record<string, unknown>,
    });

    return activity;
  }

  // 2. Find All Activities (with role-based scoping and filters)
  async findAll(user: AuthenticatedUser, query: ActivityQueryDto) {
    const where: Prisma.ActivityWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    // Role-based visibility
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    if (!isManager) {
      // Non-managers only see published, in_progress or completed activities
      where.status = {
        in: [ActivityStatus.PUBLISHED, ActivityStatus.IN_PROGRESS, ActivityStatus.COMPLETED],
      };
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    } else if (user.branchId && !user.roles.some((r) => r.name === 'GENERAL_MANAGER')) {
      // Scoped to user's branch or forum-wide (branchId == null)
      where.OR = [{ branchId: user.branchId }, { branchId: null }];
    }

    if (query.halaqaId) {
      where.halaqaId = query.halaqaId;
    }

    if (query.search) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const { skip, take } = pageArgs(query);

    const [total, items] = await Promise.all([
      this.prisma.activity.count({ where }),
      this.prisma.activity.findMany({
        where,
        skip,
        take,
        orderBy: { startsAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          halaqa: { select: { id: true, name: true } },
          _count: { select: { participants: true, awards: true } },
        },
      }),
    ]);

    return paginated(items, total, query);
  }

  // 3. Find One Activity
  async findOne(user: AuthenticatedUser, id: string) {
    const activity = await this.prisma.activity.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
        halaqa: { select: { id: true, name: true } },
        participants: {
          include: {
            student: {
              include: {
                user: { select: { id: true, displayName: true, username: true } },
              },
            },
          },
          orderBy: { registeredAt: 'asc' },
        },
        awards: {
          include: {
            award: true,
            student: {
              include: {
                user: { select: { id: true, displayName: true } },
              },
            },
          },
        },
      },
    });

    if (!activity) throw new NotFoundException('Activity not found');
    return activity;
  }

  // 4. Update Activity
  async update(user: AuthenticatedUser, id: string, dto: UpdateActivityDto) {
    const existing = await this.prisma.activity.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Activity not found');

    if (existing.branchId && !this.canManageBranch(user, existing.branchId)) {
      throw new ForbiddenException('Cannot modify activity belonging to another branch');
    }

    const beforeState = existing as unknown as Record<string, unknown>;
    const isPublishing = dto.status === ActivityStatus.PUBLISHED && existing.status !== ActivityStatus.PUBLISHED;

    const updated = await this.prisma.activity.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        type: dto.type,
        status: dto.status,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        location: dto.location?.trim(),
        capacity: dto.capacity,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
        halaqaId: dto.halaqaId !== undefined ? dto.halaqaId : undefined,
      },
      include: {
        branch: { select: { id: true, name: true } },
        halaqa: { select: { id: true, name: true } },
      },
    });

    // Notify users when activity is published
    if (isPublishing) {
      await this.notifyActivityPublished(user.forumId, updated);
    }

    const action = isPublishing
      ? 'ACTIVITY_PUBLISHED'
      : dto.status === ActivityStatus.CANCELLED
      ? 'ACTIVITY_CANCELLED'
      : 'ACTIVITY_UPDATED';

    await this.audit.record({
      actorUserId: user.id,
      action,
      entityType: 'Activity',
      entityId: id,
      before: beforeState,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  // 5. Nominate Participant
  async nominateParticipant(user: AuthenticatedUser, activityId: string, dto: NominateParticipantDto) {
    const activity = await this.prisma.activity.findFirst({
      where: { id: activityId, forumId: user.forumId, deletedAt: null },
    });
    if (!activity) throw new NotFoundException('Activity not found');

    const student = await this.prisma.studentProfile.findFirst({
      where: { id: dto.studentId, user: { forumId: user.forumId, deletedAt: null } },
      include: { user: { select: { id: true, displayName: true } } },
    });
    if (!student) throw new NotFoundException('Student not found');

    const participant = await this.prisma.activityParticipant.upsert({
      where: {
        activityId_studentId: {
          activityId,
          studentId: dto.studentId,
        },
      },
      create: {
        activityId,
        studentId: dto.studentId,
        nominationStatus: ParticipantNominationStatus.NOMINATED,
        notes: dto.notes?.trim(),
      },
      update: {
        nominationStatus: ParticipantNominationStatus.NOMINATED,
        notes: dto.notes?.trim(),
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, displayName: true } },
          },
        },
      },
    });

    return participant;
  }

  // 6. Update Participant Status (Approval / Attendance / Score)
  async updateParticipantStatus(
    user: AuthenticatedUser,
    activityId: string,
    studentId: string,
    dto: UpdateParticipantStatusDto,
  ) {
    const existing = await this.prisma.activityParticipant.findUnique({
      where: { activityId_studentId: { activityId, studentId } },
      include: { activity: true },
    });
    if (!existing || existing.activity.forumId !== user.forumId) {
      throw new NotFoundException('Participant not found for this activity');
    }

    const updated = await this.prisma.activityParticipant.update({
      where: { activityId_studentId: { activityId, studentId } },
      data: {
        nominationStatus: dto.nominationStatus,
        attendanceStatus: dto.attendanceStatus,
        parentApprovalStatus: dto.parentApprovalStatus,
        notes: dto.notes?.trim(),
      },
    });

    return updated;
  }

  // 7. Contextual for Student
  async getStudentActivities(studentProfileId: string) {
    const participations = await this.prisma.activityParticipant.findMany({
      where: { studentId: studentProfileId },
      include: {
        activity: {
          include: {
            branch: { select: { id: true, name: true } },
            halaqa: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });

    return participations.map((p) => ({
      ...p.activity,
      myParticipation: {
        nominationStatus: p.nominationStatus,
        attendanceStatus: p.attendanceStatus,
        parentApprovalStatus: p.parentApprovalStatus,
        registeredAt: p.registeredAt,
      },
    }));
  }

  // Helper: Notification Dispatch
  private async notifyActivityPublished(forumId: string, activity: ActivitySummary) {
    try {
      // Find students in the target halaqa or branch
      const whereStudent: Prisma.StudentProfileWhereInput = {
        user: { forumId, isActive: true, deletedAt: null },
      };
      if (activity.halaqaId) {
        whereStudent.halaqaMemberships = {
          some: { halaqaId: activity.halaqaId, isActive: true },
        };
      } else if (activity.branchId) {
        whereStudent.user = { branchId: activity.branchId, isActive: true, deletedAt: null };
      }

      const students = await this.prisma.studentProfile.findMany({
        where: whereStudent,
        select: { userId: true },
        take: 100,
      });

      const userIds = students.map((s) => s.userId);
      if (userIds.length > 0) {
        await this.notifications.notifyUsers({
          userIds,
          type: NotificationType.SYSTEM,
          title: `نشاط جديد: ${activity.title}`,
          body: `يسر إدارة الملتقى الإعلان عن إقامة نشاط: "${activity.title}". سيبدأ بتاريخ ${new Date(activity.startsAt).toLocaleDateString('ar-SA')}.`,
          data: { activityId: activity.id, type: 'ACTIVITY' },
        });
      }
    } catch {
      // Soft-fail notification dispatch
    }
  }
}
