import '../../student/models/student_models.dart';

class ParentChildSummary {
  final String id;
  final String name;
  final String? studentNumber;
  final String relationship;
  final bool isPrimary;
  final String? halaqaId;
  final String halaqaName;
  final String teacherName;
  final String? teacherPhone;
  final double attendanceRate;
  final double? lastExamScore;
  final String? lastExamTitle;
  final String? latestRating;

  ParentChildSummary({
    required this.id,
    required this.name,
    this.studentNumber,
    required this.relationship,
    required this.isPrimary,
    this.halaqaId,
    required this.halaqaName,
    required this.teacherName,
    this.teacherPhone,
    required this.attendanceRate,
    this.lastExamScore,
    this.lastExamTitle,
    this.latestRating,
  });

  factory ParentChildSummary.fromJson(Map<String, dynamic> json) {
    return ParentChildSummary(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      studentNumber: json['studentNumber'] as String?,
      relationship: json['relationship'] as String? ?? 'ولي أمر',
      isPrimary: json['isPrimary'] as bool? ?? false,
      halaqaId: json['halaqaId'] as String?,
      halaqaName: json['halaqaName'] as String? ?? 'غير محدد',
      teacherName: json['teacherName'] as String? ?? 'غير محدد',
      teacherPhone: json['teacherPhone'] as String?,
      attendanceRate: (json['attendanceRate'] as num?)?.toDouble() ?? 100.0,
      lastExamScore: (json['lastExamScore'] as num?)?.toDouble(),
      lastExamTitle: json['lastExamTitle'] as String?,
      latestRating: json['latestRating'] as String?,
    );
  }
}

class ParentMobileHomeSnapshot {
  final Map<String, dynamic> parent;
  final List<ParentChildSummary> children;
  final String? activeChildId;
  final StudentDashboardModel? activeChildDashboard;

  const ParentMobileHomeSnapshot({
    required this.parent,
    required this.children,
    this.activeChildId,
    this.activeChildDashboard,
  });

  factory ParentMobileHomeSnapshot.fromJson(Map<String, dynamic> json) {
    final list = json['children'] as List? ?? [];
    final children = list.map((c) => ParentChildSummary.fromJson(c as Map<String, dynamic>)).toList();
    StudentDashboardModel? activeDash;
    if (json['activeChildDashboard'] is Map<String, dynamic>) {
      activeDash = StudentDashboardModel.fromJson(json['activeChildDashboard'] as Map<String, dynamic>);
    }

    return ParentMobileHomeSnapshot(
      parent: json['parent'] as Map<String, dynamic>? ?? {},
      children: children,
      activeChildId: json['activeChildId'] as String?,
      activeChildDashboard: activeDash,
    );
  }
}
