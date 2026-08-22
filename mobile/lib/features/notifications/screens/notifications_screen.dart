import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/notification_model.dart';
import '../providers/notification_provider.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _markAllRead() async {
    try {
      final service = ref.read(notificationServiceProvider);
      await service.markAllAsRead();
      ref.invalidate(unreadNotificationsCountProvider);
      ref.invalidate(notificationsListProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم تحديد جميع الإشعارات كمقروءة')),
        );
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل تحديث الإشعارات')),
        );
      }
    }
  }

  void _handleNotificationTap(AppNotification notification) {
    // Mark as read in background
    if (!notification.isRead) {
      ref.read(notificationServiceProvider).markAsRead(notification.id).then((_) {
        ref.invalidate(unreadNotificationsCountProvider);
        ref.invalidate(notificationsListProvider);
      }).catchError((_) {});
    }

    final user = ref.read(authProvider).user;
    final type = notification.type;
    final data = notification.data ?? {};

    if (type == 'NEW_MESSAGE' || data['conversationId'] != null) {
      final convId = data['conversationId'] as String?;
      if (convId != null) {
        context.push('/chat/$convId');
      } else {
        context.push('/chat');
      }
      return;
    }

    if (user != null && user.isStudent) {
      if (type == 'ATTENDANCE') {
        context.push('/student/attendance');
      } else if (type == 'EXAM_RESULT') {
        context.push('/student/exams');
      } else if (type == 'STUDENT_EVALUATION') {
        context.push('/student/evaluations');
      }
    } else if (user != null && user.isParent) {
      final studentId = data['studentId'] as String?;
      if (studentId != null) {
        if (type == 'ATTENDANCE') {
          context.push('/parent/children/$studentId/attendance');
        } else if (type == 'EXAM_RESULT') {
          context.push('/parent/children/$studentId/exams');
        } else if (type == 'STUDENT_EVALUATION') {
          context.push('/parent/children/$studentId/evaluations');
        }
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'SUPERVISOR_VISIT':
        return Icons.visibility_outlined;
      case 'EXAM_RESULT':
        return Icons.fact_check_outlined;
      case 'EDUCATIONAL_PLAN':
      case 'PLAN':
        return Icons.menu_book_outlined;
      case 'NEW_MESSAGE':
        return Icons.chat_bubble_outline;
      case 'COMPETITION':
      case 'AWARD':
        return Icons.emoji_events_outlined;
      case 'ATTENDANCE':
        return Icons.event_available_outlined;
      case 'STUDENT_EVALUATION':
        return Icons.star_outline;
      case 'BEHAVIORAL_ALERT':
        return Icons.warning_amber_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'SUPERVISOR_VISIT':
        return const Color(0xFF0284C7);
      case 'EXAM_RESULT':
        return AppColors.statusPresent;
      case 'EDUCATIONAL_PLAN':
      case 'PLAN':
        return AppColors.primary;
      case 'NEW_MESSAGE':
        return const Color(0xFF4F46E5);
      case 'COMPETITION':
      case 'AWARD':
        return const Color(0xFFD97706);
      case 'ATTENDANCE':
        return AppColors.statusLate;
      case 'STUDENT_EVALUATION':
        return AppColors.accentGoldDark;
      case 'BEHAVIORAL_ALERT':
        return AppColors.statusAbsent;
      default:
        return AppColors.primary;
    }
  }

  Color _getBgColorForType(String type) {
    switch (type) {
      case 'SUPERVISOR_VISIT':
        return const Color(0xFFE0F2FE);
      case 'EXAM_RESULT':
        return AppColors.statusPresentBg;
      case 'EDUCATIONAL_PLAN':
      case 'PLAN':
        return AppColors.primarySoft;
      case 'NEW_MESSAGE':
        return const Color(0xFFEEF2FF);
      case 'COMPETITION':
      case 'AWARD':
        return const Color(0xFFFEF3C7);
      case 'ATTENDANCE':
        return AppColors.statusLateBg;
      case 'STUDENT_EVALUATION':
        return AppColors.accentGoldSoft;
      case 'BEHAVIORAL_ALERT':
        return AppColors.statusAbsentBg;
      default:
        return AppColors.primarySoft;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الإشعارات والتنبيهات'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all),
            tooltip: 'تحديد الكل كمقروء',
            onPressed: _markAllRead,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          tabs: const [
            Tab(text: 'جميع الإشعارات'),
            Tab(text: 'غير مقروءة'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _NotificationList(
            filter: const NotificationFilter(unreadOnly: false),
            onTap: _handleNotificationTap,
            getIcon: _getIconForType,
            getColor: _getColorForType,
            getBgColor: _getBgColorForType,
          ),
          _NotificationList(
            filter: const NotificationFilter(unreadOnly: true),
            onTap: _handleNotificationTap,
            getIcon: _getIconForType,
            getColor: _getColorForType,
            getBgColor: _getBgColorForType,
          ),
        ],
      ),
    );
  }
}

class _NotificationList extends ConsumerWidget {
  final NotificationFilter filter;
  final Function(AppNotification) onTap;
  final IconData Function(String) getIcon;
  final Color Function(String) getColor;
  final Color Function(String) getBgColor;

  const _NotificationList({
    required this.filter,
    required this.onTap,
    required this.getIcon,
    required this.getColor,
    required this.getBgColor,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsListProvider(filter));

    return notificationsAsync.when(
      skipLoadingOnReload: true,
      data: (items) {
        if (items.isEmpty) {
          return const EmptyStateView(
            title: 'لا توجد إشعارات حالياً',
            subtitle: 'ستظهر هنا التنبيهات والرسائل الجديدة فور وصولها',
            icon: Icons.notifications_none,
          );
        }

        final dateFormat = DateFormat('yyyy/MM/dd - hh:mm a', 'ar');

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async {
            ref.invalidate(notificationsListProvider(filter));
            ref.invalidate(unreadNotificationsCountProvider);
          },
          child: ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, index) {
              final notif = items[index];
              final icon = getIcon(notif.type);
              final iconColor = getColor(notif.type);
              final iconBg = getBgColor(notif.type);

              return ModernCard(
                onTap: () => onTap(notif),
                padding: const EdgeInsets.all(14),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Type Icon
                    Container(
                      width: 42,
                      height: 42,
                      decoration: BoxDecoration(
                        color: iconBg,
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      child: Icon(
                        icon,
                        color: iconColor,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),

                    // Content
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  notif.title,
                                  style: notif.isRead
                                      ? AppTypography.bodyMedium
                                      : AppTypography.cardTitle.copyWith(
                                          fontWeight: FontWeight.bold,
                                        ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                              if (!notif.isRead) ...[
                                const SizedBox(width: 8),
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: AppColors.primary,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            notif.body,
                            style: AppTypography.secondary,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 6),
                          Text(
                            dateFormat.format(notif.createdAt),
                            style: AppTypography.label.copyWith(
                              color: AppColors.textMuted,
                              fontSize: 11,
                            ),
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
        child: LoadingView(message: 'جاري تحميل الإشعارات...'),
      ),
      error: (err, _) => ErrorView(
        message: err.toString(),
        onRetry: () {
          ref.invalidate(notificationsListProvider(filter));
          ref.invalidate(unreadNotificationsCountProvider);
        },
      ),
    );
  }
}
