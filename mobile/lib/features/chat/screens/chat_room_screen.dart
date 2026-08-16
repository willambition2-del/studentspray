import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:uuid/uuid.dart';
import '../models/chat_model.dart';
import '../providers/chat_provider.dart';

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
  final TextEditingController _textController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final List<ChatMessage> _liveMessages = [];
  StreamSubscription<ChatMessage>? _messageSub;

  @override
  void initState() {
    super.initState();
    final chatService = ref.read(chatServiceProvider);
    chatService.joinConversation(widget.conversationId);
    chatService.markSocketRead(widget.conversationId);

    _messageSub = chatService.onMessage.listen((msg) {
      if (msg.conversationId == widget.conversationId) {
        setState(() {
          // Replace optimistic message if matching clientMessageId exists
          if (msg.clientMessageId != null) {
            final idx = _liveMessages.indexWhere((m) => m.clientMessageId == msg.clientMessageId);
            if (idx >= 0) {
              _liveMessages[idx] = msg;
              return;
            }
          }
          if (!_liveMessages.any((m) => m.id == msg.id)) {
            _liveMessages.insert(0, msg);
          }
        });
        chatService.markSocketRead(widget.conversationId, messageId: msg.id);
      }
    });
  }

  @override
  void dispose() {
    _messageSub?.cancel();
    final chatService = ref.read(chatServiceProvider);
    chatService.leaveConversation(widget.conversationId);
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
    final text = _textController.text.trim();
    if (text.isEmpty) return;

    _textController.clear();
    final clientMessageId = const Uuid().v4();

    // Optimistic append
    final optimisticMsg = ChatMessage(
      id: clientMessageId,
      conversationId: widget.conversationId,
      senderId: 'me',
      senderName: 'أنت',
      isMe: true,
      clientMessageId: clientMessageId,
      text: text,
      createdAt: DateTime.now(),
    );

    setState(() {
      _liveMessages.insert(0, optimisticMsg);
    });

    final chatService = ref.read(chatServiceProvider);
    await chatService.sendSocketMessage(
      widget.conversationId,
      text,
      clientMessageId: clientMessageId,
    );
  }

  @override
  Widget build(BuildContext context) {
    final asyncHistory = ref.watch(chatMessagesProvider(widget.conversationId));

    return Scaffold(
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
                  return Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.forum_outlined,
                          size: 56,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'لا توجد رسائل بعد. ابدأ المحادثة الآن!',
                          style: TextStyle(
                            color: Colors.grey.shade600,
                            fontSize: 15,
                          ),
                        ),
                      ],
                    ),
                  );
                }

                return ListView.builder(
                  controller: _scrollController,
                  reverse: true,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  itemCount: allMessages.length,
                  itemBuilder: (context, index) {
                    final msg = allMessages[index];
                    return _MessageBubble(message: msg);
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Center(child: Text('خطأ في تحميل الرسائل: $err')),
            ),
          ),
          _buildInputBar(),
        ],
      ),
    );
  }

  Widget _buildInputBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            Expanded(
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: TextField(
                  controller: _textController,
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
            CircleAvatar(
              backgroundColor: Colors.teal,
              radius: 22,
              child: IconButton(
                icon: const Icon(Icons.send_rounded, color: Colors.white, size: 20),
                onPressed: _sendMessage,
              ),
            ),
          ],
        ),
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

    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: 4),
        constraints: BoxConstraints(
          maxWidth: MediaQuery.of(context).size.width * 0.75,
        ),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: isMe ? Colors.teal : Colors.grey.shade200,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: isMe ? const Radius.circular(16) : const Radius.circular(4),
            bottomRight: isMe ? const Radius.circular(4) : const Radius.circular(16),
          ),
        ),
        child: Column(
          crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            if (!isMe)
              Padding(
                padding: const EdgeInsets.only(bottom: 2),
                child: Text(
                  message.senderName,
                  style: TextStyle(
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: Colors.teal.shade800,
                  ),
                ),
              ),
            Text(
              message.text,
              style: TextStyle(
                fontSize: 14,
                color: isMe ? Colors.white : Colors.black87,
                height: 1.3,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              timeStr,
              style: TextStyle(
                fontSize: 10,
                color: isMe ? Colors.white70 : Colors.black45,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
