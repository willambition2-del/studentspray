import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
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
      case 'ATTENDANCE':
        return Icons.event_busy_rounded;
      case 'EXAM_RESULT':
        return Icons.workspace_premium_rounded;
      case 'STUDENT_EVALUATION':
        return Icons.star_rate_rounded;
      case 'NEW_MESSAGE':
        return Icons.chat_bubble_rounded;
      case 'BEHAVIORAL_ALERT':
        return Icons.warning_amber_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'ATTENDANCE':
        return Colors.orange;
      case 'EXAM_RESULT':
        return const Color(0xFF10B981);
      case 'STUDENT_EVALUATION':
        return Colors.amber.shade700;
      case 'NEW_MESSAGE':
        return Colors.blue;
      case 'BEHAVIORAL_ALERT':
        return Colors.red;
      default:
        return Colors.teal;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الإشعارات والتنبيهات'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.done_all_rounded),
            tooltip: 'تحديد الكل كمقروء',
            onPressed: _markAllRead,
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
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
          ),
          _NotificationList(
            filter: const NotificationFilter(unreadOnly: true),
            onTap: _handleNotificationTap,
            getIcon: _getIconForType,
            getColor: _getColorForType,
          ),
        ],
      ),
    );
  }
}

class _NotificationList extends ConsumerWidget {
  final NotificationFilter filter;
  final ValueChanged<AppNotification> onTap;
  final IconData Function(String) getIcon;
  final Color Function(String) getColor;

  const _NotificationList({
    required this.filter,
    required this.onTap,
    required this.getIcon,
    required this.getColor,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncList = ref.watch(notificationsListProvider(filter));

    return asyncList.when(
      data: (items) {
        if (items.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.notifications_off_outlined,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  filter.unreadOnly ? 'لا توجد إشعارات غير مقروءة' : 'لا توجد إشعارات حالياً',
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
          onRefresh: () async {
            ref.invalidate(notificationsListProvider(filter));
            ref.invalidate(unreadNotificationsCountProvider);
          },
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            itemCount: items.length,
            separatorBuilder: (_, __) => const SizedBox(height: 8),
            itemBuilder: (context, index) {
              final notif = items[index];
              final icon = getIcon(notif.type);
              final color = getColor(notif.type);
              final timeStr = DateFormat('yyyy/MM/dd - hh:mm a', 'ar').format(notif.createdAt);

              return Card(
                elevation: notif.isRead ? 0 : 1,
                color: notif.isRead ? Colors.white : Colors.teal.shade50.withValues(alpha: 0.4),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                  side: BorderSide(
                    color: notif.isRead ? Colors.grey.shade200 : Colors.teal.shade200,
                  ),
                ),
                child: InkWell(
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => onTap(notif),
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        CircleAvatar(
                          radius: 20,
                          backgroundColor: color.withValues(alpha: 0.12),
                          child: Icon(icon, color: color, size: 20),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      notif.title,
                                      style: TextStyle(
                                        fontSize: 15,
                                        fontWeight: notif.isRead ? FontWeight.w600 : FontWeight.bold,
                                        color: Colors.grey.shade900,
                                      ),
                                    ),
                                  ),
                                  if (!notif.isRead)
                                    Container(
                                      width: 8,
                                      height: 8,
                                      margin: const EdgeInsets.only(right: 6),
                                      decoration: const BoxDecoration(
                                        color: Colors.teal,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notif.body,
                                style: TextStyle(
                                  fontSize: 13,
                                  color: Colors.grey.shade700,
                                  height: 1.4,
                                ),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                timeStr,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
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
            Text('حدث خطأ أثناء تحميل الإشعارات: $err'),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: () => ref.invalidate(notificationsListProvider(filter)),
              child: const Text('إعادة المحاولة'),
            ),
          ],
        ),
      ),
    );
  }
}
