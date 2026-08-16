class SupervisorDashboardMetrics {
  final int totalHalaqas;
  final int totalTeachers;
  final int totalVisitsCompleted;
  final int totalVisitsPlanned;
  final int totalVisitsInProgress;
  final double averageEvaluationScore;
  final int openRecommendationsCount;
  final int overdueRecommendationsCount;

  const SupervisorDashboardMetrics({
    required this.totalHalaqas,
    required this.totalTeachers,
    required this.totalVisitsCompleted,
    required this.totalVisitsPlanned,
    required this.totalVisitsInProgress,
    required this.averageEvaluationScore,
    required this.openRecommendationsCount,
    required this.overdueRecommendationsCount,
  });

  factory SupervisorDashboardMetrics.fromJson(Map<String, dynamic> json) {
    return SupervisorDashboardMetrics(
      totalHalaqas: json['totalHalaqas'] as int? ?? 0,
      totalTeachers: json['totalTeachers'] as int? ?? 0,
      totalVisitsCompleted: json['totalVisitsCompleted'] as int? ?? 0,
      totalVisitsPlanned: json['totalVisitsPlanned'] as int? ?? 0,
      totalVisitsInProgress: json['totalVisitsInProgress'] as int? ?? 0,
      averageEvaluationScore: (json['averageEvaluationScore'] as num?)?.toDouble() ?? 0.0,
      openRecommendationsCount: json['openRecommendationsCount'] as int? ?? 0,
      overdueRecommendationsCount: json['overdueRecommendationsCount'] as int? ?? 0,
    );
  }
}

class SupervisorHalaqa {
  final String id;
  final String name;
  final String code;
  final String branchName;
  final int studentsCount;
  final int visitsCount;
  final List<Map<String, dynamic>> teachers;

  const SupervisorHalaqa({
    required this.id,
    required this.name,
    required this.code,
    required this.branchName,
    required this.studentsCount,
    required this.visitsCount,
    required this.teachers,
  });

  factory SupervisorHalaqa.fromJson(Map<String, dynamic> json) {
    return SupervisorHalaqa(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      branchName: json['branchName'] as String? ?? '',
      studentsCount: json['studentsCount'] as int? ?? 0,
      visitsCount: json['visitsCount'] as int? ?? 0,
      teachers: (json['teachers'] as List?)
              ?.map((t) => Map<String, dynamic>.from(t as Map))
              .toList() ??
          [],
    );
  }
}

class SupervisorTeacher {
  final String id;
  final String userId;
  final String displayName;
  final String username;
  final String? phone;
  final String? email;
  final String? specialization;
  final String? employeeNumber;
  final List<Map<String, dynamic>> halaqas;
  final Map<String, dynamic>? lastVisit;
  final int openRecommendationsCount;

  const SupervisorTeacher({
    required this.id,
    required this.userId,
    required this.displayName,
    required this.username,
    this.phone,
    this.email,
    this.specialization,
    this.employeeNumber,
    required this.halaqas,
    this.lastVisit,
    this.openRecommendationsCount = 0,
  });

  factory SupervisorTeacher.fromJson(Map<String, dynamic> json) {
    return SupervisorTeacher(
      id: json['id'] as String? ?? '',
      userId: json['userId'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      username: json['username'] as String? ?? '',
      phone: json['phone'] as String?,
      email: json['email'] as String?,
      specialization: json['specialization'] as String?,
      employeeNumber: json['employeeNumber'] as String?,
      halaqas: (json['halaqas'] as List?)
              ?.map((h) => Map<String, dynamic>.from(h as Map))
              .toList() ??
          [],
      lastVisit: json['lastVisit'] is Map<String, dynamic>
          ? Map<String, dynamic>.from(json['lastVisit'] as Map)
          : null,
      openRecommendationsCount: json['openRecommendationsCount'] as int? ?? 0,
    );
  }
}

class FieldVisitItem {
  final String id;
  final String visitNumber;
  final String visitType;
  final String status;
  final String? scheduledDate;
  final String? startedAt;
  final String? completedAt;
  final String? reason;
  final String? summary;
  final String? generalNotes;
  final String teacherName;
  final String halaqaName;
  final String halaqaId;
  final String teacherId;
  final double? evaluationScore;
  final String? evaluationLevel;
  final int recommendationsCount;

  const FieldVisitItem({
    required this.id,
    required this.visitNumber,
    required this.visitType,
    required this.status,
    this.scheduledDate,
    this.startedAt,
    this.completedAt,
    this.reason,
    this.summary,
    this.generalNotes,
    required this.teacherName,
    required this.halaqaName,
    required this.halaqaId,
    required this.teacherId,
    this.evaluationScore,
    this.evaluationLevel,
    this.recommendationsCount = 0,
  });

