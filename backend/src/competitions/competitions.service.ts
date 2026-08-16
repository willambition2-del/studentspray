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
  CompetitionCategory,
  CompetitionStatus,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import {
  BulkRecordResultsDto,
  CompetitionQueryDto,
  CreateCompetitionDto,
  RegisterCompetitionParticipantDto,
  UpdateCompetitionDto,
} from './dto/competition.dto';

interface CompetitionSummary {
  id: string;
  title: string;
  maxScore: number;
}

@Injectable()
export class CompetitionsService {
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

  // 1. Create Competition
  async create(user: AuthenticatedUser, dto: CreateCompetitionDto) {
    const branchId = dto.branchId ?? user.branchId;
    if (branchId && !this.canManageBranch(user, branchId)) {
      throw new ForbiddenException('Cannot create competition for another branch');
    }

    const competition = await this.prisma.competition.create({
      data: {
        forumId: user.forumId,
        branchId,
        title: dto.title.trim(),
        description: dto.description?.trim(),
        category: dto.category ?? CompetitionCategory.MEMORIZATION,
        status: CompetitionStatus.DRAFT,
        startsAt: new Date(dto.startsAt),
        endsAt: dto.endsAt ? new Date(dto.endsAt) : null,
        maxScore: dto.maxScore ?? 100,
        criteria: dto.criteria ? (dto.criteria as Prisma.InputJsonValue) : Prisma.JsonNull,
        createdById: user.id,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'COMPETITION_CREATED',
      entityType: 'Competition',
      entityId: competition.id,
      after: competition as unknown as Record<string, unknown>,
    });

    return competition;
  }

  // 2. Find All Competitions (with scoping)
  async findAll(user: AuthenticatedUser, query: CompetitionQueryDto) {
    const where: Prisma.CompetitionWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    if (!isManager) {
      where.status = {
        in: [
          CompetitionStatus.PUBLISHED,
          CompetitionStatus.IN_PROGRESS,
          CompetitionStatus.COMPLETED,
          CompetitionStatus.RESULTS_PUBLISHED,
        ],
      };
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    } else if (user.branchId && !user.roles.some((r) => r.name === 'GENERAL_MANAGER')) {
      where.OR = [{ branchId: user.branchId }, { branchId: null }];
    }

    if (query.search) {
      where.title = { contains: query.search.trim(), mode: 'insensitive' };
    }

    const { skip, take } = pageArgs(query);

    const [total, items] = await Promise.all([
      this.prisma.competition.count({ where }),
      this.prisma.competition.findMany({
        where,
        skip,
        take,
        orderBy: { startsAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true } },
          _count: { select: { participants: true, results: true, awards: true } },
        },
      }),
    ]);

