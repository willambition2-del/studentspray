import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import {
  BulkGradeExamDto,
  CreateExamDto,
  ExamQueryDto,
  PublishExamDto,
  UpdateExamDto,
  UpdateExamResultDto,
} from './dto/exam.dto';
import { ExamResultStatus, ExamStatus, Prisma } from '../generated/prisma/client';

@Injectable()
export class ExamsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScope: AccessScopeService,
  ) {}

  async create(user: AuthenticatedUser, dto: CreateExamDto, ctx: AuthContext) {
    if (dto.branchId && !(await this.accessScope.canAccessBranch(user, dto.branchId))) {
      throw new ForbiddenException('Cannot create exam outside authorized branch scope');
    }
    if (dto.halaqaId && !(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('Cannot create exam for unauthorized halaqa');
    }

    const branchId = dto.branchId || user.branchId;
    const maxScore = dto.maxScore ?? 100;
    const passScore = dto.passScore ?? 60;

    if (passScore > maxScore) {
      throw new BadRequestException('Pass score cannot exceed maximum score');
    }

    const exam = await this.prisma.$transaction(async (tx) => {
      const created = await tx.exam.create({
        data: {
          forumId: user.forumId,
          branchId,
          academicYearId: dto.academicYearId,
          termId: dto.termId,
          halaqaId: dto.halaqaId,
          title: dto.title,
          description: dto.description,
          curriculum: dto.curriculum,
          examType: dto.examType,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
          maxScore,
          passScore,
          status: dto.status ?? ExamStatus.DRAFT,
          createdById: user.id,
          criteria: dto.criteria && dto.criteria.length > 0
            ? {
                create: dto.criteria.map((c, idx) => ({
                  name: c.name,
                  description: c.description,
                  maxScore: c.maxScore,
                  order: c.order ?? idx + 1,
                })),
              }
            : undefined,
        },
        include: { criteria: { orderBy: { order: 'asc' } } },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'EXAM_CREATED',
          entityType: 'Exam',
          entityId: created.id,
          after: { title: created.title, examType: created.examType, maxScore },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return created;
    });

    return exam;
  }

  async findAll(user: AuthenticatedUser, query: ExamQueryDto) {
    const where: Prisma.ExamWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };

    if (query.branchId) {
      if (!(await this.accessScope.canAccessBranch(user, query.branchId))) {
        throw new ForbiddenException('Branch access denied');
      }
      where.branchId = query.branchId;
    } else if (user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER') && user.branchId) {
      where.branchId = user.branchId;
    }

    if (query.halaqaId) {
      if (!(await this.accessScope.canAccessHalaqa(user, query.halaqaId))) {
        throw new ForbiddenException('Halaqa access denied');
      }
      where.halaqaId = query.halaqaId;
    } else if (user.roles.some((r) => r.name === 'TEACHER')) {
      const teacherHalaqaIds = await this.accessScope.getTeacherHalaqaIds(user);
      where.OR = [{ halaqaId: { in: teacherHalaqaIds } }, { halaqaId: null }];
    } else if (user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR')) {
      const supervisorHalaqaIds = await this.accessScope.getSupervisorHalaqaIds(user);
      where.OR = [{ halaqaId: { in: supervisorHalaqaIds } }, { halaqaId: null }];
    }

    if (query.academicYearId) where.academicYearId = query.academicYearId;
    if (query.termId) where.termId = query.termId;
    if (query.examType) where.examType = query.examType;
    if (query.status) where.status = query.status;
    if (query.isPublished !== undefined) where.isPublished = query.isPublished;
    if (query.search) {
      where.title = { contains: query.search, mode: 'insensitive' };
    }

    // Students and Parents only see published exams
    if (user.roles.some((r) => r.name === 'STUDENT' || r.name === 'PARENT')) {
      where.isPublished = true;
    }

    const exams = await this.prisma.exam.findMany({
      where,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        halaqa: { select: { id: true, name: true, code: true } },
        criteria: { orderBy: { order: 'asc' } },
        _count: { select: { results: true } },
      },
      orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
    });

    return exams.map((e) => ({
      ...e,
      maxScore: Number(e.maxScore),
      passScore: Number(e.passScore),
      resultsCount: e._count.results,
    }));
  }

  async findOne(user: AuthenticatedUser, id: string) {
    if (!(await this.accessScope.canAccessExam(user, id))) {
      throw new ForbiddenException('Exam access denied');
    }

    const exam = await this.prisma.exam.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        halaqa: { select: { id: true, name: true, code: true } },
        academicYear: { select: { id: true, name: true } },
        term: { select: { id: true, name: true } },
        criteria: { orderBy: { order: 'asc' } },
        _count: { select: { results: true } },
      },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    return {
      ...exam,
      maxScore: Number(exam.maxScore),
      passScore: Number(exam.passScore),
      resultsCount: exam._count.results,
    };
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateExamDto, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessExam(user, id))) {
      throw new ForbiddenException('Exam access denied');
    }

    const existing = await this.prisma.exam.findUnique({
      where: { id },
      include: { criteria: true },
    });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Exam not found');
    }

    const maxScore = dto.maxScore ?? Number(existing.maxScore);
    const passScore = dto.passScore ?? Number(existing.passScore);
    if (passScore > maxScore) {
      throw new BadRequestException('Pass score cannot exceed maximum score');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.criteria) {
        await tx.examCriterion.deleteMany({ where: { examId: id } });
        await tx.examCriterion.createMany({
          data: dto.criteria.map((c, idx) => ({
            examId: id,
            name: c.name,
            description: c.description,
            maxScore: c.maxScore,
            order: c.order ?? idx + 1,
          })),
        });
      }

      const res = await tx.exam.update({
        where: { id },
        data: {
          title: dto.title,
          description: dto.description,
          curriculum: dto.curriculum,
          examType: dto.examType,
          scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : undefined,
          maxScore: dto.maxScore,
          passScore: dto.passScore,
          status: dto.status,
          branchId: dto.branchId,
          halaqaId: dto.halaqaId,
          academicYearId: dto.academicYearId,
          termId: dto.termId,
        },
        include: { criteria: { orderBy: { order: 'asc' } } },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'EXAM_UPDATED',
          entityType: 'Exam',
          entityId: id,
          before: { title: existing.title, status: existing.status },
          after: { title: res.title, status: res.status },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return res;
    });

    return updated;
  }

  async remove(user: AuthenticatedUser, id: string, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessExam(user, id))) {
      throw new ForbiddenException('Exam access denied');
    }

    const existing = await this.prisma.exam.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new NotFoundException('Exam not found');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.exam.update({
        where: { id },
        data: { deletedAt: new Date(), status: ExamStatus.ARCHIVED },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'EXAM_ARCHIVED',
          entityType: 'Exam',
          entityId: id,
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });
    });

    return { success: true };
  }

  async publish(user: AuthenticatedUser, id: string, dto: PublishExamDto, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessExam(user, id))) {
      throw new ForbiddenException('Exam access denied');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id } });
    if (!exam || exam.deletedAt) {
      throw new NotFoundException('Exam not found');
    }

    const publishedAt = dto.isPublished ? new Date() : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const e = await tx.exam.update({
        where: { id },
        data: {
          isPublished: dto.isPublished,
          publishedAt,
          status: dto.isPublished ? ExamStatus.PUBLISHED : ExamStatus.COMPLETED,
        },
      });

      // Update all results publication status
      await tx.examResult.updateMany({
        where: { examId: id },
        data: {
          isPublished: dto.isPublished,
          publishedAt,
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: dto.isPublished ? 'EXAM_RESULTS_PUBLISHED' : 'EXAM_RESULTS_UNPUBLISHED',
          entityType: 'Exam',
          entityId: id,
          after: { isPublished: dto.isPublished, publishedAt },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return e;
    });

    return {
      id: updated.id,
      isPublished: updated.isPublished,
      publishedAt: updated.publishedAt,
      status: updated.status,
    };
  }

  async getResults(user: AuthenticatedUser, examId: string) {
    if (!(await this.accessScope.canAccessExam(user, examId))) {
      throw new ForbiddenException('Exam access denied');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { criteria: true },
    });
    if (!exam || exam.deletedAt) {
      throw new NotFoundException('Exam not found');
    }

    const results = await this.prisma.examResult.findMany({
      where: { examId, deletedAt: null },
      include: {
        student: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
            halaqaMemberships: {
              where: { isActive: true },
              include: { halaqa: { select: { id: true, name: true } } },
            },
          },
        },
        grader: { select: { displayName: true, username: true } },
      },
      orderBy: { score: 'desc' },
    });

    return results.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      studentName: r.student.user.displayName || r.student.user.username,
      halaqaName: r.student.halaqaMemberships[0]?.halaqa.name || 'غير محدد',
      score: Number(r.score),
      percentage: Number(r.percentage),
      status: r.status,
      isPassed: r.isPassed,
      notes: r.notes,
      criterionScores: r.criterionScores,
      isPublished: r.isPublished,
      gradedBy: r.grader?.displayName || r.grader?.username,
      gradedAt: r.gradedAt,
      createdAt: r.createdAt,
    }));
  }

  async bulkGrade(user: AuthenticatedUser, examId: string, dto: BulkGradeExamDto, ctx: AuthContext) {
    if (!(await this.accessScope.canAccessExam(user, examId))) {
      throw new ForbiddenException('Exam access denied');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { criteria: true },
    });
    if (!exam || exam.deletedAt) {
      throw new NotFoundException('Exam not found');
    }

    const maxScore = Number(exam.maxScore);
    const passScore = Number(exam.passScore);

    // Validate scores and students
    for (const item of dto.results) {
      if (item.score > maxScore) {
        throw new BadRequestException(
          `Student score ${item.score} cannot exceed exam maximum score of ${maxScore}`,
        );
      }
      if (!(await this.accessScope.canAccessStudent(user, item.studentId))) {
        throw new ForbiddenException(`Cannot grade student outside authorized scope: ${item.studentId}`);
      }
    }

    const savedResults = await this.prisma.$transaction(async (tx) => {
      const records = [];
      for (const item of dto.results) {
        const score = Number(item.score);
        const percentage = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;
        const isPassed = score >= passScore;
        const status = item.status ?? (isPassed ? ExamResultStatus.PASSED : ExamResultStatus.FAILED);

        const upserted = await tx.examResult.upsert({
          where: { examId_studentId: { examId, studentId: item.studentId } },
          update: {
            score,
            percentage,
            status,
            isPassed,
            notes: item.notes,
            criterionScores: item.criterionScores ?? undefined,
            gradedById: user.id,
            gradedAt: new Date(),
            isPublished: exam.isPublished,
            publishedAt: exam.publishedAt,
          },
          create: {
            examId,
            studentId: item.studentId,
            score,
            percentage,
            status,
            isPassed,
            notes: item.notes,
            criterionScores: item.criterionScores ?? undefined,
            gradedById: user.id,
            gradedAt: new Date(),
            isPublished: exam.isPublished,
            publishedAt: exam.publishedAt,
          },
        });
        records.push(upserted);
      }

      await tx.exam.update({
        where: { id: examId },
        data: { status: exam.status === ExamStatus.DRAFT ? ExamStatus.OPEN : exam.status },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'EXAM_RESULTS_SAVED',
          entityType: 'Exam',
          entityId: examId,
          after: { totalGraded: dto.results.length },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return records;
    });

    return {
      success: true,
      count: savedResults.length,
      examId,
    };
  }

  async updateSingleResult(
    user: AuthenticatedUser,
    examId: string,
    resultId: string,
    dto: UpdateExamResultDto,
    ctx: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessExamResult(user, resultId))) {
      throw new ForbiddenException('Exam result access denied');
    }

    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) throw new NotFoundException('Exam not found');

    const existing = await this.prisma.examResult.findUnique({ where: { id: resultId } });
    if (!existing) throw new NotFoundException('Exam result not found');

    const maxScore = Number(exam.maxScore);
    const passScore = Number(exam.passScore);

    if (dto.score > maxScore) {
      throw new BadRequestException(`Score cannot exceed exam max score of ${maxScore}`);
    }

    const percentage = maxScore > 0 ? Number(((dto.score / maxScore) * 100).toFixed(2)) : 0;
    const isPassed = dto.score >= passScore;
    const status = dto.status ?? (isPassed ? ExamResultStatus.PASSED : ExamResultStatus.FAILED);

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.examResult.update({
        where: { id: resultId },
        data: {
          score: dto.score,
          percentage,
          status,
          isPassed,
          notes: dto.notes,
          criterionScores: dto.criterionScores ?? undefined,
          gradedById: user.id,
          gradedAt: new Date(),
        },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          action: 'EXAM_RESULT_UPDATED',
          entityType: 'ExamResult',
          entityId: resultId,
          before: { score: Number(existing.score), percentage: Number(existing.percentage) },
          after: { score: dto.score, percentage, correctionReason: dto.correctionReason },
          metadata: { reason: dto.correctionReason },
          ipAddress: ctx.ipAddress,
          userAgent: ctx.userAgent,
          requestId: ctx.requestId,
        },
      });

      return res;
    });

    return {
      ...updated,
      score: Number(updated.score),
      percentage: Number(updated.percentage),
    };
  }
}
