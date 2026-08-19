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
    final statsAsync = ref.watch(teacherDashboardStatsProvider);
    final halaqasAsync = ref.watch(myHalaqasProvider);
    final pendingCountAsync = ref.watch(pendingMutationsCountProvider);
    final unreadNotifs = ref.watch(unreadNotificationsCountProvider).valueOrNull ?? 0;
    final unreadChat = ref.watch(chatTotalUnreadCountProvider).valueOrNull ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة المعلم — ملتقى القرآن'),
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
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'تحديث البيانات',
            onPressed: () {
              ref.read(sessionCacheServiceProvider).clearTeacherHome();
              ref.invalidate(teacherMobileHomeSnapshotProvider);
              ref.invalidate(pendingMutationsCountProvider);
            },
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
                  const SnackBar(content: Text('تم تشغيل مزامنة البيانات بنجاح')),
                );
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.person_outline_rounded),
            tooltip: 'الملف الشخصي',
            onPressed: () => context.push('/teacher/profile'),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.read(sessionCacheServiceProvider).clearTeacherHome();
          ref.invalidate(teacherMobileHomeSnapshotProvider);
          ref.invalidate(pendingMutationsCountProvider);
        },
        child: ListView(
          padding: const EdgeInsets.symmetric(vertical: 16),
          children: [
            // 1. Teacher Header Card
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
            ),
            const SizedBox(height: 20),

            // 2. Real Dashboard Statistics Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'مؤشرات الأداء والإحصائيات',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
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
                          child: _buildMetricCard(
                            title: 'الحلقات المكلف بها',
                            value: '${stats.totalHalaqas}',
                            icon: Icons.groups_rounded,
                            color: AppTheme.primary,
                            onTap: () => context.push('/teacher/halaqas'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildMetricCard(
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
                          child: _buildMetricCard(
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
                          child: _buildMetricCard(
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
                          child: _buildMetricCard(
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
                          child: _buildMetricCard(
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
              loading: () {
                // Stale-while-revalidate: show shimmer indicator instead of blocking loading view
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: SizedBox(
                      width: 20, height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: AppTheme.primary.withAlpha(120)),
                    ),
                  ),
                );
              },
              error: (err, _) => Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: ErrorView(
                  message: 'تعذر تحميل المؤشرات: $err',
                  onRetry: () => ref.invalidate(teacherDashboardStatsProvider),
                ),
              ),
            ),
            const SizedBox(height: 24),

            // 3. Quick Actions Grid
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: const Text(
                'الوصول السريع والإجراءات',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: GridView.count(
                crossAxisCount: 3,
                crossAxisSpacing: 10,
                mainAxisSpacing: 10,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  _buildQuickAction(
                    context,
                    title: 'الحلقات',
                    icon: Icons.account_tree_rounded,
                    color: AppTheme.primary,
                    route: '/teacher/halaqas',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'شؤون الطلاب',
                    icon: Icons.people_alt_rounded,
                    color: Colors.blue.shade700,
                    route: '/teacher/students',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'الاختبارات',
                    icon: Icons.assignment_turned_in_rounded,
                    color: Colors.purple.shade700,
                    route: '/teacher/exams',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'التقييم السلوكي',
                    icon: Icons.star_half_rounded,
                    color: Colors.amber.shade800,
                    route: '/teacher/evaluations',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'الخطط التعليمية',
                    icon: Icons.menu_book_rounded,
                    color: Colors.green.shade700,
                    route: '/teacher/plans',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'الأنشطة والجوائز',
                    icon: Icons.military_tech_rounded,
                    color: Colors.orange.shade800,
                    route: '/teacher/activities-awards',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'الرف العام',
                    icon: Icons.local_library_rounded,
                    color: Colors.cyan.shade800,
                    route: '/shelf',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'المحادثات',
                    icon: Icons.forum_rounded,
                    color: Colors.deepPurple.shade600,
                    route: '/chat',
                  ),
                  _buildQuickAction(
                    context,
                    title: 'التكليفات والطلبات',
                    icon: Icons.admin_panel_settings_rounded,
                    color: Colors.blueGrey.shade700,
                    route: '/admin-hub',
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // 4. Assigned Halaqas & Live Workspace Section
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'حلقاتي وجلسات اليوم',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.textPrimary,
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

                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: halaqas.length,
                  itemBuilder: (context, index) {
                    final halaqa = halaqas[index];
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
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            ElevatedButton.icon(
                              style: ElevatedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                backgroundColor: AppTheme.primary,
                                foregroundColor: Colors.white,
                              ),
                              onPressed: () => context.push('/teacher/halaqas/${halaqa.id}'),
                              icon: const Icon(Icons.dashboard_customize_rounded, size: 16),
                              label: const Text('مساحة الحلقة', style: TextStyle(fontSize: 12)),
                            ),
                          ],
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

  Widget _buildMetricCard({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color color,
    VoidCallback? onTap,
  }) {
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
                      subtitle,
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

  Widget _buildQuickAction(
    BuildContext context, {
    required String title,
    required IconData icon,
    required Color color,
    required String route,
  }) {
    return InkWell(
      onTap: () => context.push(route),
      borderRadius: BorderRadius.circular(16),
      child: Container(
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
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withAlpha(20),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(height: 8),
            Text(
              title,
              textAlign: TextAlign.center,
              style: const TextStyle(
                fontSize: 12,
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
