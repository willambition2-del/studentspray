import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import { ChatService } from '../chat/chat.service';
import { NotificationsService } from '../notifications/notifications.service';
import { StudentPortalService } from '../student-portal/student-portal.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { CreateParentRequestDto } from './dto/parent-requests.dto';

@Injectable()
export class ParentPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScope: AccessScopeService,
    private readonly studentPortal: StudentPortalService,
    private readonly notifications: NotificationsService,
    private readonly chat: ChatService,
  ) {}

  async requireParentProfile(user: AuthenticatedUser) {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
    if (!parent || parent.deletedAt) {
      throw new NotFoundException('Parent profile not found for authenticated user');
    }
    return parent;
  }

  async getChildren(user: AuthenticatedUser) {
    const parent = await this.requireParentProfile(user);

    const guardianships = await this.prisma.studentGuardian.findMany({
      where: {
        parentId: parent.id,
        student: {
          deletedAt: null,
          user: { forumId: user.forumId, isActive: true, deletedAt: null },
        },
      },
      include: {
        student: {
          include: {
            user: { select: { id: true, displayName: true, username: true } },
            halaqaMemberships: {
              where: { isActive: true },
              include: {
                halaqa: {
                  select: {
                    id: true,
                    name: true,
                    code: true,
                    teachers: {
                      where: { isActive: true },
                      include: { teacher: { include: { user: { select: { displayName: true, phone: true } } } } },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const childrenSummaries = await Promise.all(
      guardianships.map(async (g) => {
        const student = g.student;
        const currentHalaqa = student.halaqaMemberships[0]?.halaqa;
        const currentTeacher = currentHalaqa?.teachers[0]?.teacher?.user;

        // Quick stats
        const [attendanceRate, lastResult, latestEval] = await Promise.all([
          this.prisma.attendanceRecord.findMany({
            where: { studentId: student.id },
            select: { status: true },
          }).then((records) => {
            if (records.length === 0) return 100;
            const present = records.filter((r) => r.status === 'PRESENT').length;
            return Number(((present / records.length) * 100).toFixed(1));
          }),
          this.prisma.examResult.findFirst({
            where: { studentId: student.id, isPublished: true, deletedAt: null },
            include: { exam: { select: { title: true } } },
            orderBy: { createdAt: 'desc' },
          }),
          this.prisma.studentEvaluation.findFirst({
            where: { studentId: student.id, isPublished: true, deletedAt: null },
            orderBy: { evaluationDate: 'desc' },
          }),
        ]);

        return {
          id: student.id,
          name: student.user.displayName || student.user.username,
          studentNumber: student.studentNumber,
          relationship: g.relationship,
          isPrimary: g.isPrimary,
          halaqaId: currentHalaqa?.id,
          halaqaName: currentHalaqa?.name || 'غير مسجل في حلقة',
          teacherName: currentTeacher?.displayName || 'غير محدد',
          teacherPhone: currentTeacher?.phone,
          attendanceRate,
          lastExamScore: lastResult ? Number(lastResult.percentage) : null,
          lastExamTitle: lastResult?.exam.title ?? null,
          latestRating: latestEval?.rating ?? null,
        };
      }),
    );

    return childrenSummaries;
  }

  async verifyChildAccess(user: AuthenticatedUser, studentId: string) {
    if (!(await this.accessScope.canAccessStudent(user, studentId))) {
      throw new ForbiddenException('Access denied to this student profile');
    }
  }

  async getChildDashboard(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getDashboardForStudent(studentId);
  }

  async getChildPlan(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getPlanForStudent(studentId);
  }

  async getChildAttendance(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getAttendanceForStudent(studentId);
  }

  async getChildMemorization(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getMemorizationForStudent(studentId);
  }

  async getChildRevision(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getRevisionForStudent(studentId);
  }

  async getChildExams(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getExamsForStudent(studentId);
  }

  async getChildEvaluations(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getEvaluationsForStudent(studentId);
  }

  async getChildProgress(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getProgressForStudent(studentId);
  }

  async getChildActivities(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getActivitiesForStudent(studentId);
  }

  async getChildCompetitions(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getCompetitionsForStudent(studentId);
  }

  async getChildAwards(user: AuthenticatedUser, studentId: string) {
    await this.verifyChildAccess(user, studentId);
    return this.studentPortal.getAwardsForStudent(studentId);
  }

  async getMobileHome(user: AuthenticatedUser) {
    const parent = await this.requireParentProfile(user);
    const children = await this.getChildren(user);

    let activeChildId: string | null = null;
    let activeChildDashboard: any = null;

    if (children.length > 0) {
      activeChildId = children[0].id;
      activeChildDashboard = await this.getChildDashboard(user, activeChildId);
    }

    const [unreadNotifications, unreadChat] = await Promise.all([
      this.notifications.getUnreadCount(user.id),
      this.chat.getTotalUnreadCount(user),
    ]);

    return {
      parent: {
        id: parent.id,
        name: parent.user?.displayName || parent.user?.username || '',
        phone: parent.user?.phone || '',
      },
      children,
      activeChildId,
      activeChildDashboard,
      unreadNotificationsCount: unreadNotifications.unreadCount,
      unreadChatCount: unreadChat.unreadCount,
    };
  }

  async createRequest(user: AuthenticatedUser, dto: CreateParentRequestDto) {
    await this.verifyChildAccess(user, dto.studentId);
    await this.requireParentProfile(user);

    const descriptionWithMeta = dto.meetingDate
      ? `${dto.details}\n[موعد الاجتماع المقترح: ${dto.meetingDate}]`
      : dto.details;

    const request = await this.prisma.administrativeRequest.create({
      data: {
        forumId: user.forumId,
        type: 'GENERAL',
        title: dto.subject,
        description: descriptionWithMeta,
        requestedById: user.id,
        relatedEntityType: 'STUDENT',
        relatedEntityId: dto.studentId,
        status: 'SUBMITTED',
        priority: dto.priority ?? 'NORMAL',
        submittedAt: new Date(),
      },
    });

    return {
      id: request.id,
      subject: request.title,
      details: request.description,
      status: request.status,
      priority: request.priority,
      studentId: request.relatedEntityId,
      createdAt: request.createdAt,
    };
  }

  async getRequests(user: AuthenticatedUser) {
    await this.requireParentProfile(user);
    const requests = await this.prisma.administrativeRequest.findMany({
      where: {
        forumId: user.forumId,
        requestedById: user.id,
        deletedAt: null,
      },
      include: {
        approvalActions: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      status: r.status,
      priority: r.priority,
      studentId: r.relatedEntityId,
      createdAt: r.createdAt,
      submittedAt: r.submittedAt,
      adminResponse: r.approvalActions[0]?.comment ?? null,
    }));
  }

  async getRequestDetail(user: AuthenticatedUser, id: string) {
    await this.requireParentProfile(user);
    const request = await this.prisma.administrativeRequest.findFirst({
      where: {
        id,
        forumId: user.forumId,
        requestedById: user.id,
        deletedAt: null,
      },
      include: {
        approvalActions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!request) {
      throw new NotFoundException('Request not found');
    }

    return {
      id: request.id,
      title: request.title,
      description: request.description,
      status: request.status,
      priority: request.priority,
      studentId: request.relatedEntityId,
      createdAt: request.createdAt,
      submittedAt: request.submittedAt,
      actions: request.approvalActions,
      adminResponse: request.approvalActions[0]?.comment ?? null,
    };
  }
}
