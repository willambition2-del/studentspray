import '../../../core/utils/api_parsing.dart';

class HalaqaItem {
  final String id;
  final String name;
  final String code;
  final String branchName;
  final int studentsCount;
  final String? activePlanName;
  final int? attendanceRate;

  const HalaqaItem({
    required this.id,
    required this.name,
    required this.code,
    required this.branchName,
    this.studentsCount = 0,
    this.activePlanName,
    this.attendanceRate,
  });

  factory HalaqaItem.fromJson(Map<String, dynamic> json) {
    String bName = 'الفرع الرئيسي';
    if (json['branch'] is Map) {
      bName = (json['branch'] as Map)['name'] as String? ?? bName;
    }

    int sCount = 0;
    if (json['_count'] is Map && (json['_count'] as Map)['members'] is int) {
      sCount = (json['_count'] as Map)['members'] as int;
    } else if (json['membersCount'] is int) {
      sCount = json['membersCount'] as int;
    }

    return HalaqaItem(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      code: ApiParsing.parseString(json['code']) ?? '',
      branchName: bName,
      studentsCount: sCount,
      activePlanName: ApiParsing.parseString(json['activePlanName']),
      attendanceRate: ApiParsing.parseInt(json['attendanceRate']),
    );
  }
}

class WorkspaceStudent {
  final String studentId;
  final String? studentNumber;
  final String displayName;
  final String username;
  final String? phone;
  final String? todayAttendanceStatus; // PRESENT, ABSENT, LATE, EXCUSED
  final String? todayArrivalTime;
  final Map<String, dynamic>? todayMemorization;
  final Map<String, dynamic>? todayRevision;
  final String? halaqaId;
  final String? halaqaName;

  const WorkspaceStudent({
    required this.studentId,
    this.studentNumber,
    required this.displayName,
    required this.username,
    this.phone,
    this.todayAttendanceStatus,
    this.todayArrivalTime,
    this.todayMemorization,
    this.todayRevision,
    this.halaqaId,
    this.halaqaName,
  });

  factory WorkspaceStudent.fromJson(Map<String, dynamic> json) {
    return WorkspaceStudent(
      studentId: ApiParsing.parseString(json['studentId'] ?? json['id']) ?? '',
      studentNumber: ApiParsing.parseString(json['studentNumber']),
      displayName: ApiParsing.parseString(json['displayName'] ?? json['name']) ?? '',
      username: ApiParsing.parseString(json['username']) ?? '',
      phone: ApiParsing.parseString(json['phone']),
      todayAttendanceStatus: ApiParsing.parseString(json['todayAttendanceStatus']),
      todayArrivalTime: ApiParsing.parseString(json['todayArrivalTime']),
      todayMemorization: json['todayMemorization'] as Map<String, dynamic>?,
      todayRevision: json['todayRevision'] as Map<String, dynamic>?,
      halaqaId: ApiParsing.parseString(
          json['halaqaId'] ?? (json['halaqa'] is Map ? (json['halaqa'] as Map)['id'] : null)),
      halaqaName: ApiParsing.parseString(
          json['halaqaName'] ?? (json['halaqa'] is Map ? (json['halaqa'] as Map)['name'] : null)),
    );
  }
}

class HalaqaTodayWorkspace {
  final HalaqaItem halaqa;
  final String todayDate;
  final Map<String, dynamic>? session;
  final Map<String, dynamic>? activePlan;
  final List<WorkspaceStudent> students;

  const HalaqaTodayWorkspace({
    required this.halaqa,
    required this.todayDate,
    this.session,
    this.activePlan,
    this.students = const [],
  });

  factory HalaqaTodayWorkspace.fromJson(Map<String, dynamic> json) {
    final rawHalaqa = json['halaqa'] as Map<String, dynamic>? ?? {};
    final rawStudents = ApiParsing.extractList(json['students']);

    return HalaqaTodayWorkspace(
      halaqa: HalaqaItem.fromJson(rawHalaqa),
      todayDate: ApiParsing.parseString(json['todayDate']) ?? '',
      session: json['session'] as Map<String, dynamic>?,
      activePlan: json['activePlan'] as Map<String, dynamic>?,
      students: rawStudents
          .map((s) => WorkspaceStudent.fromJson(s as Map<String, dynamic>))
          .toList(),
    );
  }
}

