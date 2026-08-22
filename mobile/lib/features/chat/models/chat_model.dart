class ChatConversation {
  final String id;
  final String type;
  final String title;
  final String? halaqaId;
  final String? studentId;
  final ChatMessagePreview? lastMessage;
  final int unreadCount;
  final DateTime? lastReadAt;
  final DateTime updatedAt;

  const ChatConversation({
    required this.id,
    required this.type,
    required this.title,
    this.halaqaId,
    this.studentId,
    this.lastMessage,
    this.unreadCount = 0,
    this.lastReadAt,
    required this.updatedAt,
  });

  factory ChatConversation.fromJson(Map<String, dynamic> json) {
    return ChatConversation(
      id: json['id'] as String,
      type: json['type'] as String? ?? 'HALAQA',
      title: json['title'] as String? ?? 'محادثة',
      halaqaId: json['halaqaId'] as String?,
      studentId: json['studentId'] as String?,
      lastMessage: json['lastMessage'] != null && json['lastMessage'] is Map<String, dynamic>
          ? ChatMessagePreview.fromJson(json['lastMessage'] as Map<String, dynamic>)
          : null,
      unreadCount: json['unreadCount'] is num ? (json['unreadCount'] as num).toInt() : 0,
      lastReadAt: json['lastReadAt'] != null ? DateTime.tryParse(json['lastReadAt'] as String) : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ChatMessagePreview {
  final String id;
  final String text;
  final String senderId;
  final String senderName;
  final DateTime createdAt;

  const ChatMessagePreview({
    required this.id,
    required this.text,
    required this.senderId,
    required this.senderName,
    required this.createdAt,
  });

  factory ChatMessagePreview.fromJson(Map<String, dynamic> json) {
    return ChatMessagePreview(
      id: json['id'] as String,
      text: json['text'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? 'مستخدم',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}

class ChatMessage {
  final String id;
  final String conversationId;
  final String senderId;
  final String senderName;
  final bool isMe;
  final String? clientMessageId;
  final String type;
  final String text;
  final Map<String, dynamic>? metadata;
  final DateTime createdAt;

  const ChatMessage({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.isMe,
    this.clientMessageId,
    this.type = 'TEXT',
    required this.text,
    this.metadata,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String? ?? '',
      senderId: json['senderId'] as String? ?? '',
      senderName: json['senderName'] as String? ?? 'مستخدم',
      isMe: json['isMe'] as bool? ?? false,
      clientMessageId: json['clientMessageId'] as String?,
      type: json['type'] as String? ?? 'TEXT',
      text: json['text'] as String? ?? '',
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'] as String) ?? DateTime.now()
          : DateTime.now(),
    );
  }
}
