import '../../../core/utils/api_parsing.dart';

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
      totalHalaqas: ApiParsing.parseInt(json['totalHalaqas'], 0)!,
      totalTeachers: ApiParsing.parseInt(json['totalTeachers'], 0)!,
      totalVisitsCompleted: ApiParsing.parseInt(json['totalVisitsCompleted'], 0)!,
      totalVisitsPlanned: ApiParsing.parseInt(json['totalVisitsPlanned'], 0)!,
      totalVisitsInProgress: ApiParsing.parseInt(json['totalVisitsInProgress'], 0)!,
      averageEvaluationScore: ApiParsing.parseDouble(json['averageEvaluationScore'], 0.0)!,
      openRecommendationsCount: ApiParsing.parseInt(json['openRecommendationsCount'], 0)!,
      overdueRecommendationsCount: ApiParsing.parseInt(json['overdueRecommendationsCount'], 0)!,
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
    final rawTeachers = ApiParsing.extractList(json['teachers']);
    return SupervisorHalaqa(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      code: ApiParsing.parseString(json['code']) ?? '',
      branchName: ApiParsing.parseString(json['branchName']) ?? '',
      studentsCount: ApiParsing.parseInt(json['studentsCount'], 0)!,
      visitsCount: ApiParsing.parseInt(json['visitsCount'], 0)!,
      teachers: rawTeachers
          .map((t) => Map<String, dynamic>.from(t as Map))
          .toList(),
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
    final rawHalaqas = ApiParsing.extractList(json['halaqas']);
    return SupervisorTeacher(
      id: ApiParsing.parseString(json['id']) ?? '',
      userId: ApiParsing.parseString(json['userId']) ?? '',
      displayName: ApiParsing.parseString(json['displayName']) ?? '',
      username: ApiParsing.parseString(json['username']) ?? '',
      phone: ApiParsing.parseString(json['phone']),
      email: ApiParsing.parseString(json['email']),
      specialization: ApiParsing.parseString(json['specialization']),
      employeeNumber: ApiParsing.parseString(json['employeeNumber']),
      halaqas: rawHalaqas
          .map((h) => Map<String, dynamic>.from(h as Map))
          .toList(),
      lastVisit: json['lastVisit'] is Map
          ? Map<String, dynamic>.from(json['lastVisit'] as Map)
          : null,
      openRecommendationsCount: ApiParsing.parseInt(json['openRecommendationsCount'], 0)!,
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
    final teacherName = ApiParsing.parseString(teacherUser?['displayName']) ??
        ApiParsing.parseString(teacherUser?['username']) ??
        'الأستاذ';

    final halaqa = json['halaqa'] as Map<String, dynamic>?;
    final halaqaName = ApiParsing.parseString(halaqa?['name'], 'الحلقة')!;
    final halaqaId = ApiParsing.parseString(json['halaqaId']) ??
        ApiParsing.parseString(halaqa?['id']) ??
        '';
    final teacherId = ApiParsing.parseString(json['teacherId']) ??
        ApiParsing.parseString(teacher?['id']) ??
        '';

    final eval = json['evaluation'] as Map<String, dynamic>?;
    final score = ApiParsing.parseDouble(eval?['percentage']) ??
        ApiParsing.parseDouble(eval?['totalScore']);
    final level = ApiParsing.parseString(eval?['level']);

    final count = json['_count'] as Map<String, dynamic>?;
    final recCount = ApiParsing.parseInt(count?['recommendations'], 0)!;

    return FieldVisitItem(
      id: ApiParsing.parseString(json['id']) ?? '',
      visitNumber: ApiParsing.parseString(json['visitNumber']) ?? '',
      visitType: ApiParsing.parseString(json['visitType'], 'ROUTINE')!,
      status: ApiParsing.parseString(json['status'], 'PLANNED')!,
      scheduledDate: ApiParsing.parseString(json['scheduledDate']),
      startedAt: ApiParsing.parseString(json['startedAt']),
      completedAt: ApiParsing.parseString(json['completedAt']),
      reason: ApiParsing.parseString(json['reason']),
      summary: ApiParsing.parseString(json['summary']),
      generalNotes: ApiParsing.parseString(json['generalNotes']),
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
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      description: ApiParsing.parseString(json['description']),
      type: ApiParsing.parseString(json['type'], 'SCALE_5')!,
      maxScore: ApiParsing.parseDouble(json['maxScore'], 5.0)!,
      order: ApiParsing.parseInt(json['order'], 0)!,
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
    final rawCriteria = ApiParsing.extractList(json['criteria']);
    return EvaluationAxisModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      description: ApiParsing.parseString(json['description']),
      weight: ApiParsing.parseDouble(json['weight'], 0.0)!,
      order: ApiParsing.parseInt(json['order'], 0)!,
      criteria: rawCriteria
          .map((c) => EvaluationCriterionModel.fromJson(c as Map<String, dynamic>))
          .toList(),
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
    final rawAxes = ApiParsing.extractList(json['axes']);
    return EvaluationTemplateModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      description: ApiParsing.parseString(json['description']),
      version: ApiParsing.parseInt(json['version'], 1)!,
      axes: rawAxes
          .map((a) => EvaluationAxisModel.fromJson(a as Map<String, dynamic>))
          .toList(),
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
    final teacherName = ApiParsing.parseString(teacherUser?['displayName'], 'المعلم')!;

    final halaqa = json['halaqa'] as Map<String, dynamic>?;
    final halaqaName = ApiParsing.parseString(halaqa?['name'], 'الحلقة')!;
    final rawFollowUps = ApiParsing.extractList(json['followUps']);

    return RecommendationModel(
      id: ApiParsing.parseString(json['id']) ?? '',
      title: ApiParsing.parseString(json['title']) ?? '',
      description: ApiParsing.parseString(json['description']) ?? '',
      domain: ApiParsing.parseString(json['domain']),
      priority: ApiParsing.parseString(json['priority'], 'MEDIUM')!,
      status: ApiParsing.parseString(json['status'], 'OPEN')!,
      dueDate: ApiParsing.parseString(json['dueDate']),
      completedAt: ApiParsing.parseString(json['completedAt']),
      isOverdue: ApiParsing.parseBool(json['isOverdue'], false)!,
      teacherName: teacherName,
      halaqaName: halaqaName,
      followUps: rawFollowUps
          .map((f) => Map<String, dynamic>.from(f as Map))
          .toList(),
    );
  }
}
