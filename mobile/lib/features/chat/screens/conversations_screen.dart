import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../providers/chat_provider.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  IconData _getIconForType(String type) {
    switch (type) {
      case 'HALAQA':
        return Icons.menu_book_rounded;
      case 'STAFF':
        return Icons.group_work_rounded;
      case 'PARENT_STUDENT_CHANNEL':
        return Icons.family_restroom_rounded;
      default:
        return Icons.chat_rounded;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'HALAQA':
        return Colors.teal;
      case 'STAFF':
        return Colors.indigo;
      case 'PARENT_STUDENT_CHANNEL':
        return const Color(0xFF10B981);
      default:
        return Colors.blueGrey;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncConvs = ref.watch(chatConversationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('المحادثات والمجموعات'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(chatConversationsProvider),
          ),
        ],
      ),
      body: asyncConvs.when(
        data: (conversations) {
          if (conversations.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.chat_bubble_outline_rounded,
                    size: 64,
                    color: Colors.grey.shade400,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'لا توجد محادثات نشطة حالياً',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(chatConversationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              itemCount: conversations.length,
              separatorBuilder: (_, __) => const SizedBox(height: 8),
              itemBuilder: (context, index) {
                final conv = conversations[index];
                final icon = _getIconForType(conv.type);
                final color = _getColorForType(conv.type);
                final lastMsg = conv.lastMessage;
                final timeStr = lastMsg != null
                    ? DateFormat('hh:mm a', 'ar').format(lastMsg.createdAt)
                    : '';

                return Card(
                  elevation: 0,
                  color: conv.unreadCount > 0 ? Colors.teal.shade50.withValues(alpha: 0.3) : Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                    side: BorderSide(
                      color: conv.unreadCount > 0 ? Colors.teal.shade200 : Colors.grey.shade200,
                    ),
                  ),
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    leading: CircleAvatar(
                      radius: 24,
                      backgroundColor: color.withValues(alpha: 0.12),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    title: Row(
                      children: [
                        Expanded(
                          child: Text(
                            conv.title,
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: conv.unreadCount > 0 ? FontWeight.bold : FontWeight.w600,
                              color: Colors.grey.shade900,
                            ),
                          ),
                        ),
                        if (timeStr.isNotEmpty)
                          Text(
                            timeStr,
                            style: TextStyle(
                              fontSize: 11,
                              color: Colors.grey.shade500,
                            ),
                          ),
                      ],
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              lastMsg != null
                                  ? '${lastMsg.senderName}: ${lastMsg.text}'
                                  : 'لا توجد رسائل سابقة',
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 13,
                                color: conv.unreadCount > 0
                                    ? Colors.grey.shade800
                                    : Colors.grey.shade600,
                                fontWeight:
                                    conv.unreadCount > 0 ? FontWeight.w500 : FontWeight.normal,
                              ),
                            ),
                          ),
                          if (conv.unreadCount > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                              decoration: BoxDecoration(
                                color: Colors.teal,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                '${conv.unreadCount}',
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    onTap: () {
                      context.push('/chat/${conv.id}?title=${Uri.encodeComponent(conv.title)}');
                    },
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline_rounded, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text('حدث خطأ أثناء تحميل المحادثات: $err'),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => ref.invalidate(chatConversationsProvider),
                child: const Text('إعادة المحاولة'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
