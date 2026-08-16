class HalaqaItem {
  final String id;
  final String name;
  final String code;
  final String branchName;
  final int studentsCount;

  const HalaqaItem({
    required this.id,
    required this.name,
    required this.code,
    required this.branchName,
    this.studentsCount = 0,
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
