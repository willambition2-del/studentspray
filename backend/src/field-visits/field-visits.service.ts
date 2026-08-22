import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import {
  EvaluationLevel,
  EvaluationStatus,
  Prisma,
  VisitStatus,
} from '../generated/prisma/client';
import {
  CreateFieldVisitDto,
  CreateRecommendationDto,
  CreateRecommendationFollowUpDto,
  FieldVisitQueryDto,
  RecommendationQueryDto,
  SaveFieldVisitEvaluationDto,
  UpdateFieldVisitStatusDto,
  UpdateRecommendationDto,
} from './dto/field-visit.dto';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';

@Injectable()
export class FieldVisitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScope: AccessScopeService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, query: FieldVisitQueryDto) {
    const where: Prisma.FieldVisitWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.visitType) where.visitType = query.visitType;
    if (query.halaqaId) where.halaqaId = query.halaqaId;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.supervisorId) where.supervisorId = query.supervisorId;
    if (query.branchId) where.branchId = query.branchId;

    if (query.dateFrom || query.dateTo) {
      where.scheduledDate = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    // Role-based scoping
    if (user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR')) {
      const supervisor = await this.prisma.supervisorProfile.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!supervisor) return { items: [], total: 0, page: query.page, limit: query.limit };
      where.supervisorId = supervisor.id;
    } else if (user.roles.some((r) => r.name === 'TEACHER')) {
      const teacher = await this.prisma.teacherProfile.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!teacher) return { items: [], total: 0, page: query.page, limit: query.limit };
      where.teacherId = teacher.id;
    } else if (user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER') && user.branchId) {
      where.branchId = user.branchId;
    }

    const [items, total] = await Promise.all([
      this.prisma.fieldVisit.findMany({
        where,
        include: {
          supervisor: {
            include: { user: { select: { id: true, displayName: true, username: true } } },
          },
          teacher: {
            include: { user: { select: { id: true, displayName: true, username: true } } },
          },
          halaqa: {
            select: { id: true, name: true, code: true, branch: { select: { id: true, name: true } } },
          },
          evaluation: {
            select: {
              id: true,
              status: true,
              totalScore: true,
              percentage: true,
              level: true,
              submittedAt: true,
            },
          },
          _count: { select: { recommendations: true } },
        },
        ...pageArgs(query),
        orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.fieldVisit.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async getById(user: AuthenticatedUser, id: string) {
    if (!(await this.accessScope.canAccessFieldVisit(user, id))) {
      throw new ForbiddenException('Access to this field visit is outside your authorized scope');
    }

    const visit = await this.prisma.fieldVisit.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        supervisor: {
          include: { user: { select: { id: true, displayName: true, username: true, phone: true } } },
        },
        teacher: {
          include: { user: { select: { id: true, displayName: true, username: true, phone: true } } },
        },
        halaqa: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
        evaluation: {
          include: {
            template: true,
            criteriaEvaluations: {
              include: { criterion: { include: { axis: true } } },
            },
          },
        },
        recommendations: {
          include: {
            followUps: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
        notes: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!visit) throw new NotFoundException('Field visit not found');
    return visit;
  }

  async create(user: AuthenticatedUser, dto: CreateFieldVisitDto, context: AuthContext) {
    // Idempotency check
    if (dto.clientMutationId) {
      const existing = await this.prisma.fieldVisit.findUnique({
        where: { clientMutationId: dto.clientMutationId },
        include: {
          supervisor: { include: { user: { select: { displayName: true } } } },
          teacher: { include: { user: { select: { displayName: true } } } },
          halaqa: { select: { name: true, code: true } },
        },
      });
      if (existing) return existing;
    }

    // Verify Halaqa Access
    if (!(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('You do not have access to this Halaqa');
    }

    const halaqa = await this.prisma.halaqa.findFirst({
      where: { id: dto.halaqaId, forumId: user.forumId, isActive: true, deletedAt: null },
    });
    if (!halaqa) throw new NotFoundException('Halaqa not found');

    // Determine supervisor
    let supervisorId: string;
    if (user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR')) {
      const profile = await this.prisma.supervisorProfile.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!profile) throw new ForbiddenException('Supervisor profile not found');
      supervisorId = profile.id;

      // Verify active assignment to halaqa
      const isAssigned = await this.prisma.halaqaSupervisor.findFirst({
        where: { halaqaId: dto.halaqaId, supervisorId, isActive: true, endedAt: null },
      });
      if (!isAssigned) {
        throw new ForbiddenException('You are not assigned to supervise this Halaqa');
      }
    } else {
      // Admin/Executive Manager creating visit
      const assignedSup = await this.prisma.halaqaSupervisor.findFirst({
        where: { halaqaId: dto.halaqaId, isActive: true, endedAt: null },
      });
      if (!assignedSup) {
        throw new BadRequestException('Halaqa has no assigned supervisor');
      }
      supervisorId = assignedSup.supervisorId;
    }

    // Verify teacher is assigned to halaqa
    const isTeacherAssigned = await this.prisma.halaqaTeacher.findFirst({
      where: { halaqaId: dto.halaqaId, teacherId: dto.teacherId, isActive: true, endedAt: null },
    });
    if (!isTeacherAssigned) {
      throw new BadRequestException('Teacher is not currently assigned to this Halaqa');
    }

    // Generate sequential visit number
    const count = await this.prisma.fieldVisit.count({ where: { forumId: user.forumId } });
    const year = new Date().getFullYear();
    const visitNumber = `VIS-${year}-${(count + 1).toString().padStart(4, '0')}`;

    const visit = await this.prisma.fieldVisit.create({
      data: {
        forumId: user.forumId,
        branchId: halaqa.branchId,
        supervisorId,
        halaqaId: dto.halaqaId,
        teacherId: dto.teacherId,
        visitNumber,
        visitType: dto.visitType ?? 'ROUTINE',
        status: 'PLANNED',
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : new Date(),
        reason: dto.reason,
        summary: dto.summary,
        generalNotes: dto.generalNotes,
        createdById: user.id,
        clientMutationId: dto.clientMutationId,
      },
      include: {
        supervisor: { include: { user: { select: { displayName: true } } } },
        teacher: { include: { user: { select: { displayName: true } } } },
        halaqa: { select: { name: true, code: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'FIELD_VISIT_CREATED',
      entityType: 'FieldVisit',
      entityId: visit.id,
      after: { visitNumber: visit.visitNumber, halaqaId: visit.halaqaId, teacherId: visit.teacherId },
      ...context,
    });

    return visit;
  }

  async updateStatus(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateFieldVisitStatusDto,
    context: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessFieldVisit(user, id))) {
      throw new ForbiddenException('Access outside your authorized scope');
    }

    const existing = await this.prisma.fieldVisit.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Field visit not found');

    const updateData: Prisma.FieldVisitUpdateInput = {
      status: dto.status,
      summary: dto.summary ?? existing.summary,
      generalNotes: dto.generalNotes ?? existing.generalNotes,
      scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : existing.scheduledDate,
    };

    if (dto.status === 'IN_PROGRESS' && !existing.startedAt) {
      updateData.startedAt = dto.startedAt ? new Date(dto.startedAt) : new Date();
    } else if (dto.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = dto.completedAt ? new Date(dto.completedAt) : new Date();
    }

    const updated = await this.prisma.fieldVisit.update({
      where: { id },
      data: updateData,
    });

    await this.audit.record({
      actorUserId: user.id,
      action: dto.status === 'COMPLETED' ? 'FIELD_VISIT_COMPLETED' : 'FIELD_VISIT_UPDATED',
      entityType: 'FieldVisit',
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
      ...context,
    });

    return updated;
  }

  async saveEvaluation(
    user: AuthenticatedUser,
    visitId: string,
    dto: SaveFieldVisitEvaluationDto,
    context: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessFieldVisit(user, visitId))) {
      throw new ForbiddenException('Access to this field visit is outside your authorized scope');
    }

    const visit = await this.prisma.fieldVisit.findFirst({
      where: { id: visitId, forumId: user.forumId, deletedAt: null },
      include: { evaluation: true },
    });
    if (!visit) throw new NotFoundException('Field visit not found');

    // Idempotency check for evaluation submission
    if (dto.clientMutationId) {
      const existingEval = await this.prisma.fieldVisitEvaluation.findUnique({
        where: { clientMutationId: dto.clientMutationId },
        include: { criteriaEvaluations: true },
      });
      if (existingEval) return existingEval;
    }

    // Load template
    let templateId = dto.templateId;
    if (!templateId) {
      const defaultTemplate = await this.prisma.evaluationTemplate.findFirst({
        where: { forumId: user.forumId, isActive: true, isDefault: true, deletedAt: null },
      });
      templateId = defaultTemplate?.id;
    }
    if (!templateId) {
      const anyTemplate = await this.prisma.evaluationTemplate.findFirst({
        where: { forumId: user.forumId, isActive: true, deletedAt: null },
        orderBy: { createdAt: 'desc' },
      });
      templateId = anyTemplate?.id;
    }
    if (!templateId) throw new BadRequestException('No evaluation template available for this forum');

    const template = await this.prisma.evaluationTemplate.findFirst({
      where: { id: templateId, forumId: user.forumId },
      include: {
        axes: {
          where: { isActive: true },
          include: { criteria: { where: { isActive: true } } },
        },
      },
    });
    if (!template) throw new NotFoundException('Evaluation template not found');

    // Server-side Score Calculation
    let totalWeightedScore = 0;
    let totalPossibleWeight = 0;
    type CriterionMeta = {
      criterion: { id: string; name: string; maxScore: Prisma.Decimal | number; weight: Prisma.Decimal | number | null };
      axis: { id: string; name: string; weight: Prisma.Decimal | number };
    };
    const criterionMap = new Map<string, CriterionMeta>();
    for (const axis of template.axes) {
      for (const criterion of axis.criteria) {
        criterionMap.set(criterion.id, { criterion, axis });
      }
    }

    // Group scores by axis
    const axisScores = new Map<string, { earned: number; max: number; weight: number }>();
    for (const axis of template.axes) {
      axisScores.set(axis.id, { earned: 0, max: 0, weight: Number(axis.weight) });
    }

    for (const item of dto.criteria) {
      const meta = criterionMap.get(item.criterionId);
      if (!meta || item.notApplicable) continue;

      const maxScore = Number(meta.criterion.maxScore || 5.0);
      const scoreVal = Math.min(Math.max(Number(item.score || 0), 0), maxScore);
      const axisStat = axisScores.get(meta.axis.id);
      if (axisStat) {
        axisStat.earned += scoreVal;
        axisStat.max += maxScore;
      }
    }

    // Compute weighted percentage across axes
    for (const [, stat] of axisScores) {
      if (stat.max > 0) {
        const axisPercentage = (stat.earned / stat.max) * 100;
        totalWeightedScore += (axisPercentage * stat.weight) / 100;
        totalPossibleWeight += stat.weight;
      }
    }

    const percentage = totalPossibleWeight > 0 ? (totalWeightedScore / totalPossibleWeight) * 100 : 0;
    const finalPercentage = Number(percentage.toFixed(2));
    const finalScore = finalPercentage;

    // Derived level
    let level: EvaluationLevel = EvaluationLevel.NEEDS_INTERVENTION;
    if (finalPercentage >= 90) level = EvaluationLevel.EXCELLENT;
    else if (finalPercentage >= 80) level = EvaluationLevel.VERY_GOOD;
    else if (finalPercentage >= 70) level = EvaluationLevel.GOOD;
    else if (finalPercentage >= 60) level = EvaluationLevel.NEEDS_IMPROVEMENT;

    const isSubmitting = dto.status === EvaluationStatus.SUBMITTED;

    return await this.prisma.$transaction(async (tx) => {
      // Delete existing evaluation and criteria evaluations if present
      if (visit.evaluation) {
        await tx.criterionEvaluation.deleteMany({ where: { evaluationId: visit.evaluation.id } });
        await tx.fieldVisitEvaluation.delete({ where: { id: visit.evaluation.id } });
      }

      const evaluation = await tx.fieldVisitEvaluation.create({
        data: {
          visitId,
          templateId,
          templateVersion: template.version,
          templateNameSnapshot: template.name,
          status: dto.status ?? EvaluationStatus.DRAFT,
          totalScore: finalScore,
          maxPossibleScore: 100.0,
          percentage: finalPercentage,
          level,
          strengths: dto.strengths,
          improvementAreas: dto.improvementAreas,
          summary: dto.summary,
          submittedAt: isSubmitting ? new Date() : null,
          clientMutationId: dto.clientMutationId,
          criteriaEvaluations: {
            create: dto.criteria
              .filter((c) => criterionMap.has(c.criterionId))
              .map((c) => {
                const meta = criterionMap.get(c.criterionId)!;
                return {
                  criterionId: c.criterionId,
                  axisNameSnapshot: meta.axis.name,
                  criterionNameSnapshot: meta.criterion.name,
                  maxScoreSnapshot: meta.criterion.maxScore ?? 5.0,
                  weightSnapshot: meta.criterion.weight,
                  score: c.notApplicable ? 0 : Number(c.score || 0),
                  notApplicable: c.notApplicable ?? false,
                  notes: c.notes,
                };
              }),
          },
        },
        include: {
          criteriaEvaluations: true,
        },
      });

      // If submitting, mark field visit completed
      if (isSubmitting) {
        await tx.fieldVisit.update({
          where: { id: visitId },
          data: {
            status: VisitStatus.COMPLETED,
            completedAt: visit.completedAt ?? new Date(),
          },
        });
      }

      await this.audit.record(
        {
          actorUserId: user.id,
          action: isSubmitting ? 'EVALUATION_SUBMITTED' : 'EVALUATION_CREATED',
          entityType: 'FieldVisitEvaluation',
          entityId: evaluation.id,
          after: { score: finalScore, percentage: finalPercentage, level, status: evaluation.status },
          ...context,
        },
        tx,
      );

      return evaluation;
    });
  }

  async createRecommendation(user: AuthenticatedUser, dto: CreateRecommendationDto, context: AuthContext) {
    if (dto.clientMutationId) {
      const existing = await this.prisma.recommendation.findUnique({
        where: { clientMutationId: dto.clientMutationId },
        include: { followUps: true },
      });
      if (existing) return existing;
    }

    if (!(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('Access to this Halaqa is outside your scope');
    }

    const halaqa = await this.prisma.halaqa.findFirst({
      where: { id: dto.halaqaId, forumId: user.forumId },
    });
    if (!halaqa) throw new NotFoundException('Halaqa not found');

    let supervisorId: string;
    if (user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR')) {
      const profile = await this.prisma.supervisorProfile.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!profile) throw new ForbiddenException('Supervisor profile not found');
      supervisorId = profile.id;
    } else {
      const sup = await this.prisma.halaqaSupervisor.findFirst({
        where: { halaqaId: dto.halaqaId, isActive: true, endedAt: null },
      });
      if (!sup) throw new BadRequestException('No supervisor assigned to this Halaqa');
      supervisorId = sup.supervisorId;
    }

    const recommendation = await this.prisma.recommendation.create({
      data: {
        forumId: user.forumId,
        branchId: halaqa.branchId,
        halaqaId: dto.halaqaId,
        teacherId: dto.teacherId,
        supervisorId,
        visitId: dto.visitId,
        title: dto.title,
        description: dto.description,
        domain: dto.domain,
        priority: dto.priority ?? 'MEDIUM',
        status: 'OPEN',
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
        createdById: user.id,
        clientMutationId: dto.clientMutationId,
      },
      include: {
        followUps: true,
        teacher: { include: { user: { select: { displayName: true } } } },
        halaqa: { select: { name: true, code: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'RECOMMENDATION_CREATED',
      entityType: 'Recommendation',
      entityId: recommendation.id,
      after: { title: recommendation.title, priority: recommendation.priority },
      ...context,
    });

    return recommendation;
  }

  async updateRecommendation(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateRecommendationDto,
    context: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessRecommendation(user, id))) {
      throw new ForbiddenException('Access outside your authorized scope');
    }

    const existing = await this.prisma.recommendation.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Recommendation not found');

    const updateData: Prisma.RecommendationUpdateInput = {
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      status: dto.status,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
    };

    if (dto.status === 'COMPLETED' && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    const updated = await this.prisma.recommendation.update({
      where: { id },
      data: updateData,
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'RECOMMENDATION_UPDATED',
      entityType: 'Recommendation',
      entityId: id,
      before: { status: existing.status },
      after: { status: updated.status },
      ...context,
    });

    return updated;
  }

  async addFollowUp(
    user: AuthenticatedUser,
    recommendationId: string,
    dto: CreateRecommendationFollowUpDto,
    context: AuthContext,
  ) {
    if (dto.clientMutationId) {
      const existing = await this.prisma.recommendationFollowUp.findUnique({
        where: { clientMutationId: dto.clientMutationId },
      });
      if (existing) return existing;
    }

    if (!(await this.accessScope.canAccessRecommendation(user, recommendationId))) {
      throw new ForbiddenException('Access outside your authorized scope');
    }

    const rec = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, forumId: user.forumId, deletedAt: null },
    });
    if (!rec) throw new NotFoundException('Recommendation not found');

    return await this.prisma.$transaction(async (tx) => {
      const followUp = await tx.recommendationFollowUp.create({
        data: {
          recommendationId,
          status: dto.status,
          notes: dto.notes,
          createdById: user.id,
          clientMutationId: dto.clientMutationId,
        },
      });

      const recUpdate: Prisma.RecommendationUpdateInput = { status: dto.status };
      if (dto.status === 'COMPLETED' && !rec.completedAt) {
        recUpdate.completedAt = new Date();
      }

      await tx.recommendation.update({
        where: { id: recommendationId },
        data: recUpdate,
      });

      await this.audit.record(
        {
          actorUserId: user.id,
          action: 'RECOMMENDATION_FOLLOWUP_ADDED',
          entityType: 'RecommendationFollowUp',
          entityId: followUp.id,
          after: { recommendationId, status: dto.status, notes: dto.notes },
          ...context,
        },
        tx,
      );

      return followUp;
    });
  }

  async listRecommendations(user: AuthenticatedUser, query: RecommendationQueryDto) {
    const where: Prisma.RecommendationWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (query.status) where.status = query.status;
    if (query.priority) where.priority = query.priority;
    if (query.teacherId) where.teacherId = query.teacherId;
    if (query.halaqaId) where.halaqaId = query.halaqaId;

    if (query.isOverdue) {
      where.dueDate = { lt: new Date() };
      where.status = { notIn: ['COMPLETED', 'CANCELLED'] };
    }

    if (user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR')) {
      const sup = await this.prisma.supervisorProfile.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!sup) return { items: [], total: 0, page: query.page, limit: query.limit };
      where.supervisorId = sup.id;
    } else if (user.roles.some((r) => r.name === 'TEACHER')) {
      const teacher = await this.prisma.teacherProfile.findFirst({
        where: { userId: user.id, deletedAt: null },
      });
      if (!teacher) return { items: [], total: 0, page: query.page, limit: query.limit };
      where.teacherId = teacher.id;
    }

    const [rawItems, total] = await Promise.all([
      this.prisma.recommendation.findMany({
        where,
        include: {
          teacher: {
            include: { user: { select: { displayName: true, username: true } } },
          },
          supervisor: {
            include: { user: { select: { displayName: true, username: true } } },
          },
          halaqa: { select: { name: true, code: true } },
          followUps: { orderBy: { createdAt: 'desc' }, take: 3 },
        },
        ...pageArgs(query),
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
      this.prisma.recommendation.count({ where }),
    ]);

    const now = new Date();
    const items = rawItems.map((item) => ({
      ...item,
      isOverdue:
        item.dueDate !== null &&
        item.dueDate < now &&
        item.status !== 'COMPLETED' &&
        item.status !== 'CANCELLED',
    }));

    return paginated(items, total, query);
  }
}
