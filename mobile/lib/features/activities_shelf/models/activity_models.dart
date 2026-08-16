class ActivityItem {
  final String id;
  final String title;
  final String? description;
  final String type;
  final String status;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? location;
  final int? capacity;
  final String? branchName;
  final String? halaqaName;
  final String? nominationStatus;
  final String? attendanceStatus;

  ActivityItem({
    required this.id,
    required this.title,
    this.description,
    required this.type,
    required this.status,
    required this.startsAt,
    this.endsAt,
    this.location,
    this.capacity,
    this.branchName,
    this.halaqaName,
    this.nominationStatus,
    this.attendanceStatus,
  });

  factory ActivityItem.fromJson(Map<String, dynamic> json) {
    final part = json['myParticipation'] as Map<String, dynamic>?;
    return ActivityItem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      type: json['type'] as String? ?? 'EDUCATIONAL',
      status: json['status'] as String? ?? 'DRAFT',
      startsAt: json['startsAt'] != null
          ? DateTime.tryParse(json['startsAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      endsAt: json['endsAt'] != null
          ? DateTime.tryParse(json['endsAt'] as String)
          : null,
      location: json['location'] as String?,
      capacity: (json['capacity'] as num?)?.toInt(),
      branchName: json['branch']?['name'] as String?,
      halaqaName: json['halaqa']?['name'] as String?,
      nominationStatus: part?['nominationStatus'] as String?,
      attendanceStatus: part?['attendanceStatus'] as String?,
    );
  }

  String get typeLabel {
    switch (type) {
      case 'CONTEST':
        return 'مسابقة';
      case 'TRIP':
        return 'رحلة';
      case 'PROGRAM':
        return 'برنامج';
      case 'COURSE':
        return 'دورة';
      case 'MEETING':
        return 'لقاء';
      case 'SPORTS':
        return 'نشاط رياضي';
      case 'ENTERTAINMENT':
        return 'نشاط ترفيهي';
      case 'EDUCATIONAL':
        return 'نشاط تربوي';
      case 'QURANIC':
        return 'نشاط قرآني';
      case 'INITIATIVE':
        return 'مبادرة';
      default:
        return 'نشاط عام';
    }
  }

  String get statusLabel {
    switch (status) {
      case 'PUBLISHED':
        return 'معلن';
      case 'IN_PROGRESS':
        return 'قيد التنفيذ';
      case 'COMPLETED':
        return 'مكتمل';
      case 'CANCELLED':
        return 'ملغى';
      default:
        return 'مخطط';
    }
  }
}

class CompetitionItem {
  final String id;
  final String title;
  final String? description;
  final String category;
  final String status;
  final DateTime startsAt;
  final DateTime? endsAt;
  final double maxScore;
  final double? myScore;
  final int? myRank;
  final String? myNotes;

  CompetitionItem({
    required this.id,
    required this.title,
    this.description,
    required this.category,
    required this.status,
    required this.startsAt,
    this.endsAt,
    required this.maxScore,
    this.myScore,
    this.myRank,
    this.myNotes,
  });

  factory CompetitionItem.fromJson(Map<String, dynamic> json) {
    final result = json['myResult'] as Map<String, dynamic>?;
    return CompetitionItem(
      id: json['id'] as String? ?? '',
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      category: json['category'] as String? ?? 'MEMORIZATION',
      status: json['status'] as String? ?? 'DRAFT',
      startsAt: json['startsAt'] != null
          ? DateTime.tryParse(json['startsAt'] as String) ?? DateTime.now()
          : DateTime.now(),
      endsAt: json['endsAt'] != null
          ? DateTime.tryParse(json['endsAt'] as String)
          : null,
      maxScore: (json['maxScore'] as num?)?.toDouble() ?? 100.0,
      myScore: (result?['score'] as num?)?.toDouble(),
      myRank: (result?['rank'] as num?)?.toInt(),
      myNotes: result?['notes'] as String?,
    );
  }

  String get categoryLabel {
    switch (category) {
      case 'MEMORIZATION':
        return 'حفظ القرآن';
      case 'TAJWEED':
        return 'التجويد والإتقان';
      case 'RECITATION':
        return 'حسن التلاوة والصوت';
      case 'INTERPRETATION':
        return 'التفسير والتدبر';
      case 'HADITH':
        return 'الحديث الشريف';
      default:
        return 'مسابقة علمية';
    }
  }
}

class AwardItem {
  final String id;
  final String name;
  final String? description;
  final String? iconKey;
  final String type;
  final int points;
  final String reason;
  final String? activityTitle;
  final String? competitionTitle;
  final String? awardedByName;
  final DateTime awardedAt;

  AwardItem({
    required this.id,
    required this.name,
    this.description,
    this.iconKey,
    required this.type,
    required this.points,
    required this.reason,
    this.activityTitle,
    this.competitionTitle,
    this.awardedByName,
    required this.awardedAt,
  });

  factory AwardItem.fromJson(Map<String, dynamic> json) {
    final awardObj = json['award'] as Map<String, dynamic>?;
    return AwardItem(
      id: json['id'] as String? ?? '',
      name: awardObj?['name'] as String? ?? json['name'] as String? ?? 'وسام تميز',
      description: awardObj?['description'] as String? ?? json['description'] as String?,
      iconKey: awardObj?['iconKey'] as String? ?? json['iconKey'] as String?,
      type: awardObj?['type'] as String? ?? json['type'] as String? ?? 'BADGE',
      points: (awardObj?['points'] as num?)?.toInt() ?? (json['points'] as num?)?.toInt() ?? 0,
      reason: json['reason'] as String? ?? '',
      activityTitle: json['activity']?['title'] as String?,
      competitionTitle: json['competition']?['title'] as String?,
      awardedByName: json['awardedBy']?['displayName'] as String?,
      awardedAt: json['awardedAt'] != null
          ? DateTime.tryParse(json['awardedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  String get typeLabel {
    switch (type) {
      case 'MEDAL':
        return 'ميدالية فخرية';
      case 'SHIELD':
        return 'درع التميز';
      case 'CERTIFICATE':
        return 'شهادة شكر وتقدير';
      case 'POINTS':
        return 'نقاط تحفيزية';
      case 'HONORARY':
        return 'لقب شرفي';
      default:
        return 'وسام استحقاق';
    }
  }
}

class ShelfSectionItem {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String visibility;
  final int itemsCount;

  ShelfSectionItem({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    required this.visibility,
    required this.itemsCount,
  });

  factory ShelfSectionItem.fromJson(Map<String, dynamic> json) {
    return ShelfSectionItem(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      slug: json['slug'] as String? ?? '',
      description: json['description'] as String?,
      visibility: json['visibility'] as String? ?? 'ALL_USERS',
      itemsCount: (json['_count']?['items'] as num?)?.toInt() ?? 0,
    );
  }
}

class ShelfPostItem {
  final String id;
  final String sectionId;
  final String? sectionName;
  final String title;
  final String content;
  final String type;
  final String? attachmentName;
  final String? attachmentUrl;
  final String? fileType;
  final String? fileSize;
  final bool isPinned;
  final String? authorName;
  final String? authorRole;
  final DateTime publishedAt;

  ShelfPostItem({
    required this.id,
    required this.sectionId,
    this.sectionName,
    required this.title,
    required this.content,
    required this.type,
    this.attachmentName,
    this.attachmentUrl,
    this.fileType,
    this.fileSize,
    required this.isPinned,
    this.authorName,
    this.authorRole,
    required this.publishedAt,
  });

  factory ShelfPostItem.fromJson(Map<String, dynamic> json) {
    return ShelfPostItem(
      id: json['id'] as String? ?? '',
      sectionId: json['sectionId'] as String? ?? '',
      sectionName: json['section']?['name'] as String?,
      title: json['title'] as String? ?? '',
      content: json['content'] as String? ?? '',
      type: json['type'] as String? ?? 'GENERAL',
      attachmentName: json['attachmentName'] as String?,
      attachmentUrl: json['attachmentUrl'] as String?,
      fileType: json['fileType'] as String?,
      fileSize: json['fileSize'] as String?,
      isPinned: json['isPinned'] as bool? ?? false,
      authorName: json['author']?['displayName'] as String? ?? json['authorName'] as String?,
      authorRole: json['authorRole'] as String?,
      publishedAt: json['publishedAt'] != null
          ? DateTime.tryParse(json['publishedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }

  String get typeLabel {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'إعلان رسمي';
      case 'ARTICLE':
        return 'مقال تربوي';
      case 'BOOK':
        return 'كتاب / كتيب';
      case 'CURRICULUM':
        return 'منهج قرآني';
      case 'RESOURCE':
        return 'مورد تعليمي';
      case 'ACTIVITY_RESULT':
        return 'نتائج وتكريم';
      default:
        return 'منشور عام';
    }
  }
}
