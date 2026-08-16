import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../providers/student_provider.dart';

class StudentHomeScreen extends ConsumerWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(studentDashboardProvider);
    final unreadNotifs = ref.watch(unreadNotificationsCountProvider).valueOrNull ?? 0;
    final unreadChat = ref.watch(chatTotalUnreadCountProvider).valueOrNull ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('بوابة الطالب القرآني'),
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
              ref.invalidate(studentDashboardProvider);
              ref.invalidate(unreadNotificationsCountProvider);
              ref.invalidate(chatTotalUnreadCountProvider);
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
          ),
        ],
      ),
      body: dashboardAsync.when(
        data: (data) => RefreshIndicator(
          onRefresh: () async => ref.refresh(studentDashboardProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // 1. Student Profile Header Card
              Card(
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
                        children: [
                          Icon(Icons.school, size: 18, color: Theme.of(context).colorScheme.primary),
                          const SizedBox(width: 6),
                          Text(
                            'المعلم: ${data.student.teacherName}',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(fontWeight: FontWeight.w600),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // 2. Active Educational Plan Progress Card
              if (data.plan != null) ...[
                Card(
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
                              label: const Text('التفاصيل'),
                              onPressed: () => context.push('/student/plan'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          data.plan!.name,
                          style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: data.plan!.progressPercentage / 100,
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
                              'المكتمل: ${data.plan!.completedItems} من ${data.plan!.totalItems}',
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                            Text(
                              '${data.plan!.progressPercentage.toStringAsFixed(1)}%',
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
                ),
                const SizedBox(height: 16),
              ],

              // 3. Quick Action Feature Grid
              Text(
                'الخدمات والأقسام',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),
              GridView.count(
                crossAxisCount: 2,
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                mainAxisSpacing: 12,
                crossAxisSpacing: 12,
                childAspectRatio: 1.3,
                children: [
                  _QuickNavCard(
                    title: 'سجل التسميع',
                    subtitle: '${data.totalMemorizations} حفظ • ${data.totalRevisions} مراجعة',
                    icon: Icons.menu_book_rounded,
                    color: Colors.teal,
                    onTap: () => context.push('/student/recitation'),
                  ),
                  _QuickNavCard(
                    title: 'الحضور والغياب',
                    subtitle: '${data.attendance.attendanceRate.toStringAsFixed(1)}% نسبة الحضور',
                    icon: Icons.fact_check_rounded,
                    color: Colors.indigo,
                    onTap: () => context.push('/student/attendance'),
                  ),
                  _QuickNavCard(
                    title: 'الاختبارات والنتائج',
                    subtitle: '${data.recentResults.length} نتائج معتمدة',
                    icon: Icons.assignment_turned_in_rounded,
                    color: Colors.deepOrange,
                    onTap: () => context.push('/student/exams'),
                  ),
                  _QuickNavCard(
                    title: 'التقييمات الدورية',
                    subtitle: data.latestEvaluation?.rating ?? 'عرض التقييمات',
                    icon: Icons.grade_rounded,
                    color: Colors.amber.shade800,
                    onTap: () => context.push('/student/evaluations'),
                  ),
                  _QuickNavCard(
                    title: 'الأنشطة والفعاليات',
                    subtitle: 'البرامج والرحلات',
                    icon: Icons.event_available_rounded,
                    color: Colors.blue.shade700,
                    onTap: () => context.push('/student/activities'),
                  ),
                  _QuickNavCard(
                    title: 'المسابقات والنتائج',
                    subtitle: 'لوحة التنافس',
                    icon: Icons.emoji_events_rounded,
                    color: Colors.purple.shade700,
                    onTap: () => context.push('/student/competitions'),
                  ),
                  _QuickNavCard(
                    title: 'لوحة الأوسمة',
                    subtitle: 'أوسمة التميز',
                    icon: Icons.workspace_premium_rounded,
                    color: Colors.amber.shade900,
                    onTap: () => context.push('/student/awards'),
                  ),
                  _QuickNavCard(
                    title: 'الرف العام',
                    subtitle: 'المقالات والمصادر',
                    icon: Icons.menu_book_rounded,
                    color: Colors.teal.shade700,
                    onTap: () => context.push('/shelf'),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // 4. Upcoming Exams / Latest Results Section
              if (data.upcomingExams.isNotEmpty) ...[
                Text(
                  'الاختبارات القادمة',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                ...data.upcomingExams.map((e) => Card(
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
                    )),
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
            ],
          ),
        ),
        loading: () => const LoadingView(message: 'جاري تحميل لوحة الطالب...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل بيانات لوحة الطالب',
          onRetry: () => ref.refresh(studentDashboardProvider),
        ),
      ),
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
              const Spacer(),
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
