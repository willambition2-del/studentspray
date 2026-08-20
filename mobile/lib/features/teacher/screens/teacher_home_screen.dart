import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherHomeScreen extends StatelessWidget {
  const TeacherHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة المعلم — ملتقى القرآن'),
        actions: const [
          _ChatBadgeAction(),
          _NotificationBadgeAction(),
          _RefreshAction(),
          _SyncPendingAction(),
          _ProfileAction(),
        ],
      ),
      body: const CustomScrollView(
        physics: AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverToBoxAdapter(
            child: Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Column(
                children: [
                  // 1. Teacher Header Card
                  _TeacherHeaderSection(),
                  SizedBox(height: 20),

                  // 2. Real Dashboard Statistics Section
                  _TeacherStatsSection(),
                  SizedBox(height: 24),

                  // 3. Quick Actions Grid
                  _TeacherQuickActionsSection(),
                  SizedBox(height: 24),

                  // 4. Assigned Halaqas & Live Workspace Section
                  _TeacherHalaqasSection(),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED APPBAR ACTION CONSUMERS (Zero Body Rebuild on Badge Updates)
// -----------------------------------------------------------------------------

class _ChatBadgeAction extends ConsumerWidget {
  const _ChatBadgeAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadChat = ref.watch(chatTotalUnreadCountProvider).valueOrNull ?? 0;
    return IconButton(
      icon: Badge(
        isLabelVisible: unreadChat > 0,
        label: Text('$unreadChat'),
        child: const Icon(Icons.chat_bubble_outline_rounded),
      ),
      tooltip: 'المحادثات',
      onPressed: () => context.push('/chat'),
    );
  }
}

class _NotificationBadgeAction extends ConsumerWidget {
  const _NotificationBadgeAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final unreadNotifs = ref.watch(unreadNotificationsCountProvider).valueOrNull ?? 0;
    return IconButton(
      icon: Badge(
        isLabelVisible: unreadNotifs > 0,
        label: Text('$unreadNotifs'),
        child: const Icon(Icons.notifications_outlined),
      ),
      tooltip: 'الإشعارات',
      onPressed: () => context.push('/notifications'),
    );
  }
}

class _RefreshAction extends ConsumerWidget {
  const _RefreshAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: const Icon(Icons.refresh_rounded),
      tooltip: 'تحديث البيانات',
      onPressed: () {
        ref.read(sessionCacheServiceProvider).clearTeacherHome();
        ref.invalidate(teacherMobileHomeSnapshotProvider);
        ref.invalidate(pendingMutationsCountProvider);
      },
    );
  }
}

class _SyncPendingAction extends ConsumerWidget {
  const _SyncPendingAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: const Icon(Icons.sync_rounded),
      tooltip: 'مزامنة العمليات المعلقة',
      onPressed: () async {
        final syncService = ref.read(syncServiceProvider);
        await syncService.syncPendingMutations();
        ref.invalidate(pendingMutationsCountProvider);
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('تم تشغيل مزامنة البيانات بنجاح')),
          );
        }
      },
    );
  }
}

class _ProfileAction extends StatelessWidget {
  const _ProfileAction();

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.person_outline_rounded),
      tooltip: 'الملف الشخصي',
      onPressed: () => context.push('/teacher/profile'),
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED BODY SUB-CONSUMERS
// -----------------------------------------------------------------------------

class _TeacherHeaderSection extends ConsumerWidget {
  const _TeacherHeaderSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider.select((s) => s.user));
    final pendingCountAsync = ref.watch(pendingMutationsCountProvider);

    return Container(
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
            color: AppTheme.primaryDark.withAlpha(50),
            blurRadius: 14,
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
                radius: 28,
                backgroundColor: AppTheme.accentGold.withAlpha(40),
                child: const Icon(
                  Icons.menu_book_rounded,
                  color: AppTheme.accentGold,
                  size: 32,
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user?.displayName ?? 'المعلم الفاضل',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 19,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${user?.branch?.name ?? "الفرع الرئيسي"} • كادر التحفيظ والترتيل',
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
                user?.forum?.name ?? 'ملتقى النور القرآني النموذجي',
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
                              '$count عمليات معلقة',
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
    );
  }
}

