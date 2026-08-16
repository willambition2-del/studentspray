import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';
import { AttendanceStatus, EducationalPlanStatus, Prisma } from '../generated/prisma/client';
import {
  CreateMemorizationRecordDto,
  CreateRevisionRecordDto,
  RecitationQueryDto,
} from './dto/recitation.dto';

@Injectable()
export class RecitationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly accessScope: AccessScopeService,
  ) {}

  async createMemorization(
    user: AuthenticatedUser,
    dto: CreateMemorizationRecordDto,
    ctx: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('Cannot record memorization for this halaqa');
    }
    if (!(await this.accessScope.canAccessStudent(user, dto.studentId))) {
      throw new ForbiddenException('Cannot record memorization for this student');
    }

    if (dto.clientMutationId) {
      const existing = await this.prisma.memorizationRecord.findUnique({
        where: { clientMutationId: dto.clientMutationId },
      });
      if (existing) return existing;
    }

    const isMember = await this.prisma.halaqaMember.findFirst({
      where: {
        halaqaId: dto.halaqaId,
        studentId: dto.studentId,
        isActive: true,
      },
    });
    if (!isMember) {
      throw new BadRequestException('Student is not an active member of this halaqa');
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.memorizationRecord.create({
        data: {
          forumId: user.forumId,
          halaqaId: dto.halaqaId,
          studentId: dto.studentId,
          planItemId: dto.planItemId,
          date: new Date(dto.date),
          surahNumber: dto.surahNumber,
          fromAyah: dto.fromAyah,
          toAyah: dto.toAyah,
          pageFrom: dto.pageFrom,
          pageTo: dto.pageTo,
          evaluationScore: dto.evaluationScore ?? 100,
          rating: dto.rating,
          mistakesCount: dto.mistakesCount ?? 0,
          teacherNotes: dto.teacherNotes,
          recordedById: user.id,
          clientMutationId: dto.clientMutationId,
        },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              user: { select: { displayName: true, username: true } },
            },
          },
          halaqa: { select: { id: true, name: true, code: true } },
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'MEMORIZATION_RECORDED',
          entityType: 'MemorizationRecord',
          entityId: record.id,
          after: record,
        },
        tx,
      );

      return record;
    });
  }

  async listMemorization(user: AuthenticatedUser, query: RecitationQueryDto) {
    if (query.halaqaId && !(await this.accessScope.canAccessHalaqa(user, query.halaqaId))) {
      throw new ForbiddenException('Cannot access requested halaqa memorization');
    }
    if (query.studentId && !(await this.accessScope.canAccessStudent(user, query.studentId))) {
      throw new ForbiddenException('Cannot access requested student memorization');
    }

    const where: Prisma.MemorizationRecordWhereInput = {
      forumId: user.forumId,
      ...(query.halaqaId ? { halaqaId: query.halaqaId } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.rating ? { rating: query.rating } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.memorizationRecord.findMany({
        where,
        ...pageArgs(query),
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              user: { select: { displayName: true, username: true } },
            },
          },
          halaqa: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.memorizationRecord.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async createRevision(
    user: AuthenticatedUser,
    dto: CreateRevisionRecordDto,
    ctx: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('Cannot record revision for this halaqa');
    }
    if (!(await this.accessScope.canAccessStudent(user, dto.studentId))) {
      throw new ForbiddenException('Cannot record revision for this student');
    }

    if (dto.clientMutationId) {
      const existing = await this.prisma.revisionRecord.findUnique({
        where: { clientMutationId: dto.clientMutationId },
      });
      if (existing) return existing;
    }

    const isMember = await this.prisma.halaqaMember.findFirst({
      where: {
        halaqaId: dto.halaqaId,
        studentId: dto.studentId,
        isActive: true,
      },
    });
    if (!isMember) {
      throw new BadRequestException('Student is not an active member of this halaqa');
    }

    return this.prisma.$transaction(async (tx) => {
      const record = await tx.revisionRecord.create({
        data: {
          forumId: user.forumId,
          halaqaId: dto.halaqaId,
          studentId: dto.studentId,
          planItemId: dto.planItemId,
          date: new Date(dto.date),
          surahNumber: dto.surahNumber,
          fromAyah: dto.fromAyah,
          toAyah: dto.toAyah,
          pageFrom: dto.pageFrom,
          pageTo: dto.pageTo,
          juzNumber: dto.juzNumber,
          evaluationScore: dto.evaluationScore ?? 100,
          rating: dto.rating,
          mistakesCount: dto.mistakesCount ?? 0,
          teacherNotes: dto.teacherNotes,
          recordedById: user.id,
          clientMutationId: dto.clientMutationId,
        },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              user: { select: { displayName: true, username: true } },
            },
          },
          halaqa: { select: { id: true, name: true, code: true } },
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'REVISION_RECORDED',
          entityType: 'RevisionRecord',
          entityId: record.id,
          after: record,
        },
        tx,
      );

      return record;
    });
  }

  async listRevision(user: AuthenticatedUser, query: RecitationQueryDto) {
    if (query.halaqaId && !(await this.accessScope.canAccessHalaqa(user, query.halaqaId))) {
      throw new ForbiddenException('Cannot access requested halaqa revision');
    }
    if (query.studentId && !(await this.accessScope.canAccessStudent(user, query.studentId))) {
      throw new ForbiddenException('Cannot access requested student revision');
    }

    const where: Prisma.RevisionRecordWhereInput = {
      forumId: user.forumId,
      ...(query.halaqaId ? { halaqaId: query.halaqaId } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.rating ? { rating: query.rating } : {}),
      ...(query.dateFrom || query.dateTo
        ? {
            date: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.revisionRecord.findMany({
        where,
        ...pageArgs(query),
        orderBy: { date: 'desc' },
        include: {
          student: {
            select: {
              id: true,
              studentNumber: true,
              user: { select: { displayName: true, username: true } },
            },
          },
          halaqa: { select: { id: true, name: true, code: true } },
        },
      }),
      this.prisma.revisionRecord.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async getStudentProgress(user: AuthenticatedUser, studentId: string) {
    if (!(await this.accessScope.canAccessStudent(user, studentId))) {
      throw new ForbiddenException('Cannot access progress for this student');
    }

    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        deletedAt: null,
        user: { forumId: user.forumId },
      },
      include: {
        user: { select: { displayName: true, username: true, email: true, phone: true } },
        halaqaMemberships: {
          where: { isActive: true },
          include: {
            halaqa: {
              select: {
                id: true,
                name: true,
                code: true,
                branch: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });
    if (!student) throw new NotFoundException('Student profile not found');

    const activeHalaqa = student.halaqaMemberships[0]?.halaqa;

    // Fetch active educational plan (student specific or halaqa plan)
    const activePlan = await this.prisma.educationalPlan.findFirst({
      where: {
        forumId: user.forumId,
        status: EducationalPlanStatus.ACTIVE,
        deletedAt: null,
        OR: [
          { studentId },
          ...(activeHalaqa ? [{ halaqaId: activeHalaqa.id, studentId: null }] : []),
        ],
      },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    // Recitation metrics
    const [
      recentMemorization,
      recentRevision,
      attendanceRecords,
      memoStats,
      revStats,
    ] = await Promise.all([
      this.prisma.memorizationRecord.findMany({
        where: { studentId, forumId: user.forumId },
        take: 5,
        orderBy: { date: 'desc' },
      }),
      this.prisma.revisionRecord.findMany({
        where: { studentId, forumId: user.forumId },
        take: 5,
        orderBy: { date: 'desc' },
      }),
      this.prisma.attendanceRecord.findMany({
        where: { studentId, session: { forumId: user.forumId } },
        select: { status: true },
      }),
      this.prisma.memorizationRecord.aggregate({
        where: { studentId, forumId: user.forumId },
        _avg: { evaluationScore: true },
        _count: { id: true },
      }),
      this.prisma.revisionRecord.aggregate({
        where: { studentId, forumId: user.forumId },
        _avg: { evaluationScore: true },
        _count: { id: true },
      }),
    ]);

    // Calculate attendance summary
    let present = 0;
    let late = 0;
    for (const att of attendanceRecords) {
      if (att.status === AttendanceStatus.PRESENT) present++;
      else if (att.status === AttendanceStatus.LATE) late++;
    }
    const attendancePercentage =
      attendanceRecords.length > 0
        ? Math.round(((present + late) / attendanceRecords.length) * 100)
        : 100;

    // Calculate plan progress
    let planProgress = 0;
    if (activePlan && activePlan.items.length > 0) {
      const completedItems = activePlan.items.filter((i) => i.status === 'COMPLETED').length;
      planProgress = Math.round((completedItems / activePlan.items.length) * 100);
    }

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        displayName: student.user.displayName,
        username: student.user.username,
        activeHalaqa: activeHalaqa
          ? {
              id: activeHalaqa.id,
              name: activeHalaqa.name,
              branchName: activeHalaqa.branch.name,
            }
          : null,
      },
      activePlan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            type: activePlan.type,
            progressPercentage: planProgress,
            totalItems: activePlan.items.length,
            items: activePlan.items,
          }
        : null,
      metrics: {
        attendanceRate: attendancePercentage,
        totalAttendanceDays: attendanceRecords.length,
        totalMemorizationSessions: memoStats._count.id,
        avgMemorizationScore: Number(memoStats._avg.evaluationScore || 100),
        totalRevisionSessions: revStats._count.id,
        avgRevisionScore: Number(revStats._avg.evaluationScore || 100),
      },
      recentMemorization,
      recentRevision,
    };
  }
}
