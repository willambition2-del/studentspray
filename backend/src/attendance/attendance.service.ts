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
import { AttendanceStatus, NotificationType, Prisma } from '../generated/prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AttendanceQueryDto,
  CreateAttendanceSessionDto,
  UpdateAttendanceRecordsDto,
} from './dto/attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly accessScope: AccessScopeService,
    private readonly notifications: NotificationsService,
  ) {}

  async createOrUpdateSession(
    user: AuthenticatedUser,
    halaqaId: string,
    dto: CreateAttendanceSessionDto,
    ctx: AuthContext,
  ) {
    if (!(await this.accessScope.canAccessHalaqa(user, halaqaId))) {
      throw new ForbiddenException('Cannot record attendance for this halaqa');
    }

    const halaqa = await this.prisma.halaqa.findFirst({
      where: { id: halaqaId, forumId: user.forumId, deletedAt: null },
    });
    if (!halaqa) throw new NotFoundException('Halaqa not found');

    const sessionDate = new Date(dto.sessionDate);

    // Validate students enrolled in halaqa
    if (dto.records && dto.records.length > 0) {
      const studentIds = dto.records.map((r) => r.studentId);
      const activeMembers = await this.prisma.halaqaMember.findMany({
        where: {
          halaqaId,
          studentId: { in: studentIds },
          isActive: true,
        },
        select: { studentId: true },
      });
      const validStudentIds = new Set(activeMembers.map((m) => m.studentId));
      for (const record of dto.records) {
        if (!validStudentIds.has(record.studentId)) {
          throw new BadRequestException(
            `Student ${record.studentId} is not an active member of this halaqa`,
          );
        }
      }
    }

    const sessionResult = await this.prisma.$transaction(async (tx) => {
      let session = await tx.attendanceSession.findUnique({
        where: { halaqaId_sessionDate: { halaqaId, sessionDate } },
      });

      if (session) {
        session = await tx.attendanceSession.update({
          where: { id: session.id },
          data: {
            status: dto.status ?? session.status,
            notes: dto.notes ?? session.notes,
            recordedById: user.id,
          },
        });
      } else {
        session = await tx.attendanceSession.create({
          data: {
            forumId: user.forumId,
            halaqaId,
            sessionDate,
            status: dto.status,
            notes: dto.notes,
            recordedById: user.id,
          },
        });
      }

      if (dto.records && dto.records.length > 0) {
        for (const record of dto.records) {
          await tx.attendanceRecord.upsert({
            where: {
              sessionId_studentId: {
                sessionId: session.id,
                studentId: record.studentId,
              },
            },
            update: {
              status: record.status,
              notes: record.notes,
              recordedById: user.id,
              recordedAt: new Date(),
            },
            create: {
              sessionId: session.id,
              studentId: record.studentId,
              status: record.status,
              notes: record.notes,
              recordedById: user.id,
            },
          });
        }
      }

      const result = await tx.attendanceSession.findUnique({
        where: { id: session.id },
        include: {
          records: {
            include: {
              student: {
                select: {
                  id: true,
                  studentNumber: true,
                  user: { select: { displayName: true, username: true } },
                },
              },
            },
          },
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'ATTENDANCE_RECORDED',
          entityType: 'AttendanceSession',
          entityId: result?.id,
          after: result,
        },
        tx,
      );

      return result;
    });

    // Notify parents for absent students
    const absentIds = (dto.records || [])
      .filter((r) => r.status === AttendanceStatus.ABSENT)
      .map((r) => r.studentId);
    if (absentIds.length > 0) {
      this.sendAbsenceNotifications(absentIds, halaqaId, sessionDate).catch(() => {});
    }

    return sessionResult;
  }

  async updateSessionRecords(
    user: AuthenticatedUser,
    sessionId: string,
    dto: UpdateAttendanceRecordsDto,
    ctx: AuthContext,
  ) {
    const session = await this.prisma.attendanceSession.findFirst({
      where: { id: sessionId, forumId: user.forumId },
    });
    if (!session) throw new NotFoundException('Attendance session not found');

    if (!(await this.accessScope.canAccessHalaqa(user, session.halaqaId))) {
      throw new ForbiddenException('Cannot edit attendance for this halaqa');
    }

    const sessionResult = await this.prisma.$transaction(async (tx) => {
      for (const record of dto.records) {
        await tx.attendanceRecord.upsert({
          where: {
            sessionId_studentId: {
              sessionId: session.id,
              studentId: record.studentId,
            },
          },
          update: {
            status: record.status,
            notes: record.notes,
            recordedById: user.id,
            recordedAt: new Date(),
          },
          create: {
            sessionId: session.id,
            studentId: record.studentId,
            status: record.status,
            notes: record.notes,
            recordedById: user.id,
          },
        });
      }

      const updated = await tx.attendanceSession.findUnique({
        where: { id: sessionId },
        include: {
          records: {
            include: {
              student: {
                select: {
                  id: true,
                  studentNumber: true,
                  user: { select: { displayName: true, username: true } },
                },
              },
            },
          },
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'ATTENDANCE_UPDATED',
          entityType: 'AttendanceSession',
          entityId: sessionId,
          after: updated,
        },
        tx,
      );

      return updated;
    });

    const absentIds = (dto.records || [])
      .filter((r) => r.status === AttendanceStatus.ABSENT)
      .map((r) => r.studentId);
    if (absentIds.length > 0) {
      this.sendAbsenceNotifications(absentIds, session.halaqaId, session.sessionDate).catch(() => {});
    }

    return sessionResult;
  }

  async getHalaqaAttendance(
    user: AuthenticatedUser,
    halaqaId: string,
    query: AttendanceQueryDto,
  ) {
    if (!(await this.accessScope.canAccessHalaqa(user, halaqaId))) {
      throw new ForbiddenException('Cannot access attendance for this halaqa');
    }

    const where: Prisma.AttendanceSessionWhereInput = {
      halaqaId,
      forumId: user.forumId,
      ...(query.dateFrom || query.dateTo
        ? {
            sessionDate: {
              ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
              ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendanceSession.findMany({
        where,
        ...pageArgs(query),
        orderBy: { sessionDate: 'desc' },
        include: {
          records: {
            where: query.status ? { status: query.status } : {},
            include: {
              student: {
                select: {
                  id: true,
                  studentNumber: true,
                  user: { select: { displayName: true, username: true } },
                },
              },
            },
          },
        },
      }),
      this.prisma.attendanceSession.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async getStudentAttendance(
    user: AuthenticatedUser,
    studentId: string,
    query: AttendanceQueryDto,
  ) {
    if (!(await this.accessScope.canAccessStudent(user, studentId))) {
      throw new ForbiddenException('Cannot access attendance for this student');
    }

    const where: Prisma.AttendanceRecordWhereInput = {
      studentId,
      session: {
        forumId: user.forumId,
        ...(query.dateFrom || query.dateTo
          ? {
              sessionDate: {
                ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
                ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
              },
            }
          : {}),
      },
      ...(query.status ? { status: query.status } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        ...pageArgs(query),
        orderBy: { recordedAt: 'desc' },
        include: {
          session: {
            select: {
              id: true,
              sessionDate: true,
              halaqa: { select: { id: true, name: true, code: true } },
            },
          },
        },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async getHalaqaSummary(user: AuthenticatedUser, halaqaId: string) {
    if (!(await this.accessScope.canAccessHalaqa(user, halaqaId))) {
      throw new ForbiddenException('Cannot access summary for this halaqa');
    }

    const sessions = await this.prisma.attendanceSession.findMany({
      where: { halaqaId, forumId: user.forumId },
      include: { records: { select: { status: true } } },
    });

    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const session of sessions) {
      for (const record of session.records) {
        if (record.status === AttendanceStatus.PRESENT) present++;
        else if (record.status === AttendanceStatus.ABSENT) absent++;
        else if (record.status === AttendanceStatus.LATE) late++;
        else if (record.status === AttendanceStatus.EXCUSED) excused++;
      }
    }

    const totalRecords = present + absent + late + excused;
    const attendanceRate = totalRecords > 0 ? Math.round(((present + late) / totalRecords) * 100) : 100;

    return {
      halaqaId,
      totalSessions: sessions.length,
      totalRecords,
      present,
      absent,
      late,
      excused,
      attendanceRate,
    };
  }

  private async sendAbsenceNotifications(studentIds: string[], halaqaId: string, sessionDate: Date) {
    try {
      const studentsWithGuardians = await this.prisma.studentProfile.findMany({
        where: { id: { in: studentIds } },
        include: {
          user: { select: { displayName: true, username: true } },
          guardians: {
            where: { receivesAcademicReports: true },
            include: { parent: { include: { user: { select: { id: true } } } } },
          },
        },
      });

      const halaqa = await this.prisma.halaqa.findUnique({
        where: { id: halaqaId },
        select: { name: true },
      });

      const dateStr = sessionDate instanceof Date ? sessionDate.toISOString().split('T')[0] : String(sessionDate);

      for (const stu of studentsWithGuardians) {
        const studentName = stu.user?.displayName || stu.user?.username || 'الطالب';
        for (const g of stu.guardians) {
          if (g.parent?.user?.id) {
            await this.notifications.createNotification({
              userId: g.parent.user.id,
              type: NotificationType.ATTENDANCE,
              title: 'إشعار غياب عن الحلقة',
              body: `نحيطكم علماً بغياب الطالب (${studentName}) عن حلقة ${halaqa?.name ?? ''} بتاريخ ${dateStr}.`,
              data: {
                type: 'ATTENDANCE',
                studentId: stu.id,
                halaqaId,
                sessionDate: dateStr,
              },
            });
          }
        }
      }
    } catch {
      // Non-blocking notification failure
    }
  }
}
