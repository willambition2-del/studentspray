import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/state_views.dart';
import '../models/chat_model.dart';
import '../providers/chat_provider.dart';

import '../../../core/files/attachment_picker_service.dart';
import '../../auth/providers/auth_provider.dart';

class ChatRoomScreen extends ConsumerStatefulWidget {
  final String conversationId;
  final String? title;

  const ChatRoomScreen({
    super.key,
    required this.conversationId,
    this.title,
  });

  @override
  ConsumerState<ChatRoomScreen> createState() => _ChatRoomScreenState();
}

class _ChatRoomScreenState extends ConsumerState<ChatRoomScreen> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _liveMessages = [];
  StreamSubscription<ChatMessage>? _messageSub;
  bool _isSending = false;

  @override
  void initState() {
    super.initState();
    final chatService = ref.read(chatServiceProvider);
    chatService.joinConversation(widget.conversationId);
    chatService.markSocketRead(widget.conversationId);

    _messageSub = chatService.onMessage.listen((msg) {
      if (msg.conversationId == widget.conversationId && mounted) {
        setState(() {
          if (!_liveMessages.any((m) => m.id == msg.id)) {
            _liveMessages.insert(0, msg);
          }
        });
        chatService.markSocketRead(widget.conversationId, messageId: msg.id);
        _scrollToBottom();
      }
    });
  }

  @override
  void dispose() {
    _messageSub?.cancel();
    ref.read(chatServiceProvider).leaveConversation(widget.conversationId);
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          0.0,
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage([String type = 'TEXT', Map<String, dynamic>? metadata]) async {
    final text = _textController.text.trim();
    if (text.isEmpty && type == 'TEXT') return;

    setState(() => _isSending = true);
    final clientMsgId = const Uuid().v4();
    final messageText = text.isNotEmpty ? text : (type == 'IMAGE' ? '📷 صورة' : '📎 مرفق');
    _textController.clear();

    try {
      final chatService = ref.read(chatServiceProvider);
      await chatService.sendSocketMessage(
        widget.conversationId,
        messageText,
        clientMessageId: clientMsgId,
        type: type,
        metadata: metadata,
      );

      ref.invalidate(chatMessagesProvider(widget.conversationId));
      ref.invalidate(chatConversationsProvider);
      _scrollToBottom();
    } catch (_) {
      try {
        await ref.read(chatServiceProvider).sendRestMessage(
              widget.conversationId,
              messageText,
              clientMessageId: clientMsgId,
              type: type,
              metadata: metadata,
            );
        ref.invalidate(chatMessagesProvider(widget.conversationId));
        _scrollToBottom();
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('تعذر إرسال الرسالة: $e'), backgroundColor: Colors.red),
          );
        }
      }
    } finally {
      if (mounted) setState(() => _isSending = false);
    }
  }

  Future<void> _pickAndUploadNativeFile({List<String>? allowedExtensions}) async {
    try {
      final picked = await AttachmentPickerService.pickAttachment(
        allowedExtensions: allowedExtensions,
      );

      if (picked == null) return;

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('جاري رفع الملف: ${picked.name}...'),
            duration: const Duration(seconds: 2),
            backgroundColor: AppColors.primary,
          ),
        );
      }

      final apiClient = ref.read(apiClientProvider);
      final uploaded = await AttachmentPickerService.uploadAttachment(
        file: picked,
        apiClient: apiClient,
      );

      final isImage = ['jpg', 'jpeg', 'png', 'webp'].contains(picked.extension.toLowerCase());
      final msgType = isImage ? 'IMAGE' : 'FILE';

      await _sendMessage(msgType, uploaded.toJson());
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر رفع المرفق: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  void _showAttachmentOptions() {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.lg)),
      ),
      builder: (ctx) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: AppColors.border,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'اختيار مرفق من الجهاز',
                style: TextStyle(
                  fontFamily: AppTypography.fontFamily,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _buildAttachmentAction(
                    icon: Icons.photo_library_outlined,
                    label: 'صورة من المعرض',
                    color: Colors.blue,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickAndUploadNativeFile(
                        allowedExtensions: ['jpg', 'jpeg', 'png', 'webp'],
                      );
                    },
                  ),
                  _buildAttachmentAction(
                    icon: Icons.picture_as_pdf_outlined,
                    label: 'مستند PDF',
                    color: Colors.red,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickAndUploadNativeFile(
                        allowedExtensions: ['pdf'],
                      );
                    },
                  ),
                  _buildAttachmentAction(
                    icon: Icons.insert_drive_file_outlined,
                    label: 'ملف من الجهاز',
                    color: AppColors.primary,
                    onTap: () {
                      Navigator.pop(ctx);
                      _pickAndUploadNativeFile(
                        allowedExtensions: AttachmentPickerService.defaultAllowedExtensions,
                      );
                    },
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAttachmentAction({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppRadius.md),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            CircleAvatar(
              radius: 26,
              backgroundColor: color.withAlpha(25),
              child: Icon(icon, color: color, size: 28),
            ),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(
                fontFamily: AppTypography.fontFamily,
                fontSize: 12,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final asyncHistory = ref.watch(chatMessagesProvider(widget.conversationId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.title ?? 'المحادثة'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          Expanded(
            child: asyncHistory.when(
              data: (history) {
                // Merge history with live messages
                final allMessages = <ChatMessage>[];
                final seenIds = <String>{};

                for (final msg in _liveMessages) {
                  if (seenIds.add(msg.id)) {
                    allMessages.add(msg);
                  }
                }
                for (final msg in history) {
                  if (seenIds.add(msg.id)) {
                    allMessages.add(msg);
                  }
                }

                if (allMessages.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا توجد رسائل بعد',
                    subtitle: 'ابدأ المحادثة الآن بإرسال رسالة أو مرفق',
                    icon: Icons.chat_bubble_outline,
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: allMessages.length,
                  itemBuilder: (context, index) {
                    final message = allMessages[index];
                    return _MessageBubble(message: message);
                  },
                );
              },
              loading: () => const LoadingView(message: 'جاري تحميل الرسائل...'),
              error: (err, _) => ErrorView(
                message: err.toString(),
                onRetry: () => ref.invalidate(chatMessagesProvider(widget.conversationId)),
              ),
            ),
          ),
          // Message Input Bar with Attachment Trigger
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: const BoxDecoration(
              color: AppColors.surface,
              border: Border(top: BorderSide(color: AppColors.border, width: 0.8)),
            ),
            child: SafeArea(
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.attach_file, color: AppColors.textSecondary),
                    tooltip: 'إرفاق ملف أو صورة',
                    onPressed: _showAttachmentOptions,
                  ),
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(AppRadius.full),
                      ),
                      child: TextField(
                        controller: _textController,
                        style: AppTypography.body,
                        decoration: const InputDecoration(
                          hintText: 'اكتب رسالتك هنا...',
                          border: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Material(
                    color: _isSending ? AppColors.textMuted : AppColors.primary,
                    shape: const CircleBorder(),
                    child: InkWell(
                      customBorder: const CircleBorder(),
                      onTap: _isSending ? null : () => _sendMessage(),
                      child: const Padding(
                        padding: EdgeInsets.all(10),
                        child: Icon(Icons.send, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMe = message.isMe;
    final timeStr = DateFormat('hh:mm a', 'ar').format(message.createdAt);
    final isImage = message.type == 'IMAGE';
    final isFile = message.type == 'FILE';
    final isAudio = message.type == 'AUDIO';

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.78,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? AppColors.primary : AppColors.surface,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(AppRadius.lg),
            topRight: const Radius.circular(AppRadius.lg),
            bottomLeft: isMe ? const Radius.circular(AppRadius.lg) : const Radius.circular(AppRadius.xs),
            bottomRight: isMe ? const Radius.circular(AppRadius.xs) : const Radius.circular(AppRadius.lg),
          ),
          border: isMe ? null : Border.all(color: AppColors.border, width: 0.8),
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  message.senderName,
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 11.5,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primaryDark,
                  ),
                ),
              ),
            // Rich Attachment Media Display
            if (isImage) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                height: 120,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: isMe ? Colors.white24 : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(Icons.image, size: 36, color: isMe ? Colors.white : AppColors.primary),
                    const SizedBox(height: 4),
                    Text(
                      message.metadata?['fileName'] as String? ?? message.text,
                      style: TextStyle(
                        fontSize: 11,
                        color: isMe ? Colors.white : AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ] else if (isFile) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isMe ? Colors.white24 : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.insert_drive_file, color: isMe ? Colors.white : Colors.red, size: 24),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            message.metadata?['fileName'] as String? ?? message.text,
                            style: TextStyle(
                              fontSize: 12,
                              color: isMe ? Colors.white : AppColors.textPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          Text(
                            'مستند PDF رسمي',
                            style: TextStyle(
                              fontSize: 10,
                              color: isMe ? Colors.white70 : AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ] else if (isAudio) ...[
              Container(
                margin: const EdgeInsets.only(bottom: 6),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isMe ? Colors.white24 : AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.play_circle_fill, color: isMe ? Colors.white : Colors.amber.shade800, size: 28),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'تسجيل تلاوة صوتي',
                        style: TextStyle(
                          fontSize: 12,
                          color: isMe ? Colors.white : AppColors.textPrimary,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ] else ...[
              Text(
                message.text,
                style: TextStyle(
                  fontFamily: AppTypography.fontFamily,
                  fontSize: 14,
                  color: isMe ? Colors.white : AppColors.textPrimary,
                  height: 1.35,
                ),
              ),
            ],
            const SizedBox(height: 3),
            Text(
              timeStr,
              style: TextStyle(
                fontFamily: AppTypography.fontFamily,
                fontSize: 10,
                color: isMe ? Colors.white70 : AppColors.textMuted,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
