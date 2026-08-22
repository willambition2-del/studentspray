import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/chat_provider.dart';

class ConversationsScreen extends ConsumerWidget {
  const ConversationsScreen({super.key});

  IconData _getIconForType(String type) {
    switch (type) {
      case 'HALAQA':
        return Icons.menu_book_outlined;
      case 'STAFF':
        return Icons.group_work_outlined;
      case 'PARENT_STUDENT_CHANNEL':
        return Icons.people_outline;
      default:
        return Icons.chat_bubble_outline;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'HALAQA':
        return AppColors.primary;
      case 'STAFF':
        return const Color(0xFF4F46E5);
      case 'PARENT_STUDENT_CHANNEL':
        return AppColors.secondary;
      default:
        return AppColors.textSecondary;
    }
  }

  Color _getBgColorForType(String type) {
    switch (type) {
      case 'HALAQA':
        return AppColors.primarySoft;
      case 'STAFF':
        return const Color(0xFFEEF2FF);
      case 'PARENT_STUDENT_CHANNEL':
        return AppColors.secondarySoft;
      default:
        return AppColors.surfaceMuted;
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncConvs = ref.watch(chatConversationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('المحادثات والمجموعات'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث المحادثات',
            onPressed: () => ref.invalidate(chatConversationsProvider),
          ),
        ],
      ),
      body: asyncConvs.when(
        data: (conversations) {
          if (conversations.isEmpty) {
            return const EmptyStateView(
              title: 'لا توجد محادثات نشطة حالياً',
              subtitle: 'ستظهر هنا قنوات الحلقات والمجموعات التعليمية المخصصة لك',
              icon: Icons.chat_bubble_outline,
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.invalidate(chatConversationsProvider),
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: conversations.length,
              separatorBuilder: (_, __) => const SizedBox(height: 10),
              itemBuilder: (context, index) {
                final conv = conversations[index];
                final icon = _getIconForType(conv.type);
                final iconColor = _getColorForType(conv.type);
                final iconBg = _getBgColorForType(conv.type);

                final lastMsgTime = conv.lastMessage?.createdAt != null
                    ? DateFormat('hh:mm a', 'ar').format(conv.lastMessage!.createdAt)
                    : '';

                return ModernCard(
                  onTap: () => context.push('/chat/${conv.id}?title=${Uri.encodeComponent(conv.title)}'),
                  padding: const EdgeInsets.all(14),
                  child: Row(
                    children: [
                      // Conversation Icon
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: iconBg,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: Icon(
                          icon,
                          color: iconColor,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),

                      // Details
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    conv.title,
                                    style: AppTypography.cardTitle,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (lastMsgTime.isNotEmpty)
                                  Text(
                                    lastMsgTime,
                                    style: AppTypography.label.copyWith(color: AppColors.textMuted),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    conv.lastMessage?.text ?? 'لا توجد رسائل سابقة',
                                    style: conv.unreadCount > 0
                                        ? AppTypography.bodyMedium.copyWith(
                                            color: AppColors.textPrimary,
                                            fontWeight: FontWeight.bold,
                                          )
                                        : AppTypography.secondary,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ),
                                if (conv.unreadCount > 0) ...[
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary,
                                      borderRadius: BorderRadius.circular(AppRadius.full),
                                    ),
                                    child: Text(
                                      '${conv.unreadCount}',
                                      style: const TextStyle(
                                        fontFamily: AppTypography.fontFamily,
                                        color: Colors.white,
                                        fontSize: 11,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          );
        },
        loading: () => const Padding(
          padding: EdgeInsets.all(24),
          child: LoadingView(message: 'جاري تحميل المحادثات...'),
        ),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.invalidate(chatConversationsProvider),
        ),
      ),
    );
  }
}
