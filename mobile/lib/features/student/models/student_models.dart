import '../../../core/utils/api_parsing.dart';

class StudentInfo {
  final String id;
  final String name;
  final String? studentNumber;
  final String halaqaName;
  final String teacherName;
  final String? teacherPhone;

  StudentInfo({
    required this.id,
    required this.name,
    this.studentNumber,
    required this.halaqaName,
    required this.teacherName,
    this.teacherPhone,
  });

  factory StudentInfo.fromJson(Map<String, dynamic> json) {
    return StudentInfo(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      studentNumber: ApiParsing.parseString(json['studentNumber']),
      halaqaName: ApiParsing.parseString(json['halaqaName'], 'غير محدد')!,
      teacherName: ApiParsing.parseString(json['teacherName'], 'غير محدد')!,
      teacherPhone: ApiParsing.parseString(json['teacherPhone']),
    );
  }
}

class PlanSummaryModel {
  final String id;
  final String name;
  final String type;
  final int totalItems;
  final int completedItems;
  final double progressPercentage;
  final List<dynamic> items;

  PlanSummaryModel({
    required this.id,
    required this.name,
    required this.type,
    required this.totalItems,
    required this.completedItems,
    required this.progressPercentage,
    required this.items,
  });

  factory PlanSummaryModel.fromJson(Map<String, dynamic> json) {
    return PlanSummaryModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? ApiParsing.parseString(json['title'], 'الخطة التعليمية')!,
      type: ApiParsing.parseString(json['type'], 'HIFZ')!,
      totalItems: ApiParsing.parseInt(json['totalItems'], 0)!,
      completedItems: ApiParsing.parseInt(json['completedItems'], 0)!,
      progressPercentage: ApiParsing.parseDouble(json['progressPercentage'], 0.0)!,
      items: ApiParsing.extractList(json['items']),
    );
  }
}

class AttendanceSummaryModel {
  final int totalSessions;
  final int presentCount;
  final int absentCount;
  final int lateCount;
  final int excusedCount;
  final double attendanceRate;

  AttendanceSummaryModel({
    required this.totalSessions,
    required this.presentCount,
    required this.absentCount,
    required this.lateCount,
    required this.excusedCount,
    required this.attendanceRate,
  });

  factory AttendanceSummaryModel.fromJson(Map<String, dynamic> json) {
    return AttendanceSummaryModel(
      totalSessions: ApiParsing.parseInt(json['totalSessions'], 0)!,
      presentCount: ApiParsing.parseInt(json['presentCount'], 0)!,
      absentCount: ApiParsing.parseInt(json['absentCount'], 0)!,
      lateCount: ApiParsing.parseInt(json['lateCount'], 0)!,
      excusedCount: ApiParsing.parseInt(json['excusedCount'], 0)!,
      attendanceRate: ApiParsing.parseDouble(json['attendanceRate'], 100.0)!,
    );
  }
}

class UpcomingExamModel {
  final String id;
  final String title;
  final String examType;
  final String? scheduledDate;
  final double maxScore;
  final double? passScore;

  UpcomingExamModel({
    required this.id,
    required this.title,
    required this.examType,
    this.scheduledDate,
    required this.maxScore,
    this.passScore,
  });

  factory UpcomingExamModel.fromJson(Map<String, dynamic> json) {
    return UpcomingExamModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      title: ApiParsing.parseString(json['title']) ?? '',
      examType: ApiParsing.parseString(json['examType'], 'MONTHLY')!,
      scheduledDate: ApiParsing.parseString(json['scheduledDate']),
      maxScore: ApiParsing.parseDouble(json['maxScore'], 100.0)!,
      passScore: ApiParsing.parseDouble(json['passScore']),
    );
  }
}

class ExamResultModel {
  final String id;
  final String? examId;
  final String examTitle;
  final String examType;
  final double score;
  final double maxScore;
  final double? passScore;
  final double percentage;
  final bool isPassed;
  final String status;
  final String? notes;
  final String? date;

  ExamResultModel({
    required this.id,
    this.examId,
    required this.examTitle,
    required this.examType,
    required this.score,
    required this.maxScore,
    this.passScore,
    required this.percentage,
    required this.isPassed,
    required this.status,
    this.notes,
    this.date,
  });

  factory ExamResultModel.fromJson(Map<String, dynamic> json) {
    return ExamResultModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      examId: ApiParsing.parseString(json['examId']),
      examTitle: ApiParsing.parseString(json['examTitle'], 'اختبار')!,
      examType: ApiParsing.parseString(json['examType'], 'MONTHLY')!,
      score: ApiParsing.parseDouble(json['score'], 0.0)!,
      maxScore: ApiParsing.parseDouble(json['maxScore'], 100.0)!,
      passScore: ApiParsing.parseDouble(json['passScore']),
      percentage: ApiParsing.parseDouble(json['percentage'], 0.0)!,
      isPassed: ApiParsing.parseBool(json['isPassed'], false)!,
      status: ApiParsing.parseString(json['status'], 'ENTERED')!,
      notes: ApiParsing.parseString(json['notes']),
      date: ApiParsing.parseString(json['date']),
    );
  }
}

