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
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      code: json['code'] as String? ?? '',
      branchName: bName,
      studentsCount: sCount,
      activePlanName: json['activePlanName'] as String?,
      attendanceRate: (json['attendanceRate'] as num?)?.toInt(),
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
  final Map<String, dynamic>? todayMemorization;
  final Map<String, dynamic>? todayRevision;

  const WorkspaceStudent({
    required this.studentId,
    this.studentNumber,
    required this.displayName,
    required this.username,
    this.phone,
    this.todayAttendanceStatus,
    this.todayMemorization,
    this.todayRevision,
  });

  factory WorkspaceStudent.fromJson(Map<String, dynamic> json) {
    return WorkspaceStudent(
      studentId: json['studentId'] as String? ?? '',
      studentNumber: json['studentNumber'] as String?,
      displayName: json['displayName'] as String? ?? '',
      username: json['username'] as String? ?? '',
      phone: json['phone'] as String?,
      todayAttendanceStatus: json['todayAttendanceStatus'] as String?,
      todayMemorization: json['todayMemorization'] as Map<String, dynamic>?,
      todayRevision: json['todayRevision'] as Map<String, dynamic>?,
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
    final rawStudents = json['students'] as List? ?? [];

    return HalaqaTodayWorkspace(
      halaqa: HalaqaItem.fromJson(rawHalaqa),
      todayDate: json['todayDate'] as String? ?? '',
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

    final memos = (json['recentMemorization'] as List? ?? [])
        .map((m) => m as Map<String, dynamic>)
        .toList();
    final revs = (json['recentRevision'] as List? ?? [])
        .map((r) => r as Map<String, dynamic>)
        .toList();

    return StudentProgressData(
      studentId: stu['id'] as String? ?? '',
      displayName: stu['displayName'] as String? ?? '',
      studentNumber: stu['studentNumber'] as String?,
      halaqaName: stu['activeHalaqa'] is Map
          ? (stu['activeHalaqa'] as Map)['name'] as String?
          : null,
      attendanceRate: (metrics['attendanceRate'] as num?)?.toInt() ?? 100,
      totalMemorizationSessions:
          (metrics['totalMemorizationSessions'] as num?)?.toInt() ?? 0,
      avgMemorizationScore:
          (metrics['avgMemorizationScore'] as num?)?.toDouble() ?? 100.0,
      totalRevisionSessions:
          (metrics['totalRevisionSessions'] as num?)?.toInt() ?? 0,
      avgRevisionScore:
          (metrics['avgRevisionScore'] as num?)?.toDouble() ?? 100.0,
      activePlanName: plan?['name'] as String?,
      planProgressPercentage:
          (plan?['progressPercentage'] as num?)?.toInt() ?? 0,
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
  final String examType; // MONTHLY, MIDTERM, FINAL
  final DateTime? scheduledDate;
  final double maxScore;
  final double passScore;
  final String status; // DRAFT, SCHEDULED, PUBLISHED, COMPLETED
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
    final rawCrit = json['criteria'] as List? ?? [];
    return TeacherExamItem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      curriculum: json['curriculum'] as String?,
      examType: json['examType'] as String? ?? 'MONTHLY',
      scheduledDate: json['scheduledDate'] != null
          ? DateTime.tryParse(json['scheduledDate'] as String)
          : null,
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 100.0,
      passScore: (json['passScore'] as num?)?.toDouble() ?? 60.0,
      status: json['status'] as String? ?? 'PUBLISHED',
      isPublished: json['isPublished'] as bool? ?? true,
      halaqaId: json['halaqaId'] as String?,
      halaqaName: json['halaqa'] is Map ? (json['halaqa'] as Map)['name'] as String? : null,
      resultsCount: (json['_count'] is Map && (json['_count'] as Map)['results'] is int)
          ? (json['_count'] as Map)['results'] as int
          : (json['resultsCount'] as num?)?.toInt() ?? 0,
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
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 10.0,
      order: (json['order'] as num?)?.toInt() ?? 0,
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
      sNum = stu['studentNumber'] as String?;
      if (stu['user'] is Map) {
        sName = (stu['user'] as Map)['displayName'] as String? ?? sName;
      }
    }

    return TeacherExamResultItem(
      id: json['id'] as String? ?? '',
      examId: json['examId'] as String? ?? '',
      studentId: json['studentId'] as String? ?? '',
      studentName: sName,
      studentNumber: sNum,
      score: (json['score'] as num?)?.toDouble() ?? 0.0,
      percentage: (json['percentage'] as num?)?.toDouble() ?? 0.0,
      status: json['status'] as String? ?? 'ENTERED',
      isPassed: json['isPassed'] as bool? ?? true,
      notes: json['notes'] as String?,
      gradedAt: json['gradedAt'] != null
          ? DateTime.tryParse(json['gradedAt'] as String)
          : null,
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
      sNum = stu['studentNumber'] as String?;
      if (stu['user'] is Map) {
        sName = (stu['user'] as Map)['displayName'] as String? ?? sName;
      }
    }

    String? hName;
    if (json['halaqa'] is Map) {
      hName = (json['halaqa'] as Map)['name'] as String?;
    }

    return TeacherEvaluationItem(
      id: json['id'] as String? ?? '',
      studentId: json['studentId'] as String? ?? '',
      studentName: sName,
      studentNumber: sNum,
      halaqaId: json['halaqaId'] as String? ?? '',
      halaqaName: hName,
      evaluationDate: json['evaluationDate'] != null
          ? DateTime.tryParse(json['evaluationDate'] as String) ?? DateTime.now()
          : DateTime.now(),
      behaviorScore: (json['behaviorScore'] as num?)?.toDouble() ?? 90.0,
      discipline: (json['discipline'] as num?)?.toDouble() ?? 90.0,
      participation: (json['participation'] as num?)?.toDouble() ?? 90.0,
      overallScore: (json['overallScore'] as num?)?.toDouble() ?? 90.0,
      rating: json['rating'] as String? ?? 'VERY_GOOD',
      teacherNotes: json['teacherNotes'] as String?,
      actionLabel: json['actionLabel'] as String?,
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
    final rawItems = json['items'] as List? ?? [];
    return TeacherEducationalPlan(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      type: json['type'] as String? ?? 'HIFZ',
      status: json['status'] as String? ?? 'ACTIVE',
      halaqaId: json['halaqaId'] as String?,
      halaqaName: json['halaqa'] is Map ? (json['halaqa'] as Map)['name'] as String? : null,
      startDate: json['startDate'] != null ? DateTime.tryParse(json['startDate'] as String) : null,
      endDate: json['endDate'] != null ? DateTime.tryParse(json['endDate'] as String) : null,
      notes: json['notes'] as String?,
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
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'MEMORIZATION',
      surahNumber: (json['surahNumber'] as num?)?.toInt(),
      fromAyah: (json['fromAyah'] as num?)?.toInt(),
      toAyah: (json['toAyah'] as num?)?.toInt(),
      pageFrom: (json['pageFrom'] as num?)?.toInt(),
      pageTo: (json['pageTo'] as num?)?.toInt(),
      juzNumber: (json['juzNumber'] as num?)?.toInt(),
      order: (json['order'] as num?)?.toInt() ?? 1,
      status: json['status'] as String? ?? 'PENDING',
      targetDate: json['targetDate'] != null ? DateTime.tryParse(json['targetDate'] as String) : null,
      notes: json['notes'] as String?,
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
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      description: json['description'] as String?,
      iconKey: json['iconKey'] as String?,
      type: json['type'] as String? ?? 'BADGE',
      points: (json['points'] as num?)?.toInt() ?? 10,
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
      present: (json['present'] as num?)?.toInt() ?? 0,
      absent: (json['absent'] as num?)?.toInt() ?? 0,
      memorizationCount: (json['memorizationCount'] as num?)?.toInt() ?? 0,
      revisionCount: (json['revisionCount'] as num?)?.toInt() ?? 0,
      attendanceRate: (json['attendanceRate'] as num?)?.toDouble() ?? 100.0,
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
    final list = json['halaqasSummary'] as List? ?? [];
    final halaqas = list.map((h) => HalaqaItem.fromJson(h as Map<String, dynamic>)).toList();
    final todayMap = json['today'] as Map<String, dynamic>? ?? {};

    return TeacherMobileHomeSnapshot(
      teacher: json['teacher'] as Map<String, dynamic>? ?? {},
      halaqasSummary: halaqas,
      totalHalaqas: (json['totalHalaqas'] as num?)?.toInt() ?? halaqas.length,
      totalStudents: (json['totalStudents'] as num?)?.toInt() ?? 0,
      today: TeacherTodayMetrics.fromJson(todayMap),
      pendingTasksCount: (json['pendingTasksCount'] as num?)?.toInt() ?? 0,
      upcomingExamsCount: (json['upcomingExamsCount'] as num?)?.toInt() ?? 0,
      evaluationsCount: (json['evaluationsCount'] as num?)?.toInt() ?? 0,
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
