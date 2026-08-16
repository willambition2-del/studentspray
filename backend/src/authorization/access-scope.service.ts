import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { AuthorizationService } from './authorization.service';

@Injectable()
export class AccessScopeService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService) {}

  canAccessForum(user: AuthenticatedUser, forumId: string): boolean {
    return user.forumId === forumId;
  }

  async canAccessBranch(user: AuthenticatedUser, branchId: string): Promise<boolean> {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, forumId: user.forumId, isActive: true, deletedAt: null } });
    if (!branch) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      const restrictions = this.authorization.scopedBranches(user);
      return restrictions.length === 0 || restrictions.includes(branchId);
    }
    return user.branchId === branchId;
  }

  async canAccessHalaqa(user: AuthenticatedUser, halaqaId: string): Promise<boolean> {
    const halaqa = await this.prisma.halaqa.findFirst({
      where: { id: halaqaId, forumId: user.forumId, isActive: true, deletedAt: null },
      select: { branchId: true },
    });
    if (!halaqa) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER') || this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      return this.canAccessBranch(user, halaqa.branchId);
    }
    if (this.authorization.hasRole(user, 'TEACHER')) {
      return Boolean(await this.prisma.halaqaTeacher.findFirst({
        where: { halaqaId, isActive: true, endedAt: null, teacher: { userId: user.id, deletedAt: null } },
        select: { id: true },
      }));
    }
    if (this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return Boolean(await this.prisma.halaqaSupervisor.findFirst({
        where: { halaqaId, isActive: true, endedAt: null, supervisor: { userId: user.id, deletedAt: null } },
        select: { id: true },
      }));
    }
    return false;
  }

  async canAccessStudent(user: AuthenticatedUser, studentProfileId: string): Promise<boolean> {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: studentProfileId, deletedAt: null, user: { forumId: user.forumId, isActive: true, deletedAt: null } },
      select: { id: true, userId: true },
    });
    if (!student) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      const account = await this.prisma.user.findUnique({ where: { id: student.userId }, select: { branchId: true } });
      return Boolean(account?.branchId && await this.canAccessBranch(user, account.branchId));
    }
    if (this.authorization.hasRole(user, 'STUDENT')) return student.userId === user.id;
    if (this.authorization.hasRole(user, 'PARENT')) {
      return Boolean(await this.prisma.studentGuardian.findFirst({
        where: { studentId: studentProfileId, parent: { userId: user.id, deletedAt: null } },
        select: { id: true },
      }));
    }
    if (this.authorization.hasRole(user, 'TEACHER')) {
      return Boolean(await this.prisma.halaqaMember.findFirst({
        where: {
          studentId: studentProfileId,
          isActive: true,
          endedAt: null,
          halaqa: { teachers: { some: { isActive: true, endedAt: null, teacher: { userId: user.id, deletedAt: null } } } },
        },
        select: { id: true },
      }));
    }
    if (this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return Boolean(await this.prisma.halaqaMember.findFirst({
        where: {
          studentId: studentProfileId,
          isActive: true,
          endedAt: null,
          halaqa: { supervisors: { some: { isActive: true, endedAt: null, supervisor: { userId: user.id, deletedAt: null } } } },
        },
        select: { id: true },
      }));
    }
    return false;
  }

  async canAccessTeacher(user: AuthenticatedUser, teacherProfileId: string): Promise<boolean> {
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherProfileId, deletedAt: null, user: { forumId: user.forumId, isActive: true, deletedAt: null } },
      select: { id: true, userId: true },
    });
    if (!teacher) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      const account = await this.prisma.user.findUnique({ where: { id: teacher.userId }, select: { branchId: true } });
      return Boolean(account?.branchId && (await this.canAccessBranch(user, account.branchId)));
    }
    if (this.authorization.hasRole(user, 'TEACHER')) return teacher.userId === user.id;
    if (this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return Boolean(
        await this.prisma.halaqaTeacher.findFirst({
          where: {
            teacherId: teacherProfileId,
            isActive: true,
            endedAt: null,
            halaqa: {
              forumId: user.forumId,
              isActive: true,
              deletedAt: null,
              supervisors: {
                some: {
                  isActive: true,
                  endedAt: null,
                  supervisor: { userId: user.id, deletedAt: null },
                },
              },
            },
          },
          select: { id: true },
        }),
      );
    }
    return false;
  }

  async canAccessFieldVisit(user: AuthenticatedUser, visitId: string): Promise<boolean> {
    const visit = await this.prisma.fieldVisit.findFirst({
      where: { id: visitId, forumId: user.forumId, deletedAt: null },
      include: { supervisor: { select: { userId: true } }, teacher: { select: { userId: true } } },
    });
    if (!visit) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      return this.canAccessBranch(user, visit.branchId);
    }
    if (this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return visit.supervisor.userId === user.id;
    }
    if (this.authorization.hasRole(user, 'TEACHER')) {
      return visit.teacher.userId === user.id;
    }
    return false;
  }

  async canAccessRecommendation(user: AuthenticatedUser, recommendationId: string): Promise<boolean> {
    const rec = await this.prisma.recommendation.findFirst({
      where: { id: recommendationId, forumId: user.forumId, deletedAt: null },
      include: { supervisor: { select: { userId: true } }, teacher: { select: { userId: true } } },
    });
    if (!rec) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      return this.canAccessBranch(user, rec.branchId);
    }
    if (this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return rec.supervisor.userId === user.id;
    }
    if (this.authorization.hasRole(user, 'TEACHER')) {
      return rec.teacher.userId === user.id;
    }
    return false;
  }

  async getTeacherHalaqaIds(user: AuthenticatedUser): Promise<string[]> {
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER') || this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      const halaqas = await this.prisma.halaqa.findMany({
        where: { forumId: user.forumId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      return halaqas.map(h => h.id);
    }
    const assignments = await this.prisma.halaqaTeacher.findMany({
      where: {
        isActive: true,
        endedAt: null,
        teacher: { userId: user.id, deletedAt: null },
        halaqa: { forumId: user.forumId, isActive: true, deletedAt: null }
      },
      select: { halaqaId: true },
    });
    return assignments.map(a => a.halaqaId);
  }

  async getSupervisorHalaqaIds(user: AuthenticatedUser): Promise<string[]> {
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER') || this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      const halaqas = await this.prisma.halaqa.findMany({
        where: { forumId: user.forumId, isActive: true, deletedAt: null },
        select: { id: true },
      });
      return halaqas.map((h) => h.id);
    }
    const assignments = await this.prisma.halaqaSupervisor.findMany({
      where: {
        isActive: true,
        endedAt: null,
        supervisor: { userId: user.id, deletedAt: null },
        halaqa: { forumId: user.forumId, isActive: true, deletedAt: null },
      },
      select: { halaqaId: true },
    });
    return assignments.map((a) => a.halaqaId);
  }

  async canAccessExam(user: AuthenticatedUser, examId: string): Promise<boolean> {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, forumId: user.forumId, deletedAt: null },
      select: { id: true, branchId: true, halaqaId: true, isPublished: true },
    });
    if (!exam) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      return !exam.branchId || this.canAccessBranch(user, exam.branchId);
    }
    if (this.authorization.hasRole(user, 'TEACHER')) {
      if (!exam.halaqaId) return true;
      return this.canAccessHalaqa(user, exam.halaqaId);
    }
    if (this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      if (!exam.halaqaId) return true;
      return this.canAccessHalaqa(user, exam.halaqaId);
    }
    if (this.authorization.hasRole(user, 'STUDENT') || this.authorization.hasRole(user, 'PARENT')) {
      return exam.isPublished;
    }
    return false;
  }

  async canAccessExamResult(user: AuthenticatedUser, resultId: string): Promise<boolean> {
    const result = await this.prisma.examResult.findFirst({
      where: { id: resultId, deletedAt: null, exam: { forumId: user.forumId, deletedAt: null } },
      select: { id: true, studentId: true, isPublished: true, exam: { select: { branchId: true, halaqaId: true } } },
    });
    if (!result) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      return !result.exam.branchId || this.canAccessBranch(user, result.exam.branchId);
    }
    if (this.authorization.hasRole(user, 'STUDENT') || this.authorization.hasRole(user, 'PARENT')) {
      if (!result.isPublished) return false;
      return this.canAccessStudent(user, result.studentId);
    }
    if (this.authorization.hasRole(user, 'TEACHER') || this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return this.canAccessStudent(user, result.studentId);
    }
    return false;
  }

  async canAccessStudentEvaluation(user: AuthenticatedUser, evaluationId: string): Promise<boolean> {
    const ev = await this.prisma.studentEvaluation.findFirst({
      where: { id: evaluationId, forumId: user.forumId, deletedAt: null },
      select: { id: true, studentId: true, halaqaId: true, isPublished: true },
    });
    if (!ev) return false;
    if (this.authorization.hasRole(user, 'GENERAL_MANAGER')) return true;
    if (this.authorization.hasRole(user, 'EXECUTIVE_MANAGER')) {
      return this.canAccessHalaqa(user, ev.halaqaId);
    }
    if (this.authorization.hasRole(user, 'STUDENT') || this.authorization.hasRole(user, 'PARENT')) {
      if (!ev.isPublished) return false;
      return this.canAccessStudent(user, ev.studentId);
    }
    if (this.authorization.hasRole(user, 'TEACHER') || this.authorization.hasRole(user, 'TECHNICAL_SUPERVISOR')) {
      return this.canAccessHalaqa(user, ev.halaqaId);
    }
    return false;
  }

  async getParentChildrenIds(user: AuthenticatedUser): Promise<string[]> {
    const parent = await this.prisma.parentProfile.findUnique({
      where: { userId: user.id },
      select: { id: true },
    });
    if (!parent) return [];
    const guardians = await this.prisma.studentGuardian.findMany({
      where: { parentId: parent.id, student: { deletedAt: null, user: { forumId: user.forumId, isActive: true, deletedAt: null } } },
      select: { studentId: true },
    });
    return guardians.map((g) => g.studentId);
  }
}
