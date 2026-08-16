import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class StudentPortalService {
  constructor(private readonly prisma: PrismaService) {}

  async requireStudentProfile(user: AuthenticatedUser) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { userId: user.id },
      include: { user: true },
    });
    if (!student || student.deletedAt) {
      throw new NotFoundException('Student profile not found for the authenticated user');
    }
    return student;
  }

  async getDashboardForStudent(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: { select: { id: true, displayName: true, username: true, phone: true, email: true } },
        halaqaMemberships: {
          where: { isActive: true },
          include: {
            halaqa: {
              include: {
                teachers: {
                  where: { isActive: true },
                  include: { teacher: { include: { user: { select: { displayName: true, phone: true } } } } },
                },
              },
            },
          },
        },
      },
    });

    if (!student || student.deletedAt) {
      throw new NotFoundException('Student not found');
    }

    const currentHalaqa = student.halaqaMemberships[0]?.halaqa;
    const currentTeacher = currentHalaqa?.teachers[0]?.teacher?.user;

    // 1. Active Plan
    const activePlan = await this.prisma.educationalPlan.findFirst({
      where: { studentId, status: 'ACTIVE', deletedAt: null },
      include: { items: { orderBy: { order: 'asc' } } },
    });

    let planSummary = null;
    if (activePlan) {
      const totalItems = activePlan.items.length;
      const completedItems = activePlan.items.filter((i) => i.status === 'COMPLETED').length;
      const progressPercentage = totalItems > 0 ? Number(((completedItems / totalItems) * 100).toFixed(1)) : 0;
      planSummary = {
        id: activePlan.id,
        name: activePlan.name,
        type: activePlan.type,
        totalItems,
        completedItems,
        progressPercentage,
        items: activePlan.items.slice(0, 5),
      };
    }

    // 2. Attendance Summary
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
    });
    const totalSessions = attendanceRecords.length;
    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const absentCount = attendanceRecords.filter((r) => r.status === 'ABSENT').length;
    const lateCount = attendanceRecords.filter((r) => r.status === 'LATE').length;
    const excusedCount = attendanceRecords.filter((r) => r.status === 'EXCUSED').length;
    const attendanceRate = totalSessions > 0 ? Number(((presentCount / totalSessions) * 100).toFixed(1)) : 100;

    // 3. Memorization & Revision Counts
    const [totalHifz, totalRevision, latestHifz, latestRevision] = await Promise.all([
      this.prisma.memorizationRecord.count({ where: { studentId } }),
      this.prisma.revisionRecord.count({ where: { studentId } }),
      this.prisma.memorizationRecord.findFirst({
        where: { studentId },
        orderBy: { date: 'desc' },
      }),
      this.prisma.revisionRecord.findFirst({
        where: { studentId },
        orderBy: { date: 'desc' },
      }),
    ]);

    // 4. Upcoming Published Exams & Recent Results
    const [upcomingExams, recentResults] = await Promise.all([
      this.prisma.exam.findMany({
        where: {
          isPublished: true,
          deletedAt: null,
          scheduledDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          OR: [{ halaqaId: currentHalaqa?.id }, { halaqaId: null }],
        },
        orderBy: { scheduledDate: 'asc' },
        take: 3,
      }),
      this.prisma.examResult.findMany({
        where: { studentId, isPublished: true, deletedAt: null },
        include: { exam: { select: { title: true, maxScore: true, examType: true, scheduledDate: true } } },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);

    // 5. Latest Evaluation
    const latestEvaluation = await this.prisma.studentEvaluation.findFirst({
      where: { studentId, isPublished: true, deletedAt: null },
      orderBy: { evaluationDate: 'desc' },
    });

    return {
      student: {
        id: student.id,
        name: student.user.displayName || student.user.username,
        studentNumber: student.studentNumber,
        halaqaName: currentHalaqa?.name || 'غير محدد',
        teacherName: currentTeacher?.displayName || 'غير محدد',
        teacherPhone: currentTeacher?.phone,
      },
      plan: planSummary,
      attendance: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate,
      },
      memorization: {
        totalRecords: totalHifz,
        latest: latestHifz ? {
          date: latestHifz.date,
          surahNumber: latestHifz.surahNumber,
          fromAyah: latestHifz.fromAyah,
          toAyah: latestHifz.toAyah,
          score: Number(latestHifz.evaluationScore),
        } : null,
      },
      revision: {
        totalRecords: totalRevision,
        latest: latestRevision ? {
          date: latestRevision.date,
          surahNumber: latestRevision.surahNumber,
          fromAyah: latestRevision.fromAyah,
          toAyah: latestRevision.toAyah,
          score: Number(latestRevision.evaluationScore),
        } : null,
      },
      upcomingExams: upcomingExams.map((e) => ({
        id: e.id,
        title: e.title,
        examType: e.examType,
        scheduledDate: e.scheduledDate,
        maxScore: Number(e.maxScore),
      })),
      recentResults: recentResults.map((r) => ({
        id: r.id,
        examTitle: r.exam.title,
        examType: r.exam.examType,
        score: Number(r.score),
        maxScore: Number(r.exam.maxScore),
        percentage: Number(r.percentage),
        isPassed: r.isPassed,
        status: r.status,
        date: r.exam.scheduledDate || r.createdAt,
      })),
      latestEvaluation: latestEvaluation ? {
        id: latestEvaluation.id,
        period: latestEvaluation.period,
        evaluationDate: latestEvaluation.evaluationDate,
        rating: latestEvaluation.rating,
        overallScore: latestEvaluation.overallScore ? Number(latestEvaluation.overallScore) : null,
        teacherNotes: latestEvaluation.teacherNotes,
        actionLabel: latestEvaluation.actionLabel,
      } : null,
    };
  }

  async getPlanForStudent(studentId: string) {
    const plans = await this.prisma.educationalPlan.findMany({
      where: { studentId, deletedAt: null },
      include: { items: { orderBy: { order: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return plans.map((p) => {
      const totalItems = p.items.length;
      const completedItems = p.items.filter((i) => i.status === 'COMPLETED').length;
      const progressPercentage = totalItems > 0 ? Number(((completedItems / totalItems) * 100).toFixed(1)) : 0;
      return {
        id: p.id,
        name: p.name,
        type: p.type,
        status: p.status,
        totalItems,
        completedItems,
        progressPercentage,
        items: p.items,
      };
    });
  }

  async getAttendanceForStudent(studentId: string) {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { studentId },
      include: { session: { select: { sessionDate: true } } },
      orderBy: { recordedAt: 'desc' },
    });

    const totalSessions = records.length;
    const presentCount = records.filter((r) => r.status === 'PRESENT').length;
    const absentCount = records.filter((r) => r.status === 'ABSENT').length;
    const lateCount = records.filter((r) => r.status === 'LATE').length;
    const excusedCount = records.filter((r) => r.status === 'EXCUSED').length;
    const rate = totalSessions > 0 ? Number(((presentCount / totalSessions) * 100).toFixed(1)) : 100;

    return {
      summary: {
        totalSessions,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate: rate,
      },
      history: records.map((r) => ({
        id: r.id,
        date: r.session.sessionDate,
        status: r.status,
        notes: r.notes,
      })),
    };
  }

  async getMemorizationForStudent(studentId: string) {
    const records = await this.prisma.memorizationRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      date: r.date,
      surahNumber: r.surahNumber,
      fromAyah: r.fromAyah,
      toAyah: r.toAyah,
      pageFrom: r.pageFrom,
      pageTo: r.pageTo,
      score: Number(r.evaluationScore),
      rating: r.rating,
      mistakesCount: r.mistakesCount,
      teacherNotes: r.teacherNotes,
    }));
  }

  async getRevisionForStudent(studentId: string) {
    const records = await this.prisma.revisionRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    return records.map((r) => ({
      id: r.id,
      date: r.date,
      surahNumber: r.surahNumber,
      fromAyah: r.fromAyah,
      toAyah: r.toAyah,
      pageFrom: r.pageFrom,
      pageTo: r.pageTo,
      juzNumber: r.juzNumber,
      score: Number(r.evaluationScore),
      rating: r.rating,
      mistakesCount: r.mistakesCount,
      teacherNotes: r.teacherNotes,
    }));
  }

  async getExamsForStudent(studentId: string) {
    const student = await this.prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { halaqaMemberships: { where: { isActive: true } } },
    });
    const currentHalaqaId = student?.halaqaMemberships[0]?.halaqaId;

    const [upcoming, publishedResults] = await Promise.all([
      this.prisma.exam.findMany({
        where: {
          isPublished: true,
          deletedAt: null,
          scheduledDate: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
          OR: [{ halaqaId: currentHalaqaId }, { halaqaId: null }],
        },
        orderBy: { scheduledDate: 'asc' },
      }),
      this.prisma.examResult.findMany({
        where: { studentId, isPublished: true, deletedAt: null },
        include: { exam: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      upcomingExams: upcoming.map((e) => ({
        id: e.id,
        title: e.title,
        description: e.description,
        curriculum: e.curriculum,
        examType: e.examType,
        scheduledDate: e.scheduledDate,
        maxScore: Number(e.maxScore),
        passScore: Number(e.passScore),
      })),
      results: publishedResults.map((r) => ({
        id: r.id,
        examId: r.examId,
        examTitle: r.exam.title,
        examType: r.exam.examType,
        score: Number(r.score),
        maxScore: Number(r.exam.maxScore),
        passScore: Number(r.exam.passScore),
        percentage: Number(r.percentage),
        isPassed: r.isPassed,
        status: r.status,
        notes: r.notes,
        date: r.exam.scheduledDate || r.createdAt,
      })),
    };
  }

  async getEvaluationsForStudent(studentId: string) {
    const evaluations = await this.prisma.studentEvaluation.findMany({
      where: { studentId, isPublished: true, deletedAt: null },
      orderBy: { evaluationDate: 'desc' },
    });

    return evaluations.map((e) => ({
      id: e.id,
      period: e.period,
      evaluationDate: e.evaluationDate,
      behaviorScore: e.behaviorScore ? Number(e.behaviorScore) : null,
      discipline: e.discipline ? Number(e.discipline) : null,
      participation: e.participation ? Number(e.participation) : null,
      overallScore: e.overallScore ? Number(e.overallScore) : null,
      rating: e.rating,
      teacherNotes: e.teacherNotes,
      actionLabel: e.actionLabel,
    }));
  }

  async getProgressForStudent(studentId: string) {
    const [attendanceRes, hifzCount, revCount, results, evals] = await Promise.all([
      this.getAttendanceForStudent(studentId),
      this.prisma.memorizationRecord.count({ where: { studentId } }),
      this.prisma.revisionRecord.count({ where: { studentId } }),
      this.prisma.examResult.findMany({
        where: { studentId, isPublished: true, deletedAt: null },
        include: { exam: { select: { maxScore: true } } },
      }),
      this.prisma.studentEvaluation.findMany({
        where: { studentId, isPublished: true, deletedAt: null },
      }),
    ]);

    const examAverage = results.length > 0
      ? Number((results.reduce((acc, r) => acc + Number(r.percentage), 0) / results.length).toFixed(1))
      : 0;

    const evalScores = evals.map((e) => e.overallScore ? Number(e.overallScore) : null).filter((s): s is number => s !== null);
    const evalAverage = evalScores.length > 0
      ? Number((evalScores.reduce((a, b) => a + b, 0) / evalScores.length).toFixed(1))
      : 0;

    return {
      attendanceRate: attendanceRes.summary.attendanceRate,
      totalSessions: attendanceRes.summary.totalSessions,
      totalMemorizations: hifzCount,
      totalRevisions: revCount,
      totalExamsTaken: results.length,
      examAveragePercentage: examAverage,
      evaluationAverage: evalAverage,
      statusLabel: examAverage >= 90 && attendanceRes.summary.attendanceRate >= 90 ? 'متفوق ومتميز' : 'ملتزم بالخطة',
    };
  }
}
