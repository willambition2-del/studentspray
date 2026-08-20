import '../../../core/utils/api_parsing.dart';

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
      id: ApiParsing.parseString(json['id']) ?? '',
      title: ApiParsing.parseString(json['title']) ?? '',
      description: ApiParsing.parseString(json['description']),
      type: ApiParsing.parseString(json['type'], 'EDUCATIONAL')!,
      status: ApiParsing.parseString(json['status'], 'DRAFT')!,
      startsAt: ApiParsing.parseDateTime(json['startsAt']) ?? DateTime.now(),
      endsAt: ApiParsing.parseDateTime(json['endsAt']),
      location: ApiParsing.parseString(json['location']),
      capacity: ApiParsing.parseInt(json['capacity']),
      branchName: json['branch'] is Map ? ApiParsing.parseString((json['branch'] as Map)['name']) : null,
      halaqaName: json['halaqa'] is Map ? ApiParsing.parseString((json['halaqa'] as Map)['name']) : null,
      nominationStatus: ApiParsing.parseString(part?['nominationStatus']),
      attendanceStatus: ApiParsing.parseString(part?['attendanceStatus']),
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
      id: ApiParsing.parseString(json['id']) ?? '',
      title: ApiParsing.parseString(json['title']) ?? '',
      description: ApiParsing.parseString(json['description']),
      category: ApiParsing.parseString(json['category'], 'MEMORIZATION')!,
      status: ApiParsing.parseString(json['status'], 'DRAFT')!,
      startsAt: ApiParsing.parseDateTime(json['startsAt']) ?? DateTime.now(),
      endsAt: ApiParsing.parseDateTime(json['endsAt']),
      maxScore: ApiParsing.parseDouble(json['maxScore'], 100.0)!,
      myScore: ApiParsing.parseDouble(result?['score']),
      myRank: ApiParsing.parseInt(result?['rank']),
      myNotes: ApiParsing.parseString(result?['notes']),
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
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(awardObj?['name']) ?? ApiParsing.parseString(json['name']) ?? 'وسام تميز',
      description: ApiParsing.parseString(awardObj?['description']) ?? ApiParsing.parseString(json['description']),
      iconKey: ApiParsing.parseString(awardObj?['iconKey']) ?? ApiParsing.parseString(json['iconKey']),
      type: ApiParsing.parseString(awardObj?['type']) ?? ApiParsing.parseString(json['type'], 'BADGE')!,
      points: ApiParsing.parseInt(awardObj?['points']) ?? ApiParsing.parseInt(json['points'], 0)!,
      reason: ApiParsing.parseString(json['reason']) ?? '',
      activityTitle: json['activity'] is Map ? ApiParsing.parseString((json['activity'] as Map)['title']) : null,
      competitionTitle: json['competition'] is Map ? ApiParsing.parseString((json['competition'] as Map)['title']) : null,
      awardedByName: json['awardedBy'] is Map ? ApiParsing.parseString((json['awardedBy'] as Map)['displayName']) : null,
      awardedAt: ApiParsing.parseDateTime(json['awardedAt']) ?? DateTime.now(),
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
    final count = json['_count'] is Map ? (json['_count'] as Map)['items'] : null;
    return ShelfSectionItem(
      id: ApiParsing.parseString(json['id']) ?? '',
      name: ApiParsing.parseString(json['name']) ?? '',
      slug: ApiParsing.parseString(json['slug']) ?? '',
      description: ApiParsing.parseString(json['description']),
      visibility: ApiParsing.parseString(json['visibility'], 'ALL_USERS')!,
      itemsCount: ApiParsing.parseInt(count, 0)!,
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
      id: ApiParsing.parseString(json['id']) ?? '',
      sectionId: ApiParsing.parseString(json['sectionId']) ?? '',
      sectionName: json['section'] is Map ? ApiParsing.parseString((json['section'] as Map)['name']) : null,
      title: ApiParsing.parseString(json['title']) ?? '',
      content: ApiParsing.parseString(json['content']) ?? '',
      type: ApiParsing.parseString(json['type'], 'GENERAL')!,
      attachmentName: ApiParsing.parseString(json['attachmentName']),
      attachmentUrl: ApiParsing.parseString(json['attachmentUrl']),
      fileType: ApiParsing.parseString(json['fileType']),
      fileSize: ApiParsing.parseString(json['fileSize']),
      isPinned: ApiParsing.parseBool(json['isPinned'], false)!,
      authorName: json['author'] is Map ? ApiParsing.parseString((json['author'] as Map)['displayName']) : null,
      authorRole: json['author'] is Map ? ApiParsing.parseString((json['author'] as Map)['role']) : null,
      publishedAt: ApiParsing.parseDateTime(json['publishedAt']) ?? DateTime.now(),
    );
  }

  String get typeLabel {
    switch (type) {
      case 'ANNOUNCEMENT':
        return 'إعلان رسمي';
      case 'BOOK':
        return 'كتاب / مقرر';
      case 'SUMMARY':
        return 'ملخص قرآني';
      case 'RESEARCH':
        return 'بحث علمي';
      case 'MEDIA':
        return 'مادة مرئية / مسموعة';
      default:
        return 'منشور عام';
    }
  }
}
