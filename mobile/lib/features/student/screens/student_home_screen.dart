import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../models/student_models.dart';
import '../providers/student_provider.dart';

class StudentHomeScreen extends StatelessWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('بوابة الطالب القرآني'),
        actions: const [
          _StudentChatBadgeAction(),
          _StudentNotificationBadgeAction(),
          _StudentRefreshAction(),
          _StudentLogoutAction(),
        ],
      ),
      body: const _StudentHomeBody(),
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED APPBAR ACTION CONSUMERS
// -----------------------------------------------------------------------------

class _StudentChatBadgeAction extends ConsumerWidget {
  const _StudentChatBadgeAction();

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

class _StudentNotificationBadgeAction extends ConsumerWidget {
  const _StudentNotificationBadgeAction();

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

class _StudentRefreshAction extends ConsumerWidget {
  const _StudentRefreshAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: const Icon(Icons.refresh_rounded),
      tooltip: 'تحديث البيانات',
      onPressed: () {
        ref.read(sessionCacheServiceProvider).clearStudentDashboard();
        ref.invalidate(studentDashboardProvider);
      },
    );
  }
}

class _StudentLogoutAction extends ConsumerWidget {
  const _StudentLogoutAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
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
              FilledButton(
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
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED STUDENT BODY CONSUMERS
// -----------------------------------------------------------------------------

class _StudentHomeBody extends ConsumerWidget {
  const _StudentHomeBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(studentDashboardProvider);

    return dashboardAsync.when(
      skipLoadingOnReload: true,
      data: (data) => CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          SliverPadding(
            padding: const EdgeInsets.all(16),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                // 1. Student Profile Header Card
                _StudentHeaderCard(data: data),
                const SizedBox(height: 16),

                // 2. Student Educational Plan Card
                if (data.plan != null) ...[
                  _StudentPlanCard(plan: data.plan!),
                  const SizedBox(height: 16),
                ],

                // 3. Quick Action Feature Grid
                const _StudentQuickActionsSection(),
                const SizedBox(height: 16),

                // 4. Upcoming Exams Section
                if (data.upcomingExams.isNotEmpty) ...[
                  _StudentUpcomingExamsSection(upcomingExams: data.upcomingExams),
                  const SizedBox(height: 16),
                ],

                // 5. Overall Progress analytics summary
                Card(
                  elevation: 0,
                  color: Colors.blueGrey.shade50,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: Colors.blueGrey.shade200),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('مؤشرات الإنجاز والتميز', style: TextStyle(fontWeight: FontWeight.bold)),
                            const SizedBox(height: 4),
                            Text('سجل تفصيلي لتقدمك في الحفظ والالتزام', style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                          ],
                        ),
                        FilledButton.tonal(
                          onPressed: () => context.push('/student/progress'),
                          child: const Text('عرض المؤشرات'),
                        ),
                      ],
                    ),
                  ),
                ),
              ]),
            ),
          ),
        ],
      ),
      loading: () => const Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: CircularProgressIndicator(),
        ),
      ),
      error: (err, stack) => ErrorView(
        message: 'تعذر تحميل بيانات لوحة الطالب',
        onRetry: () => ref.refresh(studentDashboardProvider),
      ),
    );
  }
}

class _StudentHeaderCard extends StatelessWidget {
  final StudentDashboardModel data;

