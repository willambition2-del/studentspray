import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { EvaluationTemplatesService } from '../evaluation-templates/evaluation-templates.service';
import { FieldVisitsService } from '../field-visits/field-visits.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import {
  CreateFieldVisitDto,
  CreateRecommendationDto,
  CreateRecommendationFollowUpDto,
  RecommendationQueryDto,
  SaveFieldVisitEvaluationDto,
  UpdateFieldVisitStatusDto,
  UpdateRecommendationDto,
} from '../field-visits/dto/field-visit.dto';
import { SupervisorVisitsQueryDto } from './dto/supervisor-workspace.dto';
import { EvaluationStatus } from '../generated/prisma/client';

export interface TeacherSummaryItem {
  id: string;
  userId: string;
  displayName: string;
  username: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  employeeNumber: string | null;
  halaqas: Array<{ id: string; name: string; code: string }>;
  lastVisit?: {
    id: string;
    date: Date | null;
    score: number | null;
    level: string | null;
  } | null;
  openRecommendationsCount?: number;
}

@Injectable()
export class SupervisorWorkspaceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly evaluationTemplates: EvaluationTemplatesService,
    private readonly fieldVisits: FieldVisitsService,
  ) {}

  private async requireSupervisor(user: AuthenticatedUser) {
    const supervisor = await this.prisma.supervisorProfile.findFirst({
      where: { userId: user.id, deletedAt: null },
    });
    if (!supervisor) {
      throw new ForbiddenException('Authenticated user is not registered as a Technical Supervisor');
    }
    return supervisor;
  }

  async getDashboard(user: AuthenticatedUser) {
    const supervisor = await this.requireSupervisor(user);

    // 1. Assigned halaqas
    const halaqaAssignments = await this.prisma.halaqaSupervisor.findMany({
      where: {
        supervisorId: supervisor.id,
        isActive: true,
        endedAt: null,
        halaqa: { forumId: user.forumId, isActive: true, deletedAt: null },
      },
      select: { halaqaId: true },
    });
    const halaqaIds = halaqaAssignments.map((h) => h.halaqaId);

    // 2. Assigned teachers in these halaqas
    const teacherAssignments = await this.prisma.halaqaTeacher.findMany({
      where: {
        halaqaId: { in: halaqaIds },
        isActive: true,
        endedAt: null,
        teacher: { deletedAt: null },
      },
      select: { teacherId: true },
    });
    const teacherIds = Array.from(new Set(teacherAssignments.map((t) => t.teacherId)));

    // 3. Visits stats
    const [totalCompleted, totalPlanned, inProgressCount, recentVisits, upcomingVisits] =
      await Promise.all([
        this.prisma.fieldVisit.count({
          where: { supervisorId: supervisor.id, status: 'COMPLETED', deletedAt: null },
        }),
        this.prisma.fieldVisit.count({
          where: { supervisorId: supervisor.id, status: 'PLANNED', deletedAt: null },
        }),
        this.prisma.fieldVisit.count({
          where: { supervisorId: supervisor.id, status: 'IN_PROGRESS', deletedAt: null },
        }),
        this.prisma.fieldVisit.findMany({
          where: { supervisorId: supervisor.id, status: 'COMPLETED', deletedAt: null },
          include: {
            teacher: { include: { user: { select: { displayName: true } } } },
            halaqa: { select: { name: true } },
            evaluation: { select: { totalScore: true, percentage: true, level: true } },
          },
          orderBy: { completedAt: 'desc' },
          take: 5,
        }),
        this.prisma.fieldVisit.findMany({
          where: { supervisorId: supervisor.id, status: 'PLANNED', deletedAt: null },
          include: {
            teacher: { include: { user: { select: { displayName: true } } } },
            halaqa: { select: { name: true } },
          },
          orderBy: { scheduledDate: 'asc' },
          take: 5,
        }),
      ]);

    // 4. Average score
    const avgScoreResult = await this.prisma.fieldVisitEvaluation.aggregate({
      where: {
        visit: { supervisorId: supervisor.id, deletedAt: null },
        status: 'SUBMITTED',
      },
      _avg: { percentage: true },
    });
    const avgScore = avgScoreResult._avg.percentage ? Number(avgScoreResult._avg.percentage.toFixed(1)) : 0;

    // 5. Recommendations stats
    const now = new Date();
    const [openRecsCount, overdueRecsCount, urgentRecs] = await Promise.all([
      this.prisma.recommendation.count({
        where: { supervisorId: supervisor.id, status: { in: ['OPEN', 'IN_PROGRESS'] }, deletedAt: null },
      }),
      this.prisma.recommendation.count({
        where: {
          supervisorId: supervisor.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          dueDate: { lt: now },
          deletedAt: null,
        },
      }),
      this.prisma.recommendation.findMany({
        where: {
          supervisorId: supervisor.id,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          priority: { in: ['HIGH', 'URGENT'] },
          deletedAt: null,
        },
        include: {
          teacher: { include: { user: { select: { displayName: true } } } },
          halaqa: { select: { name: true } },
        },
        orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }],
        take: 5,
      }),
    ]);

    return {
      metrics: {
        totalHalaqas: halaqaIds.length,
        totalTeachers: teacherIds.length,
        totalVisitsCompleted: totalCompleted,
        totalVisitsPlanned: totalPlanned,
        totalVisitsInProgress: inProgressCount,
        averageEvaluationScore: avgScore,
        openRecommendationsCount: openRecsCount,
        overdueRecommendationsCount: overdueRecsCount,
      },
      recentVisits,
      upcomingVisits,
      urgentRecommendations: urgentRecs.map((r) => ({
        ...r,
        isOverdue: r.dueDate !== null && r.dueDate < now,
      })),
    };
  }

  async getHalaqas(user: AuthenticatedUser) {
    const supervisor = await this.requireSupervisor(user);

    const assignments = await this.prisma.halaqaSupervisor.findMany({
      where: {
        supervisorId: supervisor.id,
        isActive: true,
        endedAt: null,
        halaqa: { forumId: user.forumId, isActive: true, deletedAt: null },
      },
      include: {
        halaqa: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
            teachers: {
              where: { isActive: true, endedAt: null },
              include: {
                teacher: {
                  include: { user: { select: { id: true, displayName: true, phone: true } } },
                },
              },
            },
            _count: {
              select: {
                members: { where: { isActive: true } },
                fieldVisits: { where: { supervisorId: supervisor.id, deletedAt: null } },
              },
            },
          },
        },
      },
    });

    return assignments.map((a) => ({
      id: a.halaqa.id,
      name: a.halaqa.name,
      code: a.halaqa.code,
      branchName: a.halaqa.branch.name,
      branchId: a.halaqa.branch.id,
      studentsCount: a.halaqa._count.members,
      visitsCount: a.halaqa._count.fieldVisits,
      teachers: a.halaqa.teachers.map((t) => ({
        id: t.teacher.id,
        name: t.teacher.user.displayName || 'أستاذ',
        phone: t.teacher.user.phone,
      })),
    }));
  }

  async getTeachers(user: AuthenticatedUser) {
    const supervisor = await this.requireSupervisor(user);

    const halaqas = await this.prisma.halaqaSupervisor.findMany({
      where: {
        supervisorId: supervisor.id,
        isActive: true,
        endedAt: null,
        halaqa: { forumId: user.forumId, isActive: true, deletedAt: null },
      },
      select: { halaqaId: true },
    });
    const halaqaIds = halaqas.map((h) => h.halaqaId);

    const teacherAssignments = await this.prisma.halaqaTeacher.findMany({
      where: {
        halaqaId: { in: halaqaIds },
        isActive: true,
        endedAt: null,
        teacher: { deletedAt: null },
      },
      include: {
        halaqa: { select: { id: true, name: true, code: true } },
        teacher: {
          include: {
            user: { select: { id: true, displayName: true, username: true, phone: true, email: true } },
          },
        },
      },
    });

    // Group by teacher
    const teachersMap = new Map<string, TeacherSummaryItem>();
    for (const item of teacherAssignments) {
      const tId = item.teacher.id;
      if (!teachersMap.has(tId)) {
        teachersMap.set(tId, {
          id: tId,
          userId: item.teacher.user.id,
          displayName: item.teacher.user.displayName || item.teacher.user.username,
          username: item.teacher.user.username,
          phone: item.teacher.user.phone,
          email: item.teacher.user.email,
          specialization: item.teacher.specialization,
          employeeNumber: item.teacher.employeeNumber,
          halaqas: [],
        });
      }
      teachersMap.get(tId)!.halaqas.push({
        id: item.halaqa.id,
        name: item.halaqa.name,
        code: item.halaqa.code,
      });
    }

    const teacherList = Array.from(teachersMap.values());

    // Enrich with last visit and recommendations count
    const enriched: TeacherSummaryItem[] = await Promise.all(
      teacherList.map(async (t) => {
        const [lastVisit, openRecsCount] = await Promise.all([
          this.prisma.fieldVisit.findFirst({
            where: { teacherId: t.id, supervisorId: supervisor.id, status: 'COMPLETED', deletedAt: null },
            include: { evaluation: { select: { totalScore: true, percentage: true, level: true } } },
            orderBy: { completedAt: 'desc' },
          }),
          this.prisma.recommendation.count({
            where: { teacherId: t.id, supervisorId: supervisor.id, status: { in: ['OPEN', 'IN_PROGRESS'] }, deletedAt: null },
          }),
        ]);

        return {
          ...t,
          lastVisit: lastVisit
            ? {
                id: lastVisit.id,
                date: lastVisit.completedAt || lastVisit.scheduledDate,
                score: lastVisit.evaluation?.percentage ? Number(lastVisit.evaluation.percentage) : null,
                level: lastVisit.evaluation?.level ?? null,
              }
            : null,
          openRecommendationsCount: openRecsCount,
        };
      }),
    );

    return enriched;
  }

  async getTeacherDetail(user: AuthenticatedUser, teacherId: string) {
    const supervisor = await this.requireSupervisor(user);

    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherId, deletedAt: null, user: { forumId: user.forumId } },
      include: {
        user: { select: { id: true, displayName: true, username: true, phone: true, email: true } },
        halaqas: {
          where: {
            isActive: true,
            endedAt: null,
            halaqa: {
              supervisors: { some: { supervisorId: supervisor.id, isActive: true, endedAt: null } },
            },
          },
          include: {
            halaqa: {
              include: {
                branch: { select: { name: true } },
                _count: { select: { members: { where: { isActive: true } } } },
              },
            },
          },
        },
      },
    });

    if (!teacher || teacher.halaqas.length === 0) {
      throw new NotFoundException('Teacher not found in your supervised halaqas');
    }

    const [visits, recommendations] = await Promise.all([
      this.prisma.fieldVisit.findMany({
        where: { teacherId, supervisorId: supervisor.id, deletedAt: null },
        include: {
          halaqa: { select: { name: true } },
          evaluation: {
            select: { totalScore: true, percentage: true, level: true, submittedAt: true, status: true },
          },
        },
        orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.recommendation.findMany({
        where: { teacherId, supervisorId: supervisor.id, deletedAt: null },
        include: {
          halaqa: { select: { name: true } },
          followUps: { orderBy: { createdAt: 'desc' } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      }),
    ]);

    const now = new Date();
    return {
      teacher: {
        id: teacher.id,
        displayName: teacher.user.displayName || teacher.user.username,
        username: teacher.user.username,
        phone: teacher.user.phone,
        email: teacher.user.email,
        specialization: teacher.specialization,
        employeeNumber: teacher.employeeNumber,
        halaqas: teacher.halaqas.map((h) => ({
          id: h.halaqa.id,
          name: h.halaqa.name,
          code: h.halaqa.code,
          branchName: h.halaqa.branch.name,
          studentsCount: h.halaqa._count.members,
        })),
      },
      visitsHistory: visits,
      recommendations: recommendations.map((r) => ({
        ...r,
        isOverdue: r.dueDate !== null && r.dueDate < now && !['COMPLETED', 'CANCELLED'].includes(r.status),
      })),
    };
  }

  async getVisits(user: AuthenticatedUser, query: SupervisorVisitsQueryDto) {
    const supervisor = await this.requireSupervisor(user);
    return this.fieldVisits.list(user, { ...query, supervisorId: supervisor.id });
  }

  async getVisitDetail(user: AuthenticatedUser, visitId: string) {
    await this.requireSupervisor(user);
    return this.fieldVisits.getById(user, visitId);
  }

  async getVisitWorkspace(user: AuthenticatedUser, visitId: string) {
    const supervisor = await this.requireSupervisor(user);
    const visit = await this.prisma.fieldVisit.findFirst({
      where: { id: visitId, supervisorId: supervisor.id, forumId: user.forumId, deletedAt: null },
      include: {
        teacher: {
          include: { user: { select: { id: true, displayName: true, username: true, phone: true } } },
        },
        halaqa: {
          include: {
            branch: { select: { id: true, name: true } },
            _count: { select: { members: { where: { isActive: true } } } },
          },
        },
        evaluation: {
          include: {
            template: true,
            criteriaEvaluations: {
              include: { criterion: true },
            },
          },
        },
        recommendations: {
          include: { followUps: true },
        },
      },
    });

    if (!visit) throw new NotFoundException('Field visit not found');

    // 1. Live Halaqa metrics snapshot
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [recentAttendanceCount, recentAttendanceTotal, totalMemorizationsWeek, previousVisit, openRecs] =
      await Promise.all([
        this.prisma.attendanceRecord.count({
          where: {
            session: {
              halaqaId: visit.halaqaId,
              sessionDate: { gte: sevenDaysAgo },
            },
            status: 'PRESENT',
          },
        }),
        this.prisma.attendanceRecord.count({
          where: {
            session: {
              halaqaId: visit.halaqaId,
              sessionDate: { gte: sevenDaysAgo },
            },
          },
        }),
        this.prisma.memorizationRecord.count({
          where: {
            halaqaId: visit.halaqaId,
            date: { gte: sevenDaysAgo },
          },
        }),
        this.prisma.fieldVisit.findFirst({
          where: {
            teacherId: visit.teacherId,
            halaqaId: visit.halaqaId,
            status: 'COMPLETED',
            id: { not: visitId },
            deletedAt: null,
          },
          include: { evaluation: { select: { percentage: true, level: true, submittedAt: true } } },
          orderBy: { completedAt: 'desc' },
        }),
        this.prisma.recommendation.findMany({
          where: {
            teacherId: visit.teacherId,
            halaqaId: visit.halaqaId,
            status: { in: ['OPEN', 'IN_PROGRESS'] },
            deletedAt: null,
          },
          orderBy: { priority: 'desc' },
        }),
      ]);

    const attendanceRate = recentAttendanceTotal > 0 ? (recentAttendanceCount / recentAttendanceTotal) * 100 : 100;

    // 2. Active Evaluation Template
    const template = await this.evaluationTemplates.getActiveTemplate(user);

    return {
      visit,
      liveSnapshot: {
        totalActiveStudents: visit.halaqa._count.members,
        recentAttendanceRate: Number(attendanceRate.toFixed(1)),
        recentMemorizationsCount: totalMemorizationsWeek,
      },
      previousVisit: previousVisit
        ? {
            id: previousVisit.id,
            date: previousVisit.completedAt || previousVisit.scheduledDate,
            percentage: previousVisit.evaluation?.percentage ? Number(previousVisit.evaluation.percentage) : null,
            level: previousVisit.evaluation?.level ?? null,
          }
        : null,
      openRecommendations: openRecs,
      activeTemplate: template,
    };
  }

  async createVisit(user: AuthenticatedUser, dto: CreateFieldVisitDto, context: AuthContext) {
    await this.requireSupervisor(user);
    return this.fieldVisits.create(user, dto, context);
  }

  async updateVisitStatus(
    user: AuthenticatedUser,
    visitId: string,
    dto: UpdateFieldVisitStatusDto,
    context: AuthContext,
  ) {
    await this.requireSupervisor(user);
    return this.fieldVisits.updateStatus(user, visitId, dto, context);
  }

  async getVisitEvaluation(user: AuthenticatedUser, visitId: string) {
    await this.requireSupervisor(user);
    const evalReport = await this.prisma.fieldVisitEvaluation.findFirst({
      where: { visitId },
      include: {
        template: {
          include: {
            axes: {
              include: { criteria: { orderBy: { order: 'asc' } } },
              orderBy: { order: 'asc' },
            },
          },
        },
        criteriaEvaluations: {
          include: { criterion: true },
        },
      },
    });

    if (!evalReport) {
      // Return active template for starting a draft
      const activeTemplate = await this.evaluationTemplates.getActiveTemplate(user);
      return {
        status: 'NEW',
        template: activeTemplate,
        criteriaEvaluations: [],
      };
    }

    return evalReport;
  }

  async saveVisitEvaluation(
    user: AuthenticatedUser,
    visitId: string,
    dto: SaveFieldVisitEvaluationDto,
    context: AuthContext,
  ) {
    await this.requireSupervisor(user);
    return this.fieldVisits.saveEvaluation(user, visitId, dto, context);
  }

  async submitVisitEvaluation(
    user: AuthenticatedUser,
    visitId: string,
    dto: SaveFieldVisitEvaluationDto,
    context: AuthContext,
  ) {
    await this.requireSupervisor(user);
    return this.fieldVisits.saveEvaluation(
      user,
      visitId,
      { ...dto, status: EvaluationStatus.SUBMITTED },
      context,
    );
  }

  async getRecommendations(user: AuthenticatedUser, query: RecommendationQueryDto) {
    await this.requireSupervisor(user);
    return this.fieldVisits.listRecommendations(user, { ...query });
  }

  async createRecommendation(
    user: AuthenticatedUser,
    visitId: string,
    dto: CreateRecommendationDto,
    context: AuthContext,
  ) {
    await this.requireSupervisor(user);
    return this.fieldVisits.createRecommendation(user, { ...dto, visitId }, context);
  }

  async updateRecommendation(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateRecommendationDto,
    context: AuthContext,
  ) {
    await this.requireSupervisor(user);
    return this.fieldVisits.updateRecommendation(user, id, dto, context);
  }

  async addRecommendationFollowUp(
    user: AuthenticatedUser,
    recommendationId: string,
    dto: CreateRecommendationFollowUpDto,
    context: AuthContext,
  ) {
    await this.requireSupervisor(user);
    return this.fieldVisits.addFollowUp(user, recommendationId, dto, context);
  }
}
