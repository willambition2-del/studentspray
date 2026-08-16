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