class StudentProgressData {
  final String studentId;
  final String displayName;
  final String? studentNumber;
  final String? halaqaName;
  final int attendanceRate;
  final int totalMemorizationSessions;
  final double avgMemorizationScore;
  final int totalRevisionSessions;
  final double avgRevisionScore;
  final String? activePlanName;
  final int planProgressPercentage;
  final List<Map<String, dynamic>> recentMemorization;
  final List<Map<String, dynamic>> recentRevision;

  const StudentProgressData({
    required this.studentId,
    required this.displayName,
    this.studentNumber,
    this.halaqaName,
    this.attendanceRate = 100,
    this.totalMemorizationSessions = 0,
    this.avgMemorizationScore = 100,
    this.totalRevisionSessions = 0,
    this.avgRevisionScore = 100,
    this.activePlanName,
    this.planProgressPercentage = 0,
    this.recentMemorization = const [],
    this.recentRevision = const [],
  });

  factory StudentProgressData.fromJson(Map<String, dynamic> json) {
    final stu = json['student'] as Map<String, dynamic>? ?? {};
    final metrics = json['metrics'] as Map<String, dynamic>? ?? {};
    final plan = json['activePlan'] as Map<String, dynamic>?;

    final memos = ApiParsing.extractList(json['recentMemorization'])
        .map((m) => m as Map<String, dynamic>)
        .toList();
    final revs = ApiParsing.extractList(json['recentRevision'])
        .map((r) => r as Map<String, dynamic>)
        .toList();

    return StudentProgressData(
      studentId: ApiParsing.parseString(stu['id']) ?? '',
      displayName: ApiParsing.parseString(stu['displayName']) ?? '',
      studentNumber: ApiParsing.parseString(stu['studentNumber']),
      halaqaName: stu['activeHalaqa'] is Map
          ? (stu['activeHalaqa'] as Map)['name'] as String?
          : null,
      attendanceRate: ApiParsing.parseInt(metrics['attendanceRate'], 100)!,
      totalMemorizationSessions: ApiParsing.parseInt(metrics['totalMemorizationSessions'], 0)!,
      avgMemorizationScore: ApiParsing.parseDouble(metrics['avgMemorizationScore'], 100.0)!,
      totalRevisionSessions: ApiParsing.parseInt(metrics['totalRevisionSessions'], 0)!,
      avgRevisionScore: ApiParsing.parseDouble(metrics['avgRevisionScore'], 100.0)!,
      activePlanName: ApiParsing.parseString(plan?['name']),
      planProgressPercentage: ApiParsing.parseInt(plan?['progressPercentage'], 0)!,
      recentMemorization: memos,
      recentRevision: revs,
    );
  }
}

class TeacherDashboardStats {
  final int totalHalaqas;
  final int totalStudents;
  final int todayPresent;
  final int todayAbsent;
  final int todayMemorization;
  final int todayRevision;
  final int upcomingExams;
  final int recordedEvaluations;
  final int pendingTasks;
  final int unreadNotifications;
  final int unreadChat;
  final double attendanceRate;

  const TeacherDashboardStats({
    this.totalHalaqas = 0,
    this.totalStudents = 0,
    this.todayPresent = 0,
    this.todayAbsent = 0,
    this.todayMemorization = 0,
    this.todayRevision = 0,
    this.upcomingExams = 0,
    this.recordedEvaluations = 0,
    this.pendingTasks = 0,
    this.unreadNotifications = 0,
    this.unreadChat = 0,
    this.attendanceRate = 100.0,
  });
}

class TeacherExamItem {
  final String id;
  final String title;
  final String? description;
  final String? curriculum;
  final String examType;
  final DateTime? scheduledDate;
  final double maxScore;
  final double passScore;
  final String status;
  final bool isPublished;
  final String? halaqaId;
  final String? halaqaName;
  final int resultsCount;
  final List<TeacherExamCriterion> criteria;