    return paginated(items, total, query);
  }

  // 3. Find One Competition
  async findOne(user: AuthenticatedUser, id: string) {
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER', 'TECHNICAL_SUPERVISOR', 'TEACHER'].includes(r.name),
    );

    const competition = await this.prisma.competition.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
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
        results: {
          where: isManager ? undefined : { publishedAt: { not: null } },
          include: {
            student: {
              include: {
                user: { select: { id: true, displayName: true, username: true } },
              },
            },
          },
          orderBy: [{ rank: 'asc' }, { score: 'desc' }],
        },
      },
    });

    if (!competition) throw new NotFoundException('Competition not found');
    return competition;
  }

  // 4. Update Competition
  async update(user: AuthenticatedUser, id: string, dto: UpdateCompetitionDto) {
    const existing = await this.prisma.competition.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Competition not found');

    if (existing.branchId && !this.canManageBranch(user, existing.branchId)) {
      throw new ForbiddenException('Cannot modify competition belonging to another branch');
    }

    const beforeState = existing as unknown as Record<string, unknown>;
    const isPublishingResults =
      dto.status === CompetitionStatus.RESULTS_PUBLISHED &&
      existing.status !== CompetitionStatus.RESULTS_PUBLISHED;

    const updated = await this.prisma.competition.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        description: dto.description?.trim(),
        category: dto.category,
        status: dto.status,
        startsAt: dto.startsAt ? new Date(dto.startsAt) : undefined,
        endsAt: dto.endsAt ? new Date(dto.endsAt) : undefined,
        maxScore: dto.maxScore,
        criteria: dto.criteria ? (dto.criteria as Prisma.InputJsonValue) : undefined,
        branchId: dto.branchId !== undefined ? dto.branchId : undefined,
      },
      include: {
        branch: { select: { id: true, name: true } },
      },
    });

    // If results published, timestamp them and send notifications
    if (isPublishingResults) {
      await this.prisma.competitionResult.updateMany({
        where: { competitionId: id, publishedAt: null },
        data: { publishedAt: new Date() },
      });
      await this.notifyCompetitionResultsPublished(user.forumId, updated);
    }

    const action = isPublishingResults
      ? 'COMPETITION_RESULTS_PUBLISHED'
      : dto.status === CompetitionStatus.PUBLISHED
      ? 'COMPETITION_PUBLISHED'
      : 'COMPETITION_UPDATED';

    await this.audit.record({
      actorUserId: user.id,
      action,
      entityType: 'Competition',
      entityId: id,
      before: beforeState,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  // 5. Register Participant
  async registerParticipant(
    user: AuthenticatedUser,
    competitionId: string,
    dto: RegisterCompetitionParticipantDto,
  ) {
    const competition = await this.prisma.competition.findFirst({
      where: { id: competitionId, forumId: user.forumId, deletedAt: null },
    });
    if (!competition) throw new NotFoundException('Competition not found');

    const participant = await this.prisma.competitionParticipant.upsert({
      where: {
        competitionId_studentId: {
          competitionId,
          studentId: dto.studentId,
        },
      },
      create: {
        competitionId,
        studentId: dto.studentId,
      },
      update: {},
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

  // 6. Record Bulk Results with automatic rank calculation
  async recordResults(
    user: AuthenticatedUser,
    competitionId: string,
    dto: BulkRecordResultsDto,
  ) {
    const competition = await this.prisma.competition.findFirst({
      where: { id: competitionId, forumId: user.forumId, deletedAt: null },
    });
    if (!competition) throw new NotFoundException('Competition not found');

    // Sort entries descending by score to calculate ranks if not explicitly provided
    const sorted = [...dto.results].sort((a, b) => b.score - a.score);

    const results = await this.prisma.$transaction(
      sorted.map((item, index) => {
        const calculatedRank = item.rank ?? index + 1;
        return this.prisma.competitionResult.upsert({
          where: {
            competitionId_studentId: {
              competitionId,
              studentId: item.studentId,
            },
          },
          create: {
            competitionId,
            studentId: item.studentId,
            score: item.score,
            rank: calculatedRank,
            notes: item.notes?.trim(),
            gradedById: user.id,
            publishedAt: competition.status === CompetitionStatus.RESULTS_PUBLISHED ? new Date() : null,
          },
          update: {
            score: item.score,
            rank: calculatedRank,
            notes: item.notes?.trim(),
            gradedById: user.id,
            publishedAt: competition.status === CompetitionStatus.RESULTS_PUBLISHED ? new Date() : undefined,
          },
        });
      }),
    );

    await this.audit.record({
      actorUserId: user.id,
      action: 'COMPETITION_RESULTS_RECORDED',
      entityType: 'Competition',
      entityId: competitionId,
      after: { count: results.length },
    });

    return results;
  }

  // 7. Contextual for Student
  async getStudentCompetitions(studentProfileId: string) {
    const results = await this.prisma.competitionResult.findMany({
      where: {
        studentId: studentProfileId,
        publishedAt: { not: null },
      },
      include: {
        competition: {
          include: {
            branch: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { publishedAt: 'desc' },
    });

    return results.map((r) => ({
      ...r.competition,
      myResult: {
        score: r.score,
        rank: r.rank,
        notes: r.notes,
        publishedAt: r.publishedAt,
      },
    }));
  }

  // Helper: Notification Dispatch for Published Results
  private async notifyCompetitionResultsPublished(forumId: string, competition: CompetitionSummary) {
    try {
      const results = await this.prisma.competitionResult.findMany({
        where: { competitionId: competition.id },
        include: {
          student: {
            include: {
              user: { select: { id: true } },
              guardians: {
                where: { receivesAcademicReports: true },
                include: { parent: { include: { user: { select: { id: true } } } } },
              },
            },
          },
        },
      });

      for (const res of results) {
        const studentUserId = res.student.user.id;
        const parentUserIds = res.student.guardians.map((g) => g.parent.user.id);
        const recipientUserIds = [studentUserId, ...parentUserIds];

        if (recipientUserIds.length > 0) {
          const rankText = res.rank ? ` بالمركز ${res.rank}` : '';
          await this.notifications.notifyUsers({
            userIds: recipientUserIds,
            type: NotificationType.EXAM_RESULT,
            title: `نتائج مسابقة: ${competition.title}`,
            body: `تم اعتماد ونشر نتائج مسابقة "${competition.title}". حصل الطالب على درجة ${res.score}/${competition.maxScore}${rankText}.`,
            data: { competitionId: competition.id, score: String(res.score), rank: String(res.rank || '') },
          });
        }
      }
    } catch {
      // Soft-fail notification dispatch
    }
  }
}
