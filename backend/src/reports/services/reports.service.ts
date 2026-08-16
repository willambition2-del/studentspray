import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AuditService } from '../../audit/audit.service';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';
import {
  AdminAlertStatus,
  AdminRequestStatus,
  AdminTaskStatus,
  AttendanceStatus,
  Prisma,
} from '../../generated/prisma/client';
import { ReportFilterDto } from '../dto/report-query.dto';
import { PdfGeneratorService } from './pdf-generator.service';
import { generateCsv } from '../utils/csv-exporter';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(AuditService) private readonly audit: AuditService,
    @Inject(PdfGeneratorService) private readonly pdfGenerator: PdfGeneratorService,
  ) {}

  // =========================================================================
  // 1. EXECUTIVE DASHBOARD SUMMARY
  // =========================================================================
  async getDashboardSummary(user: AuthenticatedUser) {
    const isEM = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    const branchFilter = isEM && user.branchId ? { branchId: user.branchId } : {};

    const [
      studentsCount,
      teachersCount,
      supervisorsCount,
      halaqasCount,
      attendanceStats,
      activePlansCount,
      openRequestsCount,
      openAlertsCount,
      overdueTasksCount,
      visitsCount,
      openRecommendationsCount,
      activitiesCount,
      competitionsCount,
    ] = await Promise.all([
      this.prisma.studentProfile.count({
        where: { user: { forumId: user.forumId, deletedAt: null, ...branchFilter } },
      }),
      this.prisma.teacherProfile.count({
        where: { user: { forumId: user.forumId, deletedAt: null, ...branchFilter } },
      }),
      this.prisma.supervisorProfile.count({
        where: { user: { forumId: user.forumId, deletedAt: null, ...branchFilter } },
      }),
      this.prisma.halaqa.count({
        where: { forumId: user.forumId, deletedAt: null, ...branchFilter },
      }),
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { session: { forumId: user.forumId, ...(branchFilter.branchId ? { halaqa: { branchId: branchFilter.branchId } } : {}) } },
        _count: { status: true },
      }),
      this.prisma.educationalPlan.count({
        where: { forumId: user.forumId, status: 'ACTIVE', deletedAt: null, ...(branchFilter.branchId ? { halaqa: { branchId: branchFilter.branchId } } : {}) },
      }),
      this.prisma.administrativeRequest.count({
        where: {
          forumId: user.forumId,
          status: { in: [AdminRequestStatus.SUBMITTED, AdminRequestStatus.UNDER_REVIEW] },
          deletedAt: null,
          ...branchFilter,
        },
      }),
      this.prisma.adminAlert.count({
        where: {
          forumId: user.forumId,
          status: { in: [AdminAlertStatus.OPEN, AdminAlertStatus.ACKNOWLEDGED] },
          ...branchFilter,
        },
      }),
      this.prisma.adminTask.count({
        where: {
          forumId: user.forumId,
          status: { in: [AdminTaskStatus.OPEN, AdminTaskStatus.IN_PROGRESS] },
          dueAt: { lt: new Date() },
          deletedAt: null,
          ...branchFilter,
        },
      }),
      this.prisma.fieldVisit.count({
        where: { forumId: user.forumId, deletedAt: null, ...(branchFilter.branchId ? { halaqa: { branchId: branchFilter.branchId } } : {}) },
      }),
      this.prisma.recommendation.count({
        where: {
          forumId: user.forumId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          deletedAt: null,
          ...(branchFilter.branchId ? { halaqa: { branchId: branchFilter.branchId } } : {})
        },
      }),
      this.prisma.activity.count({
        where: { forumId: user.forumId, deletedAt: null, ...branchFilter },
      }),
      this.prisma.competition.count({
        where: { forumId: user.forumId, deletedAt: null, ...branchFilter },
      }),
    ]);

    let totalAttendance = 0;
    let presentCount = 0;
    for (const stat of attendanceStats) {
      totalAttendance += stat._count.status;
      if (stat.status === AttendanceStatus.PRESENT) {
        presentCount += stat._count.status;
      }
    }
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    return {
      totalStudents: studentsCount,
      totalTeachers: teachersCount,
      totalSupervisors: supervisorsCount,
      totalHalaqas: halaqasCount,
      attendanceRate,
      activePlansCount,
      openRequestsCount,
      openAlertsCount,
      overdueTasksCount,
      fieldVisitsCount: visitsCount,
      openRecommendationsCount,
      activitiesCount,
      competitionsCount,
    };
  }

  // =========================================================================
  // 2. STUDENT COMPREHENSIVE REPORT
  // =========================================================================
  async getStudentReport(user: AuthenticatedUser, studentId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: {
        id: studentId,
        user: { forumId: user.forumId, deletedAt: null },
      },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            phone: true,
            branchId: true,
            branch: { select: { id: true, name: true } },
          },
        },
        halaqaMemberships: {
          where: { isActive: true },
          include: {
            halaqa: {
              include: {
                teachers: {
                  where: { isActive: true },
                  include: { teacher: { include: { user: { select: { displayName: true, username: true } } } } },
                },
              },
            },
          },
        },
      },
    });

    if (!student) throw new NotFoundException('Student not found');

    await this.verifyStudentReportAccess(user, student);

    const activeHalaqa = student.halaqaMemberships[0]?.halaqa;
    const primaryTeacher = activeHalaqa?.teachers[0]?.teacher?.user;

    const [
      attendanceStats,
      memorizationCount,
      revisionCount,
      recentMemorizations,
      recentRevisions,
      activePlan,
      examResults,
      studentEvaluations,
      activityRegistrations,
      awardsGranted,
    ] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { studentId: student.id },
        _count: { status: true },
      }),
      this.prisma.memorizationRecord.count({
        where: { studentId: student.id },
      }),
      this.prisma.revisionRecord.count({
        where: { studentId: student.id },
      }),
      this.prisma.memorizationRecord.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, surahNumber: true, fromAyah: true, toAyah: true, evaluationScore: true, date: true },
      }),
      this.prisma.revisionRecord.findMany({
        where: { studentId: student.id },
        orderBy: { date: 'desc' },
        take: 5,
        select: { id: true, surahNumber: true, fromAyah: true, toAyah: true, evaluationScore: true, date: true },
      }),
      this.prisma.educationalPlan.findFirst({
        where: { studentId: student.id, status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.examResult.findMany({
        where: {
          studentId: student.id,
          isPublished: true,
          deletedAt: null,
        },
        include: { exam: { select: { id: true, title: true, maxScore: true, passScore: true } } },
      }),
      this.prisma.studentEvaluation.findMany({
        where: { studentId: student.id, deletedAt: null },
        orderBy: { evaluationDate: 'desc' },
        take: 3,
      }),
      this.prisma.activityParticipant.findMany({
        where: { studentId: student.id },
        include: { activity: { select: { id: true, title: true, type: true, startsAt: true } } },
      }),
      this.prisma.studentAward.findMany({
        where: { studentId: student.id },
        include: { award: { select: { id: true, name: true, type: true } } },
      }),
    ]);

    let totalAttendanceSessions = 0;
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;

    for (const stat of attendanceStats) {
      totalAttendanceSessions += stat._count.status;
      if (stat.status === AttendanceStatus.PRESENT) presentCount += stat._count.status;
      else if (stat.status === AttendanceStatus.ABSENT) absentCount += stat._count.status;
      else if (stat.status === AttendanceStatus.LATE) lateCount += stat._count.status;
      else if (stat.status === AttendanceStatus.EXCUSED) excusedCount += stat._count.status;
    }

    const attendanceRate =
      totalAttendanceSessions > 0 ? Math.round((presentCount / totalAttendanceSessions) * 100) : 0;

    return {
      student: {
        id: student.id,
        studentNumber: student.studentNumber,
        name: student.user?.displayName || student.user?.username || 'طالب',
        email: student.user?.email,
        phone: student.user?.phone,
        branchName: student.user?.branch?.name,
        halaqaName: activeHalaqa?.name,
        teacherName: primaryTeacher?.displayName || primaryTeacher?.username,
      },
      attendance: {
        totalSessions: totalAttendanceSessions,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        excused: excusedCount,
        rate: attendanceRate,
      },
      memorization: {
        completedRecords: memorizationCount,
        recentRecords: recentMemorizations.map((r) => ({
          ...r,
          evaluationScore: Number(r.evaluationScore),
        })),
      },
      revision: {
        completedRecords: revisionCount,
        recentRecords: recentRevisions.map((r) => ({
          ...r,
          evaluationScore: Number(r.evaluationScore),
        })),
      },
      plan: activePlan
        ? {
            id: activePlan.id,
            name: activePlan.name,
            type: activePlan.type,
          }
        : null,
      exams: examResults.map((r) => ({
        id: r.id,
        examTitle: r.exam.title,
        score: Number(r.score),
        maxScore: Number(r.exam.maxScore),
        passed: r.isPassed,
      })),
      evaluations: studentEvaluations.map((ev) => ({
        id: ev.id,
        score: Number(ev.overallScore ?? 0),
        evaluationDate: ev.evaluationDate,
        notes: ev.teacherNotes,
      })),
      activities: activityRegistrations.map((a) => ({
        id: a.activityId,
        title: a.activity.title,
        type: a.activity.type,
        status: a.attendanceStatus,
      })),
      awards: awardsGranted.map((aw) => ({
        id: aw.awardId,
        title: aw.award.name,
        category: aw.award.type,
        grantedAt: aw.awardedAt,
      })),
    };
  }

  // =========================================================================
  // 3. STUDENT REPORT PDF EXPORT
  // =========================================================================
  async getStudentReportPdf(user: AuthenticatedUser, studentId: string): Promise<Buffer> {
    const data = await this.getStudentReport(user, studentId);
    const forum = await this.prisma.forum.findUnique({ where: { id: user.forumId } });

    const pdfBuffer = await this.pdfGenerator.generateDocument({
      forumName: forum?.name || 'الملتقى القرآني',
      branchName: data.student.branchName,
      reportTitle: `تقرير أداء الطالب: ${data.student.name}`,
      subtitle: `رقم الطالب: ${data.student.studentNumber || '-'} — الحلقة: ${data.student.halaqaName || '-'}`,
      metadata: [
        { label: 'المعلم المشرف', value: data.student.teacherName || '-' },
        { label: 'نسبة الحضور', value: `${data.attendance.rate}%` },
        { label: 'الخطة النشطة', value: data.plan?.name || 'غير مسجل' },
      ],
      summaryBoxes: [
        { label: 'جلسات الحضور', value: data.attendance.present },
        { label: 'سجلات الحفظ', value: data.memorization.completedRecords },
        { label: 'سجلات المراجعة', value: data.revision.completedRecords },
        { label: 'أوسمة التميز', value: data.awards.length },
      ],
      tables: [
        {
          title: 'نتائج الاختبارات والتقييمات الرسمية',
          headers: ['اسم الاختبار', 'الدرجة المحصلة', 'الدرجة العظمى', 'النتيجة'],
          rows:
            data.exams.length > 0
              ? data.exams.map((ex) => [
                  ex.examTitle,
                  String(ex.score),
                  String(ex.maxScore),
                  ex.passed ? 'ناجح' : 'راسب',
                ])
              : [['لا توجد اختبارات معتمدة مسجلة', '-', '-', '-']],
        },
        {
          title: 'المسابقات والأوسمة المكتسبة',
          headers: ['عنوان الوسام / الفعالية', 'التصنيف', 'تاريخ المنح'],
          rows:
            data.awards.length > 0
              ? data.awards.map((aw) => [
                  aw.title,
                  aw.category,
                  aw.grantedAt ? new Date(aw.grantedAt).toISOString().split('T')[0] : '-',
                ])
              : [['لا توجد أوسمة ممنوحة حتى الآن', '-', '-']],
        },
      ],
      notes: [
        'هذا المستند معتمد وصادر إلكترونياً من المركز التعليمي للقرآن الكريم.',
        'أي تعديل يدوي أو كشط يلغي صحة المستند.',
      ],
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'REPORT_EXPORTED',
      entityType: 'Student',
      entityId: studentId,
      after: { format: 'PDF', reportType: 'STUDENT_REPORT' },
    });

    return pdfBuffer;
  }

  // =========================================================================
  // 4. HALAQA REPORT
  // =========================================================================
  async getHalaqaReport(user: AuthenticatedUser, halaqaId: string) {
    const halaqa = await this.prisma.halaqa.findFirst({
      where: { id: halaqaId, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
        teachers: {
          where: { isActive: true },
          include: { teacher: { include: { user: { select: { id: true, displayName: true, username: true } } } } },
        },
        supervisors: {
          where: { isActive: true },
          include: { supervisor: { include: { user: { select: { id: true, displayName: true, username: true } } } } },
        },
        members: {
          where: { isActive: true },
          include: {
            student: {
              include: { user: { select: { displayName: true, username: true } } },
            },
          },
        },
      },
    });

    if (!halaqa) throw new NotFoundException('Halaqa not found');

    await this.verifyHalaqaReportAccess(user, halaqa);

    const studentIds = halaqa.members.map((m) => m.studentId);

    const [attendanceGroup, memorizationCount, revisionCount, examsCount] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: { session: { halaqaId: halaqa.id, forumId: user.forumId } },
        _count: { status: true },
      }),
      this.prisma.memorizationRecord.count({
        where: { halaqaId: halaqa.id },
      }),
      this.prisma.revisionRecord.count({
        where: { halaqaId: halaqa.id },
      }),
      this.prisma.examResult.count({
        where: { studentId: { in: studentIds }, isPublished: true, deletedAt: null },
      }),
    ]);

    let totalAttendance = 0;
    let presentCount = 0;
    for (const stat of attendanceGroup) {
      totalAttendance += stat._count.status;
      if (stat.status === AttendanceStatus.PRESENT) presentCount += stat._count.status;
    }
    const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

    const primaryTeacher = halaqa.teachers[0]?.teacher.user;
    const supervisorUser = halaqa.supervisors[0]?.supervisor.user;

    return {
      halaqa: {
        id: halaqa.id,
        name: halaqa.name,
        branchName: halaqa.branch?.name,
        teacherName: primaryTeacher?.displayName || primaryTeacher?.username,
        supervisorName: supervisorUser?.displayName || supervisorUser?.username,
        studentCount: halaqa.members.length,
      },
      stats: {
        attendanceRate,
        totalMemorizationRecords: memorizationCount,
        totalRevisionRecords: revisionCount,
        totalExamResults: examsCount,
      },
      students: halaqa.members.map((m) => ({
        id: m.student.id,
        studentNumber: m.student.studentNumber,
        name: m.student.user?.displayName || m.student.user?.username,
      })),
    };
  }

  async getHalaqaReportPdf(user: AuthenticatedUser, halaqaId: string): Promise<Buffer> {
    const data = await this.getHalaqaReport(user, halaqaId);
    const forum = await this.prisma.forum.findUnique({ where: { id: user.forumId } });

    const pdfBuffer = await this.pdfGenerator.generateDocument({
      forumName: forum?.name || 'الملتقى القرآني',
      branchName: data.halaqa.branchName,
      reportTitle: `تقرير أداء الحلقة: ${data.halaqa.name}`,
      subtitle: `المعلم: ${data.halaqa.teacherName || '-'} — المشرف الفني: ${data.halaqa.supervisorName || '-'}`,
      metadata: [
        { label: 'عدد الطلاب', value: String(data.halaqa.studentCount) },
        { label: 'نسبة الحضور', value: `${data.stats.attendanceRate}%` },
      ],
      summaryBoxes: [
        { label: 'إجمالي الطلاب', value: data.halaqa.studentCount },
        { label: 'سجلات الحفظ', value: data.stats.totalMemorizationRecords },
        { label: 'سجلات المراجعة', value: data.stats.totalRevisionRecords },
        { label: 'نتائج الاختبارات', value: data.stats.totalExamResults },
      ],
      tables: [
        {
          title: 'قائمة طلاب الحلقة المقيدين',
          headers: ['رقم الطالب', 'اسم الطالب'],
          rows:
            data.students.length > 0
              ? data.students.map((st) => [st.studentNumber || '-', st.name || 'طالب'])
              : [['-', 'لا يوجد طلاب مسجلون حالياً']],
        },
      ],
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'REPORT_EXPORTED',
      entityType: 'Halaqa',
      entityId: halaqaId,
      after: { format: 'PDF', reportType: 'HALAQA_REPORT' },
    });

    return pdfBuffer;
  }

  // =========================================================================
  // 5. ATTENDANCE REPORTS & CSV EXPORT
  // =========================================================================
  async getAttendanceReport(user: AuthenticatedUser, query: ReportFilterDto = new ReportFilterDto()) {
    const sessionWhere: Prisma.AttendanceSessionWhereInput = {
      forumId: user.forumId,
      ...(query.halaqaId ? { halaqaId: query.halaqaId } : {}),
      ...(query.branchId ? { halaqa: { branchId: query.branchId } } : {}),
    };

    if (query.dateFrom || query.dateTo) {
      sessionWhere.sessionDate = {
        ...(query.dateFrom ? { gte: new Date(query.dateFrom) } : {}),
        ...(query.dateTo ? { lte: new Date(query.dateTo) } : {}),
      };
    }

    const recordWhere: Prisma.AttendanceRecordWhereInput = {
      session: sessionWhere,
      ...(query.studentId ? { studentId: query.studentId } : {}),
    };

    const [stats, records] = await Promise.all([
      this.prisma.attendanceRecord.groupBy({
        by: ['status'],
        where: recordWhere,
        _count: { status: true },
      }),
      this.prisma.attendanceRecord.findMany({
        where: recordWhere,
        take: query.limit || 50,
        skip: query.page ? (query.page - 1) * (query.limit || 50) : 0,
        orderBy: { recordedAt: 'desc' },
        include: {
          student: { include: { user: { select: { displayName: true, username: true } } } },
          session: {
            include: {
              halaqa: { include: { branch: { select: { name: true } } } },
            },
          },
        },
      }),
    ]);

    let total = 0;
    let present = 0;
    let absent = 0;
    let late = 0;
    let excused = 0;

    for (const stat of stats) {
      total += stat._count.status;
      if (stat.status === AttendanceStatus.PRESENT) present += stat._count.status;
      else if (stat.status === AttendanceStatus.ABSENT) absent += stat._count.status;
      else if (stat.status === AttendanceStatus.LATE) late += stat._count.status;
      else if (stat.status === AttendanceStatus.EXCUSED) excused += stat._count.status;
    }

    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    return {
      summary: { total, present, absent, late, excused, rate },
      records: records.map((r) => ({
        id: r.id,
        date: r.session.sessionDate.toISOString().split('T')[0],
        studentName: r.student?.user?.displayName || r.student?.user?.username,
        halaqaName: r.session.halaqa?.name,
        branchName: r.session.halaqa?.branch?.name,
        status: r.status,
      })),
    };
  }

  async exportAttendanceCsv(user: AuthenticatedUser, query: ReportFilterDto = new ReportFilterDto()): Promise<string> {
    const report = await this.getAttendanceReport(user, { ...query, limit: 1000 });

    const headers = ['التاريخ', 'اسم الطالب', 'الحلقة', 'الفرع', 'حالة الحضور'];
    const rows = report.records.map((r) => [
      r.date,
      r.studentName || 'طالب',
      r.halaqaName || 'حلقة',
      r.branchName || 'فرع',
      this.mapAttendanceStatusAr(r.status),
    ]);

    await this.audit.record({
      actorUserId: user.id,
      action: 'REPORT_EXPORTED',
      entityType: 'AttendanceRecord',
      after: { format: 'CSV', reportType: 'ATTENDANCE_REPORT', rowCount: rows.length },
    });

    return generateCsv(headers, rows);
  }

  // =========================================================================
  // 6. EXAM RESULTS REPORT
  // =========================================================================
  async getExamReport(user: AuthenticatedUser, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true } },
        halaqa: { select: { id: true, name: true } },
        results: {
          where: { isPublished: true, deletedAt: null },
          include: { student: { include: { user: { select: { displayName: true, username: true } } } } },
        },
      },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    const scores = exam.results.map((r) => Number(r.score));
    const count = scores.length;
    const avgScore = count > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / count) : 0;
    const maxAchieved = count > 0 ? Math.max(...scores) : 0;
    const minAchieved = count > 0 ? Math.min(...scores) : 0;
    const passedCount = exam.results.filter((r) => r.isPassed).length;
    const passRate = count > 0 ? Math.round((passedCount / count) * 100) : 0;

    return {
      exam: {
        id: exam.id,
        title: exam.title,
        maxScore: Number(exam.maxScore),
        passScore: Number(exam.passScore),
        branchName: exam.branch?.name,
        halaqaName: exam.halaqa?.name,
      },
      stats: {
        totalExaminees: count,
        passedCount,
        passRate,
        averageScore: avgScore,
        highestScore: maxAchieved,
        lowestScore: minAchieved,
      },
      results: exam.results.map((r) => ({
        id: r.id,
        studentName: r.student.user?.displayName || r.student.user?.username,
        score: Number(r.score),
        passed: r.isPassed,
      })),
    };
  }

  // =========================================================================
  // 7. TEACHER & SUPERVISOR REPORTS
  // =========================================================================
  async getTeacherReport(user: AuthenticatedUser, teacherId: string) {
    const teacher = await this.prisma.teacherProfile.findFirst({
      where: { id: teacherId, user: { forumId: user.forumId, deletedAt: null } },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            phone: true,
            branch: { select: { id: true, name: true } },
          },
        },
        halaqas: {
          where: { isActive: true },
          include: {
            halaqa: {
              include: { members: { where: { isActive: true } } },
            },
          },
        },
      },
    });

    if (!teacher) throw new NotFoundException('Teacher not found');

    const totalStudents = teacher.halaqas.reduce((acc: number, h) => acc + h.halaqa.members.length, 0);

    const [visitsCount, tasksAssignedCount] = await Promise.all([
      this.prisma.fieldVisit.count({
        where: { teacherId: teacher.id, status: 'COMPLETED', deletedAt: null },
      }),
      this.prisma.adminTask.count({
        where: { assignedToId: teacher.userId, deletedAt: null },
      }),
    ]);

    return {
      teacher: {
        id: teacher.id,
        name: teacher.user?.displayName || teacher.user?.username,
        email: teacher.user?.email,
        phone: teacher.user?.phone,
        branchName: teacher.user?.branch?.name,
        halaqasCount: teacher.halaqas.length,
        totalStudents,
      },
      stats: {
        fieldVisitsReceived: visitsCount,
        administrativeTasksAssigned: tasksAssignedCount,
      },
      halaqas: teacher.halaqas.map((h) => ({
        id: h.halaqa.id,
        name: h.halaqa.name,
        studentCount: h.halaqa.members.length,
      })),
    };
  }

  async getSupervisorReport(user: AuthenticatedUser, supervisorId: string) {
    const supervisor = await this.prisma.supervisorProfile.findFirst({
      where: { id: supervisorId, user: { forumId: user.forumId, deletedAt: null } },
      include: {
        user: {
          select: {
            id: true,
            displayName: true,
            username: true,
            email: true,
            phone: true,
            branch: { select: { id: true, name: true } },
          },
        },
        halaqas: {
          where: { isActive: true },
          include: {
            halaqa: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!supervisor) throw new NotFoundException('Supervisor not found');

    const [visitsCompleted, openRecommendations] = await Promise.all([
      this.prisma.fieldVisit.count({
        where: { supervisorId: supervisor.id, status: 'COMPLETED', deletedAt: null },
      }),
      this.prisma.recommendation.count({
        where: { createdById: supervisor.userId, status: { in: ['OPEN', 'IN_PROGRESS'] }, deletedAt: null },
      }),
    ]);

    return {
      supervisor: {
        id: supervisor.id,
        name: supervisor.user?.displayName || supervisor.user?.username,
        email: supervisor.user?.email,
        phone: supervisor.user?.phone,
        branchName: supervisor.user?.branch?.name,
        supervisedHalaqasCount: supervisor.halaqas.length,
      },
      stats: {
        visitsCompleted,
        openRecommendations,
      },
    };
  }

  // =========================================================================
  // 8. ADMINISTRATIVE REPORT
  // =========================================================================
  async getAdministrativeReport(user: AuthenticatedUser, query: ReportFilterDto = new ReportFilterDto()) {
    const where: Prisma.AdministrativeRequestWhereInput = { forumId: user.forumId, deletedAt: null };

    const [requestsByStatus, decisionsCount, openTasksCount, overdueTasksCount, openAlertsCount] =
      await Promise.all([
        this.prisma.administrativeRequest.groupBy({
          by: ['status'],
          where,
          _count: { status: true },
        }),
        this.prisma.adminDecision.count({
          where: { forumId: user.forumId, status: 'ACTIVE', deletedAt: null },
        }),
        this.prisma.adminTask.count({
          where: {
            forumId: user.forumId,
            status: { in: [AdminTaskStatus.OPEN, AdminTaskStatus.IN_PROGRESS] },
            deletedAt: null,
          },
        }),
        this.prisma.adminTask.count({
          where: {
            forumId: user.forumId,
            status: { in: [AdminTaskStatus.OPEN, AdminTaskStatus.IN_PROGRESS] },
            dueAt: { lt: new Date() },
            deletedAt: null,
          },
        }),
        this.prisma.adminAlert.count({
          where: { forumId: user.forumId, status: AdminAlertStatus.OPEN },
        }),
      ]);

    return {
      requests: requestsByStatus.map((r) => ({ status: r.status, count: r._count.status })),
      activeDecisionsCount: decisionsCount,
      openTasksCount,
      overdueTasksCount,
      openAlertsCount,
    };
  }

  // =========================================================================
  // 9. STUDENTS CSV EXPORT
  // =========================================================================
  async exportStudentsCsv(user: AuthenticatedUser, query: ReportFilterDto = new ReportFilterDto()): Promise<string> {
    const students = await this.prisma.studentProfile.findMany({
      where: {
        user: {
          forumId: user.forumId,
          deletedAt: null,
          ...(query.branchId ? { branchId: query.branchId } : {}),
        },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            displayName: true,
            username: true,
            phone: true,
            branch: { select: { name: true } },
          },
        },
        halaqaMemberships: {
          where: { isActive: true },
          include: { halaqa: { select: { name: true } } },
        },
      },
    });

    const headers = ['رقم الطالب', 'الاسم', 'اسم المستخدم', 'رقم الهاتف', 'الفرع', 'الحلقة'];
    const rows = students.map((s) => [
      s.studentNumber || '-',
      s.user?.displayName || s.user?.username || '-',
      s.user?.username || '-',
      s.user?.phone || '-',
      s.user?.branch?.name || '-',
      s.halaqaMemberships[0]?.halaqa?.name || '-',
    ]);

    await this.audit.record({
      actorUserId: user.id,
      action: 'REPORT_EXPORTED',
      entityType: 'StudentProfile',
      after: { format: 'CSV', reportType: 'STUDENTS_LIST', rowCount: rows.length },
    });

    return generateCsv(headers, rows);
  }

  // =========================================================================
  // HELPERS & SECURITY SCOPE CHECKS (IDOR PREVENTION)
  // =========================================================================
  private async verifyStudentReportAccess(user: AuthenticatedUser, student: any) {
    const isGM = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    if (isGM) return;

    const isEM = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    if (isEM) {
      if (user.branchId && student.user?.branchId && student.user.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied outside your branch scope');
      }
      return;
    }

    const isTeacher = user.roles.some((r) => r.name === 'TEACHER');
    if (isTeacher) {
      const teacher = await this.prisma.teacherProfile.findFirst({ where: { userId: user.id } });
      if (!teacher) {
        throw new ForbiddenException('Access denied');
      }
      const studentHalaqaIds = student.halaqaMemberships.map((m: any) => m.halaqaId);
      const teacherHalaqa = await this.prisma.halaqaTeacher.findFirst({
        where: { teacherId: teacher.id, halaqaId: { in: studentHalaqaIds } },
      });
      if (!teacherHalaqa) {
        throw new ForbiddenException('You can only view reports of students in your assigned halaqat');
      }
      return;
    }

    const isParent = user.roles.some((r) => r.name === 'PARENT');
    if (isParent) {
      const parent = await this.prisma.parentProfile.findFirst({ where: { userId: user.id } });
      if (!parent) throw new ForbiddenException('Parent profile not found');
      const relation = await this.prisma.studentGuardian.findFirst({
        where: { parentId: parent.id, studentId: student.id },
      });
      if (!relation) {
        throw new ForbiddenException('You can only view reports for your own registered children');
      }
      return;
    }

    const isStudent = user.roles.some((r) => r.name === 'STUDENT');
    if (isStudent) {
      if (student.userId !== user.id) {
        throw new ForbiddenException('You can only view your own student report');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions to view this report');
  }

  private async verifyHalaqaReportAccess(user: AuthenticatedUser, halaqa: any) {
    const isGM = user.roles.some((r) => r.name === 'GENERAL_MANAGER');
    if (isGM) return;

    const isEM = user.roles.some((r) => r.name === 'EXECUTIVE_MANAGER');
    if (isEM) {
      if (user.branchId && halaqa.branchId && halaqa.branchId !== user.branchId) {
        throw new ForbiddenException('Access denied outside your branch scope');
      }
      return;
    }

    const isTeacher = user.roles.some((r) => r.name === 'TEACHER');
    if (isTeacher) {
      const teacher = await this.prisma.teacherProfile.findFirst({ where: { userId: user.id } });
      const isAssigned = halaqa.teachers.some((t: any) => t.teacherId === teacher?.id);
      if (!teacher || !isAssigned) {
        throw new ForbiddenException('You can only view reports for your assigned halaqat');
      }
      return;
    }

    const isSupervisor = user.roles.some((r) => r.name === 'TECHNICAL_SUPERVISOR');
    if (isSupervisor) {
      const supervisor = await this.prisma.supervisorProfile.findFirst({ where: { userId: user.id } });
      const isSupervised = halaqa.supervisors.some((s: any) => s.supervisorId === supervisor?.id);
      if (!supervisor || !isSupervised) {
        throw new ForbiddenException('You can only view reports for halaqat assigned to your supervision');
      }
      return;
    }

    throw new ForbiddenException('Insufficient permissions to view this halaqa report');
  }

  private mapAttendanceStatusAr(status: AttendanceStatus): string {
    switch (status) {
      case AttendanceStatus.PRESENT:
        return 'حاضر';
      case AttendanceStatus.ABSENT:
        return 'غائب';
      case AttendanceStatus.LATE:
        return 'متأخر';
      case AttendanceStatus.EXCUSED:
        return 'مستأذن';
      default:
        return String(status);
    }
  }
}