  const TeacherExamItem({
    required this.id,
    required this.title,
    this.description,
    this.curriculum,
    this.examType = 'MONTHLY',
    this.scheduledDate,
    this.maxScore = 100.0,
    this.passScore = 60.0,
    this.status = 'PUBLISHED',
    this.isPublished = true,
    this.halaqaId,
    this.halaqaName,
    this.resultsCount = 0,
    this.criteria = const [],
  });

  factory TeacherExamItem.fromJson(Map<String, dynamic> json) {
    final rawCrit = ApiParsing.extractList(json['criteria']);
    return TeacherExamItem(
      id: ApiParsing.parseString(json['id']) ?? '',
      title: ApiParsing.parseString(json['title']) ?? '',
      description: ApiParsing.parseString(json['description']),
      curriculum: ApiParsing.parseString(json['curriculum']),
      examType: ApiParsing.parseString(json['examType'], 'MONTHLY')!,
      scheduledDate: ApiParsing.parseDateTime(json['scheduledDate']),
      maxScore: ApiParsing.parseDouble(json['maxScore'], 100.0)!,
      passScore: ApiParsing.parseDouble(json['passScore'], 60.0)!,
      status: ApiParsing.parseString(json['status'], 'PUBLISHED')!,
      isPublished: ApiParsing.parseBool(json['isPublished'], true)!,
      halaqaId: ApiParsing.parseString(json['halaqaId']),
      halaqaName: json['halaqa'] is Map ? (json['halaqa'] as Map)['name'] as String? : null,
      resultsCount: (json['_count'] is Map && (json['_count'] as Map)['results'] is int)
          ? (json['_count'] as Map)['results'] as int
          : ApiParsing.parseInt(json['resultsCount'], 0)!,
      criteria: rawCrit
          .map((c) => TeacherExamCriterion.fromJson(c as Map<String, dynamic>))
          .toList(),
    );
  }

  String get examTypeLabel {
    switch (examType) {
      case 'MONTHLY':
        return 'اختبار شهري';
      case 'MIDTERM':
        return 'اختبار نصفي';
      case 'FINAL':
        return 'اختبار نهائي';
      default:
        return 'اختبار تقييمي';
    }
  }
}

class TeacherExamCriterion {
  final String id;
  final String name;
  final String? description;
  final double maxScore;
  final int order;

  const TeacherExamCriterion({
    required this.id,
    required this.name,
    this.description,
    this.maxScore = 10.0,
    this.order = 0,
  });

  factory TeacherExamCriterion.fromJson(Map<String, dynamic> json) {
    return TeacherExamCriterion(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      description: ApiParsing.parseString(json['description']),
      maxScore: ApiParsing.parseDouble(json['maxScore'], 10.0)!,
      order: ApiParsing.parseInt(json['order'], 0)!,
    );
  }
}

class TeacherExamResultItem {
  final String id;
  final String examId;
  final String studentId;
  final String studentName;
  final String? studentNumber;
  final double score;
  final double percentage;
  final String status;
  final bool isPassed;
  final String? notes;
  final DateTime? gradedAt;

  const TeacherExamResultItem({
    required this.id,
    required this.examId,
    required this.studentId,
    required this.studentName,
    this.studentNumber,
    this.score = 0.0,
    this.percentage = 0.0,
    this.status = 'ENTERED',
    this.isPassed = true,
    this.notes,
    this.gradedAt,
  });

