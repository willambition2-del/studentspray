import '../../../core/utils/api_parsing.dart';
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
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      studentNumber: ApiParsing.parseString(json['studentNumber']),
      relationship: ApiParsing.parseString(json['relationship'], 'ولي أمر')!,
      isPrimary: ApiParsing.parseBool(json['isPrimary'], false)!,
      halaqaId: ApiParsing.parseString(json['halaqaId']),
      halaqaName: ApiParsing.parseString(json['halaqaName'], 'غير محدد')!,
      teacherName: ApiParsing.parseString(json['teacherName'], 'غير محدد')!,
      teacherPhone: ApiParsing.parseString(json['teacherPhone']),
      attendanceRate: ApiParsing.parseDouble(json['attendanceRate'], 100.0)!,
      lastExamScore: ApiParsing.parseDouble(json['lastExamScore']),
      lastExamTitle: ApiParsing.parseString(json['lastExamTitle']),
      latestRating: ApiParsing.parseString(json['latestRating']),
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
    final list = ApiParsing.extractList(json['children']);
    final children = list.map((c) => ParentChildSummary.fromJson(c as Map<String, dynamic>)).toList();
    StudentDashboardModel? activeDash;
    if (json['activeChildDashboard'] is Map<String, dynamic>) {
      activeDash = StudentDashboardModel.fromJson(json['activeChildDashboard'] as Map<String, dynamic>);
    }

    return ParentMobileHomeSnapshot(
      parent: json['parent'] as Map<String, dynamic>? ?? {},
      children: children,
      activeChildId: ApiParsing.parseString(json['activeChildId']),
      activeChildDashboard: activeDash,
    );
  }
}