  const _StudentHeaderCard({required this.data});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      color: Theme.of(context).colorScheme.primaryContainer,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 26,
                  backgroundColor: Theme.of(context).colorScheme.primary,
                  child: const Icon(Icons.person, color: Colors.white, size: 30),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        data.student.name,
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Theme.of(context).colorScheme.onPrimaryContainer,
                            ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'الحلقة: ${data.student.halaqaName}',
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: Theme.of(context).colorScheme.onPrimaryContainer.withAlpha(204),
                            ),
                      ),
                    ],
                  ),
                ),
                if (data.latestEvaluation != null)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.amber.shade700,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(Icons.star, color: Colors.white, size: 16),
                        SizedBox(width: 4),
                        Text(
                          'متميز',
                          style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'المعلم: ${data.student.teacherName}',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: data.attendance.attendanceRate >= 90 ? Colors.green.shade700 : Colors.amber.shade800,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    'حضور: ${data.attendance.attendanceRate.toStringAsFixed(0)}%',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentPlanCard extends StatelessWidget {
  final PlanSummaryModel plan;

  const _StudentPlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'الخطة التعليمية الحالية',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                TextButton.icon(
                  icon: const Icon(Icons.arrow_forward_ios, size: 14),
                  label: const Text('تفاصيل الخطة'),
                  onPressed: () => context.push('/student/plan'),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              plan.name,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: plan.progressPercentage / 100,
              backgroundColor: Colors.grey.shade200,
              color: AppTheme.primary,
              minHeight: 8,
              borderRadius: BorderRadius.circular(4),
            ),
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'المكتمل: ${plan.completedItems} من ${plan.totalItems}',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
                Text(
                  '${plan.progressPercentage.toStringAsFixed(1)}%',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primary,
                      ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StudentQuickActionsSection extends StatelessWidget {
  const _StudentQuickActionsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الخدمات والأقسام',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        Column(
          children: [
            Row(
              children: [
                Expanded(
                  child: _QuickNavCard(
                    title: 'سجل التسميع',
                    subtitle: 'الحفظ والمراجعة',
                    icon: Icons.menu_book_rounded,
                    color: Colors.teal,
                    onTap: () => context.push('/student/recitation'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickNavCard(
                    title: 'الحضور والغياب',
                    subtitle: 'سجل الحضور',
                    icon: Icons.fact_check_rounded,
                    color: Colors.indigo,
                    onTap: () => context.push('/student/attendance'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickNavCard(
                    title: 'الاختبارات والنتائج',
                    subtitle: 'نتائج الاختبارات',
                    icon: Icons.assignment_turned_in_rounded,
                    color: Colors.deepOrange,
                    onTap: () => context.push('/student/exams'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickNavCard(
                    title: 'التقييمات الدورية',
                    subtitle: 'التقييم السلوكي',
                    icon: Icons.grade_rounded,
                    color: Colors.amber.shade800,
                    onTap: () => context.push('/student/evaluations'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickNavCard(
                    title: 'الأنشطة والفعاليات',
                    subtitle: 'البرامج والرحلات',
                    icon: Icons.event_available_rounded,
                    color: Colors.blue.shade700,
                    onTap: () => context.push('/student/activities'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickNavCard(
                    title: 'المسابقات والنتائج',
                    subtitle: 'لوحة التنافس',
                    icon: Icons.emoji_events_rounded,
                    color: Colors.purple.shade700,
                    onTap: () => context.push('/student/competitions'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickNavCard(
                    title: 'لوحة الأوسمة',
                    subtitle: 'أوسمة التميز',
                    icon: Icons.workspace_premium_rounded,
                    color: Colors.amber.shade900,
                    onTap: () => context.push('/student/awards'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickNavCard(
                    title: 'الرف العام',
                    subtitle: 'المقالات والمصادر',
                    icon: Icons.menu_book_rounded,
                    color: Colors.teal.shade700,
                    onTap: () => context.push('/shelf'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ],
    );
  }
}

class _StudentUpcomingExamsSection extends StatelessWidget {
  final List<UpcomingExamModel> upcomingExams;

  const _StudentUpcomingExamsSection({required this.upcomingExams});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'الاختبارات القادمة',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        ...upcomingExams.map(
          (e) => Card(
            margin: const EdgeInsets.only(bottom: 8),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            child: ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.deepOrange.shade100,
                child: Icon(Icons.event_note, color: Colors.deepOrange.shade800),
              ),
              title: Text(e.title, style: const TextStyle(fontWeight: FontWeight.bold)),
              subtitle: Text(e.scheduledDate != null ? 'الموعد: ${e.scheduledDate}' : 'الدرجة القصوى: ${e.maxScore}'),
              trailing: const Icon(Icons.chevron_left),
              onTap: () => context.push('/student/exams'),
            ),
          ),
        ),
      ],
    );
  }
}

class _QuickNavCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickNavCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: color.withAlpha(38),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