  factory TeacherExamResultItem.fromJson(Map<String, dynamic> json) {
    String sName = 'طالب';
    String? sNum;
    if (json['student'] is Map) {
      final stu = json['student'] as Map;
      sNum = ApiParsing.parseString(stu['studentNumber']);
      if (stu['user'] is Map) {
        sName = ApiParsing.parseString((stu['user'] as Map)['displayName']) ?? sName;
      }
    } else if (json['studentName'] is String) {
      sName = json['studentName'] as String;
    }

    return TeacherExamResultItem(
      id: ApiParsing.parseString(json['id']) ?? '',
      examId: ApiParsing.parseString(json['examId']) ?? '',
      studentId: ApiParsing.parseString(json['studentId']) ?? '',
      studentName: sName,
      studentNumber: sNum,
      score: ApiParsing.parseDouble(json['score'], 0.0)!,
      percentage: ApiParsing.parseDouble(json['percentage'], 0.0)!,
      status: ApiParsing.parseString(json['status'], 'ENTERED')!,
      isPassed: ApiParsing.parseBool(json['isPassed'], true)!,
      notes: ApiParsing.parseString(json['notes']),
      gradedAt: ApiParsing.parseDateTime(json['gradedAt']),
    );
  }
}

class TeacherEvaluationItem {
  final String id;
  final String studentId;
  final String studentName;
  final String? studentNumber;
  final String halaqaId;
  final String? halaqaName;
  final DateTime evaluationDate;
  final double behaviorScore;
  final double discipline;
  final double participation;
  final double overallScore;
  final String rating; // EXCELLENT, VERY_GOOD, GOOD, ACCEPTABLE, WEAK
  final String? teacherNotes;
  final String? actionLabel;

  const TeacherEvaluationItem({
    required this.id,
    required this.studentId,
    required this.studentName,
    this.studentNumber,
    required this.halaqaId,
    this.halaqaName,
    required this.evaluationDate,
    this.behaviorScore = 90.0,
    this.discipline = 90.0,
    this.participation = 90.0,
    this.overallScore = 90.0,
    this.rating = 'VERY_GOOD',
    this.teacherNotes,
    this.actionLabel,
  });

  factory TeacherEvaluationItem.fromJson(Map<String, dynamic> json) {
    String sName = 'طالب';
    String? sNum;
    if (json['student'] is Map) {
      final stu = json['student'] as Map;
      sNum = ApiParsing.parseString(stu['studentNumber']);
      if (stu['user'] is Map) {
        sName = ApiParsing.parseString((stu['user'] as Map)['displayName']) ?? sName;
      }
    }

    String? hName;
    if (json['halaqa'] is Map) {
      hName = ApiParsing.parseString((json['halaqa'] as Map)['name']);
    }

    return TeacherEvaluationItem(
      id: ApiParsing.parseString(json['id']) ?? '',
      studentId: ApiParsing.parseString(json['studentId']) ?? '',
      studentName: sName,
      studentNumber: sNum,
      halaqaId: ApiParsing.parseString(json['halaqaId']) ?? '',
      halaqaName: hName,
      evaluationDate: ApiParsing.parseDateTime(json['evaluationDate']) ?? DateTime.now(),
      behaviorScore: ApiParsing.parseDouble(json['behaviorScore'], 90.0)!,
      discipline: ApiParsing.parseDouble(json['discipline'], 90.0)!,
      participation: ApiParsing.parseDouble(json['participation'], 90.0)!,
      overallScore: ApiParsing.parseDouble(json['overallScore'], 90.0)!,
      rating: ApiParsing.parseString(json['rating'], 'VERY_GOOD')!,
      teacherNotes: ApiParsing.parseString(json['teacherNotes']),
      actionLabel: ApiParsing.parseString(json['actionLabel']),
    );
  }

  String get ratingLabel {
    switch (rating) {
      case 'EXCELLENT':
        return 'ممتاز';
      case 'VERY_GOOD':
        return 'جيد جداً';
      case 'GOOD':
        return 'جيد';
      case 'ACCEPTABLE':
        return 'مقبول';
      default:
        return 'يحتاج متابعة';
    }
  }
}

class TeacherEducationalPlan {
  final String id;
  final String name;
  final String type; // HIFZ, REVISION, TAJWEED, INTENSIVE
  final String status; // DRAFT, ACTIVE, COMPLETED, SUSPENDED
  final String? halaqaId;
  final String? halaqaName;
  final DateTime? startDate;
  final DateTime? endDate;
  final String? notes;
  final List<TeacherPlanItemDetail> items;

