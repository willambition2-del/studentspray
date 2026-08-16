import {
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
  AwardType,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import {
  AwardQueryDto,
  CreateAwardDto,
  GrantAwardDto,
  UpdateAwardDto,
} from './dto/award.dto';

@Injectable()
export class AwardsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  // 1. Create Award Template
  async create(user: AuthenticatedUser, dto: CreateAwardDto) {
    const award = await this.prisma.award.create({
      data: {
        forumId: user.forumId,
        name: dto.name.trim(),
        description: dto.description?.trim(),
        iconKey: dto.iconKey?.trim(),
        type: dto.type ?? AwardType.BADGE,
        points: dto.points ?? 0,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'AWARD_CREATED',
      entityType: 'Award',
      entityId: award.id,
      after: award as unknown as Record<string, unknown>,
    });

    return award;
  }

  // 2. Find All Awards
  async findAll(user: AuthenticatedUser, query: AwardQueryDto) {
    const where: Prisma.AwardWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (query.type) where.type = query.type;
    if (query.isActive !== undefined) where.isActive = query.isActive;
    if (query.search) {
      where.name = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const { skip, take } = pageArgs(query);

    const [total, items] = await Promise.all([
      this.prisma.award.count({ where }),
      this.prisma.award.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { studentAwards: true } },
        },
      }),
    ]);

    return paginated(items, total, query);
  }

  // 3. Find One Award
  async findOne(user: AuthenticatedUser, id: string) {
    const award = await this.prisma.award.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        studentAwards: {
          include: {
            student: {
              include: {
                user: { select: { id: true, displayName: true, username: true } },
              },
            },
            activity: { select: { id: true, title: true } },
            competition: { select: { id: true, title: true } },
            awardedBy: { select: { id: true, displayName: true } },
          },
          orderBy: { awardedAt: 'desc' },
        },
      },
    });

    if (!award) throw new NotFoundException('Award not found');
    return award;
  }

  // 4. Update Award
  async update(user: AuthenticatedUser, id: string, dto: UpdateAwardDto) {
    const existing = await this.prisma.award.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Award not found');

    const updated = await this.prisma.award.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        description: dto.description?.trim(),
        iconKey: dto.iconKey?.trim(),
        type: dto.type,
        points: dto.points,
        isActive: dto.isActive,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'AWARD_UPDATED',
      entityType: 'Award',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  // 5. Grant Award to Student
  async grantAward(user: AuthenticatedUser, dto: GrantAwardDto) {
    const award = await this.prisma.award.findFirst({
      where: { id: dto.awardId, forumId: user.forumId, deletedAt: null },
    });
    if (!award) throw new NotFoundException('Award not found');

    const student = await this.prisma.studentProfile.findFirst({
      where: { id: dto.studentId, user: { forumId: user.forumId, deletedAt: null } },
      include: {
        user: { select: { id: true, displayName: true } },
        guardians: {
          where: { receivesAcademicReports: true },
          include: { parent: { include: { user: { select: { id: true } } } } },
        },
      },
    });
    if (!student) throw new NotFoundException('Student not found');

    const studentAward = await this.prisma.studentAward.create({
      data: {
        awardId: dto.awardId,
        studentId: dto.studentId,
        reason: dto.reason.trim(),
        activityId: dto.activityId,
        competitionId: dto.competitionId,
        awardedById: user.id,
      },
      include: {
        award: true,
        activity: { select: { id: true, title: true } },
        competition: { select: { id: true, title: true } },
      },
    });

    // Notify Student and Parents
    try {
      const studentUserId = student.user.id;
      const parentUserIds = student.guardians.map((g) => g.parent.user.id);
      const recipientUserIds = [studentUserId, ...parentUserIds];

      await this.notifications.notifyUsers({
        userIds: recipientUserIds,
        type: NotificationType.STUDENT_EVALUATION,
        title: `تكريم ووسام جديد: ${award.name}`,
        body: `مبارك! تم منح الطالب "${student.user.displayName}" ${award.name} تقديراً لـ: ${dto.reason.trim()}.`,
        data: { awardId: award.id, studentAwardId: studentAward.id },
      });
    } catch {
      // Soft-fail notification dispatch
    }

    await this.audit.record({
      actorUserId: user.id,
      action: 'STUDENT_AWARD_GRANTED',
      entityType: 'StudentAward',
      entityId: studentAward.id,
      after: studentAward as unknown as Record<string, unknown>,
    });

    return studentAward;
  }

  // 6. Get Student Awards (History)
  async getStudentAwards(studentProfileId: string) {
    return this.prisma.studentAward.findMany({
      where: { studentId: studentProfileId },
      include: {
        award: true,
        activity: { select: { id: true, title: true } },
        competition: { select: { id: true, title: true } },
        awardedBy: { select: { id: true, displayName: true } },
      },
      orderBy: { awardedAt: 'desc' },
    });
  }
}