class _TeacherStatsSection extends ConsumerWidget {
  const _TeacherStatsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(teacherDashboardStatsProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'مؤشرات الأداء والإحصائيات',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TextButton.icon(
                onPressed: () => context.push('/teacher/reports'),
                icon: const Icon(Icons.bar_chart_rounded, size: 16),
                label: const Text('التقارير التحليلية'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        statsAsync.when(
          skipLoadingOnReload: true,
          data: (stats) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        title: 'الحلقات المكلف بها',
                        value: '${stats.totalHalaqas}',
                        icon: Icons.groups_rounded,
                        color: AppTheme.primary,
                        onTap: () => context.push('/teacher/halaqas'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MetricCard(
                        title: 'إجمالي الطلاب',
                        value: '${stats.totalStudents}',
                        icon: Icons.school_rounded,
                        color: AppTheme.primaryLight,
                        onTap: () => context.push('/teacher/students'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        title: 'حضور اليوم',
                        value: '${stats.todayPresent}',
                        subtitle: 'نسبة: ${stats.attendanceRate.toStringAsFixed(0)}%',
                        icon: Icons.fact_check_rounded,
                        color: AppTheme.statusPresent,
                        onTap: () => context.push('/teacher/halaqas'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MetricCard(
                        title: 'غياب اليوم',
                        value: '${stats.todayAbsent}',
                        subtitle: stats.todayAbsent > 0 ? 'يحتاج متابعة' : 'لا يوجد غياب',
                        icon: Icons.cancel_outlined,
                        color: stats.todayAbsent > 0 ? AppTheme.statusAbsent : Colors.grey,
                        onTap: () => context.push('/teacher/halaqas'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: _MetricCard(
                        title: 'تسميع اليوم',
                        value: '${stats.todayMemorization}',
                        subtitle: 'جلسات منجزة',
                        icon: Icons.auto_stories_rounded,
                        color: Colors.teal,
                        onTap: () => context.push('/teacher/halaqas'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: _MetricCard(
                        title: 'مراجعة اليوم',
                        value: '${stats.todayRevision}',
                        subtitle: 'أحزاب مثبتة',
                        icon: Icons.refresh_rounded,
                        color: Colors.indigo,
                        onTap: () => context.push('/teacher/halaqas'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          loading: () => const Padding(
            padding: EdgeInsets.all(16),
            child: Center(
              child: SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary),
              ),
            ),
          ),
          error: (err, _) => Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ErrorView(
              message: 'تعذر تحميل المؤشرات: $err',
              onRetry: () => ref.invalidate(teacherDashboardStatsProvider),
            ),
          ),
        ),
      ],
    );
  }
}

class _TeacherQuickActionsSection extends StatelessWidget {
  const _TeacherQuickActionsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            'الوصول السريع والإجراءات',
            style: TextStyle(
              fontSize: 17,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
        ),
        const SizedBox(height: 12),
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16),
          child: Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _QuickActionCard(
                      title: 'الحلقات',
                      icon: Icons.account_tree_rounded,
                      color: AppTheme.primary,
                      route: '/teacher/halaqas',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _QuickActionCard(
                      title: 'شؤون الطلاب',
                      icon: Icons.people_alt_rounded,
                      color: Colors.blue,
                      route: '/teacher/students',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _QuickActionCard(
                      title: 'الاختبارات',
                      icon: Icons.assignment_turned_in_rounded,
                      color: Colors.purple,
                      route: '/teacher/exams',
                    ),
                  ),
                ],
              ),
              SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _QuickActionCard(
                      title: 'التقييم السلوكي',
                      icon: Icons.star_half_rounded,
                      color: Colors.amber,
                      route: '/teacher/evaluations',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _QuickActionCard(
                      title: 'الخطط التعليمية',
                      icon: Icons.menu_book_rounded,
                      color: Colors.green,
                      route: '/teacher/plans',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _QuickActionCard(
                      title: 'الأنشطة والجوائز',
                      icon: Icons.military_tech_rounded,
                      color: Colors.orange,
                      route: '/teacher/activities-awards',
                    ),
                  ),
                ],
              ),
              SizedBox(height: 10),
              Row(
                children: [
                  Expanded(
                    child: _QuickActionCard(
                      title: 'الرف العام',
                      icon: Icons.local_library_rounded,
                      color: Colors.cyan,
                      route: '/shelf',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _QuickActionCard(
                      title: 'المحادثات',
                      icon: Icons.forum_rounded,
                      color: Colors.deepPurple,
                      route: '/chat',
                    ),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: _QuickActionCard(
                      title: 'التكليفات والطلبات',
                      icon: Icons.admin_panel_settings_rounded,
                      color: Colors.blueGrey,
                      route: '/admin-hub',
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _TeacherHalaqasSection extends ConsumerWidget {
  const _TeacherHalaqasSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final halaqasAsync = ref.watch(myHalaqasProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'حلقاتي وجلسات اليوم',
                  style: TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              TextButton.icon(
                onPressed: () => context.push('/teacher/halaqas'),
                icon: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                label: const Text('استعراض الحلقات'),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        halaqasAsync.when(
          skipLoadingOnReload: true,
          data: (halaqas) {
            if (halaqas.isEmpty) {
              return const EmptyStateView(
                title: 'لا توجد حلقات مكلف بها حاليًا',
                subtitle: 'يرجى التواصل مع إدارة الفرع لتكليفك بالحلقات',
              );
            }

            return Column(
              children: halaqas.map((halaqa) => _HalaqaItemCard(halaqa: halaqa)).toList(),
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
    );
  }
}

// -----------------------------------------------------------------------------
// REUSABLE LEAN WIDGETS
// -----------------------------------------------------------------------------

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String? subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback? onTap;

  const _MetricCard({
    required this.title,
    required this.value,
    this.subtitle,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(6),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withAlpha(20),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade700,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
                    ),
                  ),
                  if (subtitle != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subtitle!,
                      style: TextStyle(
                        fontSize: 11,
                        color: color,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final String route;

  const _QuickActionCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.route,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(16),
      child: Container(
        height: 84,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(5),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: color.withAlpha(20),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 20),
            ),
            const SizedBox(height: 6),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HalaqaItemCard extends StatelessWidget {
  final HalaqaItem halaqa;

  const _HalaqaItemCard({required this.halaqa});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
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
        trailing: ElevatedButton.icon(
          style: ElevatedButton.styleFrom(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            backgroundColor: AppTheme.primary,
            foregroundColor: Colors.white,
          ),
          onPressed: () => context.push('/teacher/halaqas/${halaqa.id}'),
          icon: const Icon(Icons.dashboard_customize_rounded, size: 16),
          label: const Text('مساحة الحلقة', style: TextStyle(fontSize: 12)),
        ),
        onTap: () => context.push('/teacher/halaqas/${halaqa.id}'),
      ),
    );
  }
}