  const TeacherEducationalPlan({
    required this.id,
    required this.name,
    this.type = 'HIFZ',
    this.status = 'ACTIVE',
    this.halaqaId,
    this.halaqaName,
    this.startDate,
    this.endDate,
    this.notes,
    this.items = const [],
  });

  factory TeacherEducationalPlan.fromJson(Map<String, dynamic> json) {
    final rawItems = ApiParsing.extractList(json['items']);
    return TeacherEducationalPlan(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      type: ApiParsing.parseString(json['type'], 'HIFZ')!,
      status: ApiParsing.parseString(json['status'], 'ACTIVE')!,
      halaqaId: ApiParsing.parseString(json['halaqaId']),
      halaqaName: json['halaqa'] is Map ? (json['halaqa'] as Map)['name'] as String? : null,
      startDate: ApiParsing.parseDateTime(json['startDate']),
      endDate: ApiParsing.parseDateTime(json['endDate']),
      notes: ApiParsing.parseString(json['notes']),
      items: rawItems
          .map((i) => TeacherPlanItemDetail.fromJson(i as Map<String, dynamic>))
          .toList(),
    );
  }

  String get typeLabel {
    switch (type) {
      case 'HIFZ':
        return 'خطة حفظ جديد';
      case 'REVISION':
        return 'خطة مراجعة وتثبيت';
      case 'TAJWEED':
        return 'خطة تجويد وإتقان';
      default:
        return 'خطة تعليمية';
    }
  }
}

class TeacherPlanItemDetail {
  final String id;
  final String type;
  final int? surahNumber;
  final int? fromAyah;
  final int? toAyah;
  final int? pageFrom;
  final int? pageTo;
  final int? juzNumber;
  final int order;
  final String status; // PENDING, IN_PROGRESS, COMPLETED
  final DateTime? targetDate;
  final String? notes;

  const TeacherPlanItemDetail({
    required this.id,
    this.type = 'MEMORIZATION',
    this.surahNumber,
    this.fromAyah,
    this.toAyah,
    this.pageFrom,
    this.pageTo,
    this.juzNumber,
    this.order = 1,
    this.status = 'PENDING',
    this.targetDate,
    this.notes,
  });

  factory TeacherPlanItemDetail.fromJson(Map<String, dynamic> json) {
    return TeacherPlanItemDetail(
      id: ApiParsing.parseString(json['id']) ?? '',
      type: ApiParsing.parseString(json['type'], 'MEMORIZATION')!,
      surahNumber: ApiParsing.parseInt(json['surahNumber']),
      fromAyah: ApiParsing.parseInt(json['fromAyah']),
      toAyah: ApiParsing.parseInt(json['toAyah']),
      pageFrom: ApiParsing.parseInt(json['pageFrom']),
      pageTo: ApiParsing.parseInt(json['pageTo']),
      juzNumber: ApiParsing.parseInt(json['juzNumber']),
      order: ApiParsing.parseInt(json['order'], 1)!,
      status: ApiParsing.parseString(json['status'], 'PENDING')!,
      targetDate: ApiParsing.parseDateTime(json['targetDate']),
      notes: ApiParsing.parseString(json['notes']),
    );
  }

  String get statusLabel {
    switch (status) {
      case 'COMPLETED':
        return 'مكتمل';
      case 'IN_PROGRESS':
        return 'جاري';
      default:
        return 'متبقي';
    }
  }
}

class TeacherAwardOption {
  final String id;
  final String name;
  final String? description;
  final String? iconKey;
  final String type;
  final int points;

  const TeacherAwardOption({
    required this.id,
    required this.name,
    this.description,
    this.iconKey,
    this.type = 'BADGE',
    this.points = 10,
  });

  factory TeacherAwardOption.fromJson(Map<String, dynamic> json) {
    return TeacherAwardOption(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      description: ApiParsing.parseString(json['description']),
      iconKey: ApiParsing.parseString(json['iconKey']),
      type: ApiParsing.parseString(json['type'], 'BADGE')!,
      points: ApiParsing.parseInt(json['points'], 10)!,
    );
  }
}

