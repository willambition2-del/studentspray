import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import { StudentPortalService } from '../student-portal/student-portal.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class ParentPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly accessScope: AccessScopeService,
    private readonly studentPortal: StudentPortalService,
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

    return {
      parent: {
        id: parent.id,
        name: parent.user?.displayName || parent.user?.username || '',
        phone: parent.user?.phone || '',
      },
      children,
      activeChildId,
      activeChildDashboard,
    };
  }
}