  factory FieldVisitItem.fromJson(Map<String, dynamic> json) {
    final teacher = json['teacher'] as Map<String, dynamic>?;
    final teacherUser = teacher?['user'] as Map<String, dynamic>?;
    final teacherName = teacherUser?['displayName'] as String? ??
        teacherUser?['username'] as String? ??
        'الأستاذ';

    final halaqa = json['halaqa'] as Map<String, dynamic>?;
    final halaqaName = halaqa?['name'] as String? ?? 'الحلقة';
    final halaqaId = json['halaqaId'] as String? ?? (halaqa?['id'] as String? ?? '');
    final teacherId = json['teacherId'] as String? ?? (teacher?['id'] as String? ?? '');

    final eval = json['evaluation'] as Map<String, dynamic>?;
    final score = (eval?['percentage'] as num?)?.toDouble() ??
        (eval?['totalScore'] as num?)?.toDouble();
    final level = eval?['level'] as String?;

    final count = json['_count'] as Map<String, dynamic>?;
    final recCount = count?['recommendations'] as int? ?? 0;

    return FieldVisitItem(
      id: json['id'] as String? ?? '',
      visitNumber: json['visitNumber'] as String? ?? '',
      visitType: json['visitType'] as String? ?? 'ROUTINE',
      status: json['status'] as String? ?? 'PLANNED',
      scheduledDate: json['scheduledDate'] as String?,
      startedAt: json['startedAt'] as String?,
      completedAt: json['completedAt'] as String?,
      reason: json['reason'] as String?,
      summary: json['summary'] as String?,
      generalNotes: json['generalNotes'] as String?,
      teacherName: teacherName,
      halaqaName: halaqaName,
      halaqaId: halaqaId,
      teacherId: teacherId,
      evaluationScore: score,
      evaluationLevel: level,
      recommendationsCount: recCount,
    );
  }
}

class EvaluationCriterionModel {
  final String id;
  final String name;
  final String? description;
  final String type;
  final double maxScore;
  final int order;

  const EvaluationCriterionModel({
    required this.id,
    required this.name,
    this.description,
    required this.type,
    required this.maxScore,
    required this.order,
  });

  factory EvaluationCriterionModel.fromJson(Map<String, dynamic> json) {
    return EvaluationCriterionModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'SCALE_5',
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 5.0,
      order: json['order'] as int? ?? 0,
    );
  }
}

class EvaluationAxisModel {
  final String id;
  final String name;
  final String? description;
  final double weight;
  final int order;
  final List<EvaluationCriterionModel> criteria;

  const EvaluationAxisModel({
    required this.id,
    required this.name,
    this.description,
    required this.weight,
    required this.order,
    required this.criteria,
  });

  factory EvaluationAxisModel.fromJson(Map<String, dynamic> json) {
    return EvaluationAxisModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      weight: (json['weight'] as num?)?.toDouble() ?? 0.0,
      order: json['order'] as int? ?? 0,
      criteria: (json['criteria'] as List?)
              ?.map((c) => EvaluationCriterionModel.fromJson(c as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class EvaluationTemplateModel {
  final String id;
  final String name;
  final String? description;
  final int version;
  final List<EvaluationAxisModel> axes;

  const EvaluationTemplateModel({
    required this.id,
    required this.name,
    this.description,
    required this.version,
    required this.axes,
  });

  factory EvaluationTemplateModel.fromJson(Map<String, dynamic> json) {
    return EvaluationTemplateModel(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      version: json['version'] as int? ?? 1,
      axes: (json['axes'] as List?)
              ?.map((a) => EvaluationAxisModel.fromJson(a as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class RecommendationModel {
  final String id;
  final String title;
  final String description;
  final String? domain;
  final String priority;
  final String status;
  final String? dueDate;
  final String? completedAt;
  final bool isOverdue;
  final String teacherName;
  final String halaqaName;
  final List<Map<String, dynamic>> followUps;

  const RecommendationModel({
    required this.id,
    required this.title,
    required this.description,
    this.domain,
    required this.priority,
    required this.status,
    this.dueDate,
    this.completedAt,
    this.isOverdue = false,
    required this.teacherName,
    required this.halaqaName,
    this.followUps = const [],
  });

  factory RecommendationModel.fromJson(Map<String, dynamic> json) {
    final teacher = json['teacher'] as Map<String, dynamic>?;
    final teacherUser = teacher?['user'] as Map<String, dynamic>?;
    final teacherName = teacherUser?['displayName'] as String? ?? 'المعلم';

    final halaqa = json['halaqa'] as Map<String, dynamic>?;
    final halaqaName = halaqa?['name'] as String? ?? 'الحلقة';

    return RecommendationModel(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      domain: json['domain'] as String?,
      priority: json['priority'] as String? ?? 'MEDIUM',
      status: json['status'] as String? ?? 'OPEN',
      dueDate: json['dueDate'] as String?,
      completedAt: json['completedAt'] as String?,
      isOverdue: json['isOverdue'] as bool? ?? false,
      teacherName: teacherName,
      halaqaName: halaqaName,
      followUps: (json['followUps'] as List?)
              ?.map((f) => Map<String, dynamic>.from(f as Map))
              .toList() ??
          [],
    );
  }
}