class TeacherTodayMetrics {
  final int present;
  final int absent;
  final int memorizationCount;
  final int revisionCount;
  final double attendanceRate;

  const TeacherTodayMetrics({
    this.present = 0,
    this.absent = 0,
    this.memorizationCount = 0,
    this.revisionCount = 0,
    this.attendanceRate = 100.0,
  });

  factory TeacherTodayMetrics.fromJson(Map<String, dynamic> json) {
    return TeacherTodayMetrics(
      present: ApiParsing.parseInt(json['present'], 0)!,
      absent: ApiParsing.parseInt(json['absent'], 0)!,
      memorizationCount: ApiParsing.parseInt(json['memorizationCount'], 0)!,
      revisionCount: ApiParsing.parseInt(json['revisionCount'], 0)!,
      attendanceRate: ApiParsing.parseDouble(json['attendanceRate'], 100.0)!,
    );
  }

  TeacherTodayMetrics copyWith({
    int? present,
    int? absent,
    int? memorizationCount,
    int? revisionCount,
    double? attendanceRate,
  }) {
    return TeacherTodayMetrics(
      present: present ?? this.present,
      absent: absent ?? this.absent,
      memorizationCount: memorizationCount ?? this.memorizationCount,
      revisionCount: revisionCount ?? this.revisionCount,
      attendanceRate: attendanceRate ?? this.attendanceRate,
    );
  }
}

class TeacherMobileHomeSnapshot {
  final Map<String, dynamic> teacher;
  final List<HalaqaItem> halaqasSummary;
  final int totalHalaqas;
  final int totalStudents;
  final TeacherTodayMetrics today;
  final int pendingTasksCount;
  final int upcomingExamsCount;
  final int evaluationsCount;

  const TeacherMobileHomeSnapshot({
    required this.teacher,
    required this.halaqasSummary,
    required this.totalHalaqas,
    required this.totalStudents,
    required this.today,
    this.pendingTasksCount = 0,
    this.upcomingExamsCount = 0,
    this.evaluationsCount = 0,
  });

  factory TeacherMobileHomeSnapshot.fromJson(Map<String, dynamic> json) {
    final rawTeacher = json['teacher'] as Map<String, dynamic>? ?? {};
    final rawHalaqas = ApiParsing.extractList(json['halaqasSummary']);
    final rawToday = json['today'] as Map<String, dynamic>? ?? {};

    return TeacherMobileHomeSnapshot(
      teacher: rawTeacher,
      halaqasSummary: rawHalaqas
          .map((h) => HalaqaItem.fromJson(h as Map<String, dynamic>))
          .toList(),
      totalHalaqas: ApiParsing.parseInt(json['totalHalaqas'], 0)!,
      totalStudents: ApiParsing.parseInt(json['totalStudents'], 0)!,
      today: TeacherTodayMetrics.fromJson(rawToday),
      pendingTasksCount: ApiParsing.parseInt(json['pendingTasksCount'], 0)!,
      upcomingExamsCount: ApiParsing.parseInt(json['upcomingExamsCount'], 0)!,
      evaluationsCount: ApiParsing.parseInt(json['evaluationsCount'], 0)!,
    );
  }

  TeacherMobileHomeSnapshot copyWith({
    Map<String, dynamic>? teacher,
    List<HalaqaItem>? halaqasSummary,
    int? totalHalaqas,
    int? totalStudents,
    TeacherTodayMetrics? today,
    int? pendingTasksCount,
    int? upcomingExamsCount,
    int? evaluationsCount,
  }) {
    return TeacherMobileHomeSnapshot(
      teacher: teacher ?? this.teacher,
      halaqasSummary: halaqasSummary ?? this.halaqasSummary,
      totalHalaqas: totalHalaqas ?? this.totalHalaqas,
      totalStudents: totalStudents ?? this.totalStudents,
      today: today ?? this.today,
      pendingTasksCount: pendingTasksCount ?? this.pendingTasksCount,
      upcomingExamsCount: upcomingExamsCount ?? this.upcomingExamsCount,
      evaluationsCount: evaluationsCount ?? this.evaluationsCount,
    );
  }
}
