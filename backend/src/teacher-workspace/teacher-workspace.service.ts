import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { EducationalPlanStatus } from '../generated/prisma/client';

@Injectable()
export class TeacherWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScope: AccessScopeService,
  ) {}

  async getMyHalaqas(user: AuthenticatedUser) {
    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId: user.id },
    });

    // If General Manager / Executive Manager is inspecting teacher workspace:
    if (!teacherProfile) {
      return this.prisma.halaqa.findMany({
        where: { forumId: user.forumId, isActive: true, deletedAt: null },
        include: {
          branch: { select: { id: true, name: true } },
          _count: { select: { members: { where: { isActive: true } } } },
        },
      });
    }

    const assignments = await this.prisma.halaqaTeacher.findMany({
      where: {
        teacherId: teacherProfile.id,
        isActive: true,
        endedAt: null,
        halaqa: { forumId: user.forumId, isActive: true, deletedAt: null },
      },
      include: {
        halaqa: {
          include: {
            branch: { select: { id: true, name: true } },
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
      },
    });

    return assignments.map((a) => a.halaqa);
  }

  async getHalaqaTodayWorkspace(user: AuthenticatedUser, halaqaId: string) {
    if (!(await this.accessScope.canAccessHalaqa(user, halaqaId))) {
      throw new ForbiddenException('Cannot access this halaqa workspace');
    }

    const halaqa = await this.prisma.halaqa.findFirst({
      where: { id: halaqaId, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        members: {
          where: { isActive: true },
          include: {
            student: {
              include: {
                user: { select: { displayName: true, username: true, phone: true } },
              },
            },
          },
        },
      },
    });
    if (!halaqa) throw new NotFoundException('Halaqa not found');

    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    // Today's attendance session
    const todaySession = await this.prisma.attendanceSession.findUnique({
      where: {
        halaqaId_sessionDate: { halaqaId, sessionDate: todayDate },
      },
      include: { records: true },
    });

    // Active educational plan for the halaqa
    const activePlan = await this.prisma.educationalPlan.findFirst({
      where: {
        halaqaId,
        forumId: user.forumId,
        status: EducationalPlanStatus.ACTIVE,
        deletedAt: null,
      },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    // Get today's recitations for students in this halaqa
    const studentIds = halaqa.members.map((m) => m.studentId);
    const [todayMemos, todayRevs] = await Promise.all([
      this.prisma.memorizationRecord.findMany({
        where: {
          halaqaId,
          studentId: { in: studentIds },
          date: todayDate,
        },
      }),
      this.prisma.revisionRecord.findMany({
        where: {
          halaqaId,
          studentId: { in: studentIds },
          date: todayDate,
        },
      }),
    ]);

    const memosByStudent = new Map(todayMemos.map((m) => [m.studentId, m]));
    const revsByStudent = new Map(todayRevs.map((r) => [r.studentId, r]));
    const attByStudent = new Map(
      todaySession?.records.map((r) => [r.studentId, r.status]) || [],
    );

    const studentsWorkspace = halaqa.members.map((member) => ({
      studentId: member.student.id,
      studentNumber: member.student.studentNumber,
      displayName: member.student.user.displayName,
      username: member.student.user.username,
      phone: member.student.user.phone,
      todayAttendanceStatus: attByStudent.get(member.student.id) || null,
      todayMemorization: memosByStudent.get(member.student.id) || null,
      todayRevision: revsByStudent.get(member.student.id) || null,
    }));

    return {
      halaqa: {
        id: halaqa.id,
        name: halaqa.name,
        code: halaqa.code,
        branch: halaqa.branch,
      },
      todayDate: todayDate.toISOString().split('T')[0],
      session: todaySession
        ? {
            id: todaySession.id,
            status: todaySession.status,
            notes: todaySession.notes,
          }
        : null,
      activePlan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            type: activePlan.type,
            items: activePlan.items,
          }
        : null,
      students: studentsWorkspace,
    };
  }

  async getMobileHomeSummary(user: AuthenticatedUser) {
    const todayDate = new Date();
    todayDate.setUTCHours(0, 0, 0, 0);

    const teacherProfile = await this.prisma.teacherProfile.findUnique({
      where: { userId: user.id },
      include: {
        user: { select: { id: true, displayName: true, username: true, phone: true } },
      },
    });

    let halaqas: any[] = [];
    if (!teacherProfile) {
      halaqas = await this.prisma.halaqa.findMany({
        where: { forumId: user.forumId, isActive: true, deletedAt: null },
        include: {
          branch: { select: { id: true, name: true } },
          _count: { select: { members: { where: { isActive: true } } } },
        },
      });
    } else {
      const assignments = await this.prisma.halaqaTeacher.findMany({
        where: {
          teacherId: teacherProfile.id,
          isActive: true,
          endedAt: null,
          halaqa: { forumId: user.forumId, isActive: true, deletedAt: null },
        },
        include: {
          halaqa: {
            include: {
              branch: { select: { id: true, name: true } },
              _count: { select: { members: { where: { isActive: true } } } },
            },
          },
        },
      });
      halaqas = assignments.map((a) => a.halaqa);
    }

    const halaqaIds = halaqas.map((h) => h.id);
    const totalStudents = halaqas.reduce((acc, h) => acc + (h._count?.members || 0), 0);

    const [
      todaySessions,
      todayMemosCount,
      todayRevsCount,
      pendingTasksCount,
      upcomingExamsCount,
      evaluationsCount,
    ] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where: {
          session: {
            halaqaId: { in: halaqaIds },
            sessionDate: todayDate,
          },
        },
        select: { status: true },
      }),
      this.prisma.memorizationRecord.count({
        where: {
          halaqaId: { in: halaqaIds },
          date: todayDate,
        },
      }),
      this.prisma.revisionRecord.count({
        where: {
          halaqaId: { in: halaqaIds },
          date: todayDate,
        },
      }),
      this.prisma.adminTask.count({
        where: {
          forumId: user.forumId,
          assignedToId: user.id,
          status: { not: 'COMPLETED' },
        },
      }),
      this.prisma.exam.count({
        where: {
          forumId: user.forumId,
          status: 'SCHEDULED',
          deletedAt: null,
        },
      }),
      this.prisma.studentEvaluation.count({
        where: {
          forumId: user.forumId,
          evaluatorId: user.id,
        },
      }),
    ]);

    let todayPresent = 0;
    let todayAbsent = 0;
    for (const rec of todaySessions) {
      if (rec.status === 'PRESENT') todayPresent++;
      else if (rec.status === 'ABSENT') todayAbsent++;
    }

    const totalAttendanceRecorded = todayPresent + todayAbsent;
    const attendanceRate = totalAttendanceRecorded > 0
      ? (todayPresent / totalAttendanceRecorded) * 100
      : (totalStudents > 0 ? 100.0 : 0.0);

    return {
      teacher: {
        id: teacherProfile?.id || user.id,
        displayName: teacherProfile?.user?.displayName || user.username,
        username: teacherProfile?.user?.username || user.username,
        phone: teacherProfile?.user?.phone || '',
      },
      halaqasSummary: halaqas.map((h) => ({
        id: h.id,
        name: h.name,
        code: h.code,
        branchName: h.branch?.name || '',
        studentsCount: h._count?.members || 0,
      })),
      totalHalaqas: halaqas.length,
      totalStudents,
      today: {
        present: todayPresent,
        absent: todayAbsent,
        memorizationCount: todayMemosCount,
        revisionCount: todayRevsCount,
        attendanceRate,
      },
      pendingTasksCount,
      upcomingExamsCount,
      evaluationsCount,
    };
  }
}
