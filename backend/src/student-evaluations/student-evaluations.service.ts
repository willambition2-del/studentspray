import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import {
  CreateStudentEvaluationDto,
  StudentEvaluationQueryDto,
  UpdateStudentEvaluationDto,
} from './dto/student-evaluation.dto';
import { Prisma, StudentEvaluationRating } from '../generated/prisma/client';

@Injectable()
export class StudentEvaluationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScope: AccessScopeService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateStudentEvaluationDto, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('Cannot record evaluation for unauthorized halaqa');
    }
    if (!(await this.accessScope.canAccessStudent(user, dto.studentId))) {
      throw new ForbiddenException('Cannot record evaluation for unauthorized student');
    }

    // Determine derived rating if overallScore is provided and rating not explicit
    let rating = dto.rating ?? StudentEvaluationRating.VERY_GOOD;
    if (dto.overallScore !== undefined) {
      if (dto.overallScore >= 95) rating = StudentEvaluationRating.EXCELLENT;
      else if (dto.overallScore >= 85) rating = StudentEvaluationRating.VERY_GOOD;
      else if (dto.overallScore >= 75) rating = StudentEvaluationRating.GOOD;
      else if (dto.overallScore >= 60) rating = StudentEvaluationRating.ACCEPTABLE;
      else rating = StudentEvaluationRating.NEEDS_IMPROVEMENT;
    }

    const evaluation = await this.prisma.$transaction(async (tx) => {
      const created = await tx.studentEvaluation.create({
        data: {
          forumId: user.forumId,
          studentId: dto.studentId,
          halaqaId: dto.halaqaId,
          academicYearId: dto.academicYearId,
          termId: dto.termId,
          evaluationDate: new Date(dto.evaluationDate),
          period: dto.period,
          behaviorScore: dto.behaviorScore,
          discipline: dto.discipline,
          participation: dto.participation,
          overallScore: dto.overallScore,
          rating,
          teacherNotes: dto.teacherNotes,
          actionLabel: dto.actionLabel,
          isPublished: dto.isPublished ?? true,
          publishedAt: dto.isPublished !== false ? new Date() : null,
          evaluatorId: user.id,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'STUDENT_EVALUATION_CREATED',
          entityType: 'StudentEvaluation',
          entityId: created.id,
          after: { studentId: created.studentId, rating: created.rating, overallScore: created.overallScore },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return created;
    });

    return evaluation;
  }

  async findAll(user: AuthenticatedUser, query: StudentEvaluationQueryDto) {
    const where: Prisma.StudentEvaluationWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (query.halaqaId) {
      if (!(await this.accessScope.canAccessHalaqa(user, query.halaqaId))) {
        throw new ForbiddenException('Halaqa access denied');
      }
      where.halaqaId = query.halaqaId;
    } else if (user.roles.some((r) => r.name === 'TEACHER')) {
      const teacherHalaqas = await this.accessScope.getTeacherHalaqaIds(user);
      where.halaqaId = { in: teacherHalaqas };
    } else if (user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR')) {
      const supHalaqas = await this.accessScope.getSupervisorHalaqaIds(user);
      where.halaqaId = { in: supHalaqas };
    }

    if (query.studentId) {
      if (!(await this.accessScope.canAccessStudent(user, query.studentId))) {
        throw new ForbiddenException('Student access denied');
      }
      where.studentId = query.studentId;
    }

    if (query.termId) where.termId = query.termId;
    if (query.rating) where.rating = query.rating;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;

    // Student & Parent only see published evaluations
    if (user.roles.some((r) => r.name === 'STUDENT' || r.name === 'PARENT')) {
      where.isPublished = true;
    }

    const evaluations = await this.prisma.studentEvaluation.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
          },
        },
        halaqa: { select: { id: true, name: true, code: true } },
        evaluator: { select: { id: true, displayName: true, username: true } },
      },
      orderBy: { evaluationDate: 'desc' },
    });

    return evaluations.map((e) => ({
      ...e,
      behaviorScore: e.behaviorScore ? Number(e.behaviorScore) : null,
      discipline: e.discipline ? Number(e.discipline) : null,
      participation: e.participation ? Number(e.participation) : null,
      overallScore: e.overallScore ? Number(e.overallScore) : null,
      studentName: e.student.user.displayName || e.student.user.username,
      halaqaName: e.halaqa.name,
      evaluatorName: e.evaluator?.displayName || e.evaluator?.username,
    }));
  }

  async findOne(user: AuthenticatedUser, id: string) {
    if (!(await this.accessScope.canAccessStudentEvaluation(user, id))) {
      throw new ForbiddenException('Evaluation access denied');
    }

    const evaluation = await this.prisma.studentEvaluation.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        student: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
          },
        },
        halaqa: { select: { id: true, name: true, code: true } },
        evaluator: { select: { id: true, displayName: true, username: true } },
      },
    });

    if (!evaluation) {
      throw new NotFoundException('Evaluation not found');
    }

    return {
      ...evaluation,
      behaviorScore: evaluation.behaviorScore ? Number(evaluation.behaviorScore) : null,
      discipline: evaluation.discipline ? Number(evaluation.discipline) : null,
      participation: evaluation.participation ? Number(evaluation.participation) : null,
      overallScore: evaluation.overallScore ? Number(evaluation.overallScore) : null,
      studentName: evaluation.student.user.displayName || evaluation.student.user.username,
      halaqaName: evaluation.halaqa.name,
      evaluatorName: evaluation.evaluator?.displayName || evaluation.evaluator?.username,
    };
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateStudentEvaluationDto, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessStudentEvaluation(user, id))) {
      throw new ForbiddenException('Evaluation access denied');
    }

    const existing = await this.prisma.studentEvaluation.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Evaluation not found');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.studentEvaluation.update({
        where: { id },
        data: {
          evaluationDate: dto.evaluationDate ? new Date(dto.evaluationDate) : undefined,
          period: dto.period,
          behaviorScore: dto.behaviorScore,
          discipline: dto.discipline,
          participation: dto.participation,
          overallScore: dto.overallScore,
          rating: dto.rating,
          teacherNotes: dto.teacherNotes,
          actionLabel: dto.actionLabel,
          isPublished: dto.isPublished,
          publishedAt: dto.isPublished ? (existing.publishedAt ?? new Date()) : null,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'STUDENT_EVALUATION_UPDATED',
          entityType: 'StudentEvaluation',
          entityId: id,
          before: { rating: existing.rating, overallScore: Number(existing.overallScore) },
          after: { rating: res.rating, overallScore: Number(res.overallScore) },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return res;
    });

    return {
      ...updated,
      behaviorScore: updated.behaviorScore ? Number(updated.behaviorScore) : null,
      discipline: updated.discipline ? Number(updated.discipline) : null,
      participation: updated.participation ? Number(updated.participation) : null,
      overallScore: updated.overallScore ? Number(updated.overallScore) : null,
    };
  }

  async remove(user: AuthenticatedUser, id: string, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessStudentEvaluation(user, id))) {
      throw new ForbiddenException('Evaluation access denied');
    }

    const existing = await this.prisma.studentEvaluation.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Evaluation not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.studentEvaluation.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'STUDENT_EVALUATION_DELETED',
          entityType: 'StudentEvaluation',
          entityId: id,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });
    });

    return { success: true };
  }
}
