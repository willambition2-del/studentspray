class AdminRequestModel {
  final String id;
  final String title;
  final String description;
  final String type;
  final String status;
  final String priority;
  final DateTime createdAt;
  final DateTime? submittedAt;
  final DateTime? resolvedAt;
  final String? branchName;
  final String? requesterName;

  AdminRequestModel({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.status,
    required this.priority,
    required this.createdAt,
    this.submittedAt,
    this.resolvedAt,
    this.branchName,
    this.requesterName,
  });

  factory AdminRequestModel.fromJson(Map<String, dynamic> json) {
    return AdminRequestModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      type: json['type'] as String? ?? 'GENERAL',
      status: json['status'] as String? ?? 'DRAFT',
      priority: json['priority'] as String? ?? 'NORMAL',
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      submittedAt: json['submittedAt'] != null ? DateTime.tryParse(json['submittedAt'] as String) : null,
      resolvedAt: json['resolvedAt'] != null ? DateTime.tryParse(json['resolvedAt'] as String) : null,
      branchName: json['branch'] != null ? json['branch']['name'] as String? : null,
      requesterName: json['requestedBy'] != null
          ? (json['requestedBy']['displayName'] as String? ?? json['requestedBy']['username'] as String?)
          : null,
    );
  }
}

class AdminDecisionModel {
  final String id;
  final String decisionNumber;
  final String title;
  final String content;
  final String type;
  final String status;
  final DateTime issuedAt;
  final String? issuerName;
  final String? branchName;

  AdminDecisionModel({
    required this.id,
    required this.decisionNumber,
    required this.title,
    required this.content,
    required this.type,
    required this.status,
    required this.issuedAt,
    this.issuerName,
    this.branchName,
  });

  factory AdminDecisionModel.fromJson(Map<String, dynamic> json) {
    return AdminDecisionModel(
      id: json['id'] as String,
      decisionNumber: json['decisionNumber'] as String? ?? '',
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'GENERAL_DIRECTIVE',
      status: json['status'] as String? ?? 'ACTIVE',
      issuedAt: DateTime.tryParse(json['issuedAt'] as String? ?? '') ?? DateTime.now(),
      issuerName: json['issuedBy'] != null
          ? (json['issuedBy']['displayName'] as String? ?? json['issuedBy']['username'] as String?)
          : null,
      branchName: json['branch'] != null ? json['branch']['name'] as String? : null,
    );
  }
}

class TaskFollowUpModel {
  final String id;
  final String note;
  final String? status;
  final DateTime createdAt;
  final String? actorName;

  TaskFollowUpModel({
    required this.id,
    required this.note,
    this.status,
    required this.createdAt,
    this.actorName,
  });

  factory TaskFollowUpModel.fromJson(Map<String, dynamic> json) {
    return TaskFollowUpModel(
      id: json['id'] as String,
      note: json['note'] as String? ?? '',
      status: json['status'] as String?,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      actorName: json['actor'] != null
          ? (json['actor']['displayName'] as String? ?? json['actor']['username'] as String?)
          : null,
    );
  }
}

class AdminTaskModel {
  final String id;
  final String title;
  final String? description;
  final String status;
  final String priority;
  final DateTime? dueAt;
  final bool isOverdue;
  final DateTime createdAt;
  final String? creatorName;
  final String? branchName;
  final List<TaskFollowUpModel> followUps;

  AdminTaskModel({
    required this.id,
    required this.title,
    this.description,
    required this.status,
    required this.priority,
    this.dueAt,
    required this.isOverdue,
    required this.createdAt,
    this.creatorName,
    this.branchName,
    required this.followUps,
  });

  factory AdminTaskModel.fromJson(Map<String, dynamic> json) {
    final followUpsList = json['followUps'] as List? ?? [];
    return AdminTaskModel(
      id: json['id'] as String,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      status: json['status'] as String? ?? 'OPEN',
      priority: json['priority'] as String? ?? 'NORMAL',
      dueAt: json['dueAt'] != null ? DateTime.tryParse(json['dueAt'] as String) : null,
      isOverdue: json['isOverdue'] as bool? ?? false,
      createdAt: DateTime.tryParse(json['createdAt'] as String? ?? '') ?? DateTime.now(),
      creatorName: json['createdBy'] != null
          ? (json['createdBy']['displayName'] as String? ?? json['createdBy']['username'] as String?)
          : null,
      branchName: json['branch'] != null ? json['branch']['name'] as String? : null,
      followUps: followUpsList
          .map((item) => TaskFollowUpModel.fromJson(item as Map<String, dynamic>))
          .toList(),
    );
  }
}
