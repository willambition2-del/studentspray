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
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      studentNumber: json['studentNumber'] as String?,
      halaqaName: json['halaqaName'] as String? ?? 'غير محدد',
      teacherName: json['teacherName'] as String? ?? 'غير محدد',
      teacherPhone: json['teacherPhone'] as String?,
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
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? json['title'] as String? ?? 'الخطة التعليمية',
      type: json['type'] as String? ?? 'HIFZ',
      totalItems: (json['totalItems'] as num?)?.toInt() ?? 0,
      completedItems: (json['completedItems'] as num?)?.toInt() ?? 0,
      progressPercentage: (json['progressPercentage'] as num?)?.toDouble() ?? 0.0,
      items: json['items'] as List? ?? [],
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
      totalSessions: (json['totalSessions'] as num?)?.toInt() ?? 0,
      presentCount: (json['presentCount'] as num?)?.toInt() ?? 0,
      absentCount: (json['absentCount'] as num?)?.toInt() ?? 0,
      lateCount: (json['lateCount'] as num?)?.toInt() ?? 0,
      excusedCount: (json['excusedCount'] as num?)?.toInt() ?? 0,
      attendanceRate: (json['attendanceRate'] as num?)?.toDouble() ?? 100.0,
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
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      examType: json['examType'] as String? ?? 'MONTHLY',
      scheduledDate: json['scheduledDate'] as String?,
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 100.0,
      passScore: (json['passScore'] as num?)?.toDouble(),
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
      id: json['id'] as String? ?? '',
      examId: json['examId'] as String?,
      examTitle: json['examTitle'] as String? ?? 'اختبار',
      examType: json['examType'] as String? ?? 'MONTHLY',
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 100.0,
      passScore: (json['passScore'] as num?)?.toDouble(),
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      isPassed: json['isPassed'] as bool? ?? false,
      status: json['status'] as String? ?? 'ENTERED',
      notes: json['notes'] as String?,
      date: json['date'] as String?,
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
      id: json['id'] as String? ?? '',
      period: json['period'] as String?,
      evaluationDate: json['evaluationDate'] as String? ?? '',
      behaviorScore: (json['behaviorScore'] as num?)?.toDouble(),
      discipline: (json['discipline'] as num?)?.toDouble(),
      participation: (json['participation'] as num?)?.toDouble(),
      overallScore: (json['overallScore'] as num?)?.toDouble(),
      rating: json['rating'] as String? ?? 'VERY_GOOD',
      teacherNotes: json['teacherNotes'] as String?,
      actionLabel: json['actionLabel'] as String?,
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
    final rawUpcoming = json['upcomingExams'] as List? ?? [];
    final rawResults = json['recentResults'] as List? ?? [];

    return StudentDashboardModel(
      student: StudentInfo.fromJson(json['student'] as Map<String, dynamic>? ?? {}),
      plan: json['plan'] != null ? PlanSummaryModel.fromJson(json['plan'] as Map<String, dynamic>) : null,
      attendance: AttendanceSummaryModel.fromJson(json['attendance'] as Map<String, dynamic>? ?? {}),
      totalMemorizations: (rawMem?['totalRecords'] as num?)?.toInt() ?? 0,
      totalRevisions: (rawRev?['totalRecords'] as num?)?.toInt() ?? 0,
      upcomingExams: rawUpcoming.map((e) => UpcomingExamModel.fromJson(e as Map<String, dynamic>)).toList(),
      recentResults: rawResults.map((r) => ExamResultModel.fromJson(r as Map<String, dynamic>)).toList(),
      latestEvaluation: json['latestEvaluation'] != null
          ? StudentEvaluationModel.fromJson(json['latestEvaluation'] as Map<String, dynamic>)
          : null,
    );
  }
}
