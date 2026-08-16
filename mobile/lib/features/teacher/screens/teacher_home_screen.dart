import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../providers/teacher_provider.dart';

class TeacherHomeScreen extends ConsumerWidget {
  const TeacherHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final halaqasAsync = ref.watch(myHalaqasProvider);
    final pendingCountAsync = ref.watch(pendingMutationsCountProvider);
    final unreadNotifs = ref.watch(unreadNotificationsCountProvider).valueOrNull ?? 0;
    final unreadChat = ref.watch(chatTotalUnreadCountProvider).valueOrNull ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('الملتقى القرآني — المعلم'),
        actions: [
          IconButton(
            icon: Badge(
              isLabelVisible: unreadChat > 0,
              label: Text('$unreadChat'),
              child: const Icon(Icons.chat_bubble_outline_rounded),
            ),
            tooltip: 'المحادثات',
            onPressed: () => context.push('/chat'),
          ),
          IconButton(
            icon: Badge(
              isLabelVisible: unreadNotifs > 0,
              label: Text('$unreadNotifs'),
              child: const Icon(Icons.notifications_outlined),
            ),
            tooltip: 'الإشعارات',
            onPressed: () => context.push('/notifications'),
          ),
          IconButton(
            icon: const Icon(Icons.sync_rounded),
            tooltip: 'مزامنة العمليات المعلقة',
            onPressed: () async {
              final syncService = ref.read(syncServiceProvider);
              await syncService.syncPendingMutations();
              ref.invalidate(pendingMutationsCountProvider);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تم تشغيل مزامنة البيانات')),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout_rounded),
            tooltip: 'تسجيل الخروج',
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('تسجيل الخروج'),
                  content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
                  actions: [
                    TextButton(
                      onPressed: () => Navigator.pop(ctx, false),
                      child: const Text('إلغاء'),
                    ),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppTheme.statusAbsent,
                      ),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('خروج'),
                    ),
                  ],
                ),
              );

              if (confirmed == true) {
                await ref.read(authProvider.notifier).logout();
              }
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(myHalaqasProvider);
          ref.invalidate(pendingMutationsCountProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            // User Header Card
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppTheme.primaryDark, AppTheme.primary],
                  begin: Alignment.topRight,
                  end: Alignment.bottomLeft,
                ),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryDark.withAlpha(40),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: AppTheme.accentGold.withAlpha(40),
                        child: const Icon(
                          Icons.person_rounded,
                          color: AppTheme.accentGold,
                          size: 30,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              user?.displayName ?? 'المعلم',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              user?.branch?.name ?? 'الفرع الرئيسي',
                              style: const TextStyle(
                                color: AppTheme.accentGoldLight,
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  const Divider(color: Colors.white24, height: 1),
                  const SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        user?.forum?.name ?? 'الملتقى القرآني',
                        style: const TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                      pendingCountAsync.when(
                        data: (count) => count > 0
                            ? Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 10,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: AppTheme.statusLate,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(
                                      Icons.cloud_upload_outlined,
                                      color: Colors.white,
                                      size: 14,
                                    ),
                                    const SizedBox(width: 6),
                                    Text(
                                      '$count بانتظار المزامنة',
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 12,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              )
                            : const SizedBox.shrink(),
                        loading: () => const SizedBox.shrink(),
                        error: (_, __) => const SizedBox.shrink(),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Section Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'حلقاتي القرآنية',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  TextButton.icon(
                    onPressed: () => context.push('/teacher/halaqas'),
                    icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                    label: const Text('عرض الكل'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),

            // Halaqas List
            halaqasAsync.when(
              data: (halaqas) {
                if (halaqas.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا توجد حلقات مكلف بها حاليًا',
                    subtitle: 'يرجى التواصل مع إدارة الفرع لتكليفك بالحلقات',
                  );
                }

                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: halaqas.length,
                  itemBuilder: (context, index) {
                    final halaqa = halaqas[index];
                    return Card(
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 20,
                          vertical: 8,
                        ),
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.primary.withAlpha(25),
                          child: const Icon(
                            Icons.groups_rounded,
                            color: AppTheme.primary,
                          ),
                        ),
                        title: Text(
                          halaqa.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                            color: AppTheme.textPrimary,
                          ),
                        ),
                        subtitle: Text(
                          '${halaqa.branchName} • ${halaqa.studentsCount} طالب',
                          style: const TextStyle(color: AppTheme.textSecondary),
                        ),
                        trailing: const Icon(
                          Icons.chevron_left_rounded,
                          color: AppTheme.primary,
                        ),
                        onTap: () => context.push('/teacher/halaqas/${halaqa.id}'),
                      ),
                    );
                  },
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(32),
                child: LoadingView(message: 'جاري تحميل الحلقات...'),
              ),
              error: (err, _) => ErrorView(
                message: err.toString(),
                onRetry: () => ref.invalidate(myHalaqasProvider),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