class StudentEvaluationModel {
  final String id;
  final String? period;
  final String evaluationDate;
  final double? behaviorScore;
  final double? discipline;
  final double? participation;
  final double? overallScore;
  final String rating;
  final String? teacherNotes;
  final String? actionLabel;

  StudentEvaluationModel({
    required this.id,
    this.period,
    required this.evaluationDate,
    this.behaviorScore,
    this.discipline,
    this.participation,
    this.overallScore,
    required this.rating,
    this.teacherNotes,
    this.actionLabel,
  });

  factory StudentEvaluationModel.fromJson(Map<String, dynamic> json) {
    return StudentEvaluationModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      period: ApiParsing.parseString(json['period']),
      evaluationDate: ApiParsing.parseString(json['evaluationDate']) ?? '',
      behaviorScore: ApiParsing.parseDouble(json['behaviorScore']),
      discipline: ApiParsing.parseDouble(json['discipline']),
      participation: ApiParsing.parseDouble(json['participation']),
      overallScore: ApiParsing.parseDouble(json['overallScore']),
      rating: ApiParsing.parseString(json['rating'], 'VERY_GOOD')!,
      teacherNotes: ApiParsing.parseString(json['teacherNotes']),
      actionLabel: ApiParsing.parseString(json['actionLabel']),
    );
  }
}

class StudentDashboardModel {
  final StudentInfo student;
  final PlanSummaryModel? plan;
  final AttendanceSummaryModel attendance;
  final int totalMemorizations;
  final int totalRevisions;
  final List<UpcomingExamModel> upcomingExams;
  final List<ExamResultModel> recentResults;
  final StudentEvaluationModel? latestEvaluation;

  StudentDashboardModel({
    required this.student,
    this.plan,
    required this.attendance,
    required this.totalMemorizations,
    required this.totalRevisions,
    required this.upcomingExams,
    required this.recentResults,
    this.latestEvaluation,
  });

  factory StudentDashboardModel.fromJson(Map<String, dynamic> json) {
    final rawMem = json['memorization'] as Map<String, dynamic>?;
    final rawRev = json['revision'] as Map<String, dynamic>?;
    final rawUpcoming = ApiParsing.extractList(json['upcomingExams']);
    final rawResults = ApiParsing.extractList(json['recentResults']);

    return StudentDashboardModel(
      student: StudentInfo.fromJson(json['student'] as Map<String, dynamic>? ?? {}),
      plan: json['plan'] != null ? PlanSummaryModel.fromJson(json['plan'] as Map<String, dynamic>) : null,
      attendance: AttendanceSummaryModel.fromJson(json['attendance'] as Map<String, dynamic>? ?? {}),
      totalMemorizations: ApiParsing.parseInt(rawMem?['totalRecords'], 0)!,
      totalRevisions: ApiParsing.parseInt(rawRev?['totalRecords'], 0)!,
      upcomingExams: rawUpcoming.map((e) => UpcomingExamModel.fromJson(e as Map<String, dynamic>)).toList(),
      recentResults: rawResults.map((r) => ExamResultModel.fromJson(r as Map<String, dynamic>)).toList(),
      latestEvaluation: json['latestEvaluation'] != null
          ? StudentEvaluationModel.fromJson(json['latestEvaluation'] as Map<String, dynamic>)
          : null,
    );
  }
}

class StudentProgressHistoryPoint {
  final String period;
  final String label;
  final int memorized;
  final int revision;
  final int cumulativeMemorized;
  final int cumulativeRevision;

  StudentProgressHistoryPoint({
    required this.period,
    required this.label,
    required this.memorized,
    required this.revision,
    required this.cumulativeMemorized,
    required this.cumulativeRevision,
  });

  factory StudentProgressHistoryPoint.fromJson(Map<String, dynamic> json) {
    return StudentProgressHistoryPoint(
      period: ApiParsing.parseString(json['period']) ?? '',
      label: ApiParsing.parseString(json['label']) ?? '',
      memorized: ApiParsing.parseInt(json['memorized'], 0)!,
      revision: ApiParsing.parseInt(json['revision'], 0)!,
      cumulativeMemorized: ApiParsing.parseInt(json['cumulativeMemorized'], 0)!,
      cumulativeRevision: ApiParsing.parseInt(json['cumulativeRevision'], 0)!,
    );
  }
}

class StudentProgressHistoryModel {
  final String studentId;
  final int totalRecords;
  final List<StudentProgressHistoryPoint> points;

  StudentProgressHistoryModel({
    required this.studentId,
    required this.totalRecords,
    required this.points,
  });

  factory StudentProgressHistoryModel.fromJson(Map<String, dynamic> json) {
    final rawPoints = ApiParsing.extractList(json['points']);
    return StudentProgressHistoryModel(
      studentId: ApiParsing.parseString(json['studentId']) ?? '',
      totalRecords: ApiParsing.parseInt(json['totalRecords'], 0)!,
      points: rawPoints.map((p) => StudentProgressHistoryPoint.fromJson(p as Map<String, dynamic>)).toList(),
    );
  }
}
