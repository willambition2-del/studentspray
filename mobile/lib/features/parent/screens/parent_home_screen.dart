import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../providers/parent_provider.dart';

class ParentHomeScreen extends ConsumerWidget {
  const ParentHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childrenAsync = ref.watch(parentChildrenProvider);
    final activeChildId = ref.watch(activeChildIdProvider);
    final unreadNotifs = ref.watch(unreadNotificationsCountProvider).valueOrNull ?? 0;
    final unreadChat = ref.watch(chatTotalUnreadCountProvider).valueOrNull ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('بوابة ولي الأمر — الملتقى القرآني'),
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
              ref.invalidate(parentChildrenProvider);
              if (activeChildId != null) {
                ref.invalidate(childDashboardProvider(activeChildId));
              }
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
      body: childrenAsync.when(
        data: (children) {
          if (children.isEmpty) {
            return const EmptyStateView(
              title: 'لا يوجد أبناء مرتبطين بحسابك',
              subtitle: 'يرجى التواصل مع إدارة المجمع القرآني لربط بيانات الأبناء برقم الهوية أو الهاتف',
              icon: Icons.family_restroom,
            );
          }

          // Pick the active child, or default to the first
          final currentChildId = activeChildId ?? children.first.id;
          final currentChild = children.firstWhere(
            (c) => c.id == currentChildId,
            orElse: () => children.first,
          );

          final childDashboardAsync = ref.watch(childDashboardProvider(currentChildId));

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(parentChildrenProvider);
              ref.invalidate(childDashboardProvider(currentChildId));
            },
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 1. Multi-Child Horizontal Switcher
                Text(
                  'الأبناء والمنتسبين (${children.length})',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                SizedBox(
                  height: 48,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: children.length,
                    separatorBuilder: (_, __) => const SizedBox(width: 8),
                    itemBuilder: (ctx, i) {
                      final child = children[i];
                      final isSelected = child.id == currentChildId;

                      return FilterChip(
                        selected: isSelected,
                        showCheckmark: false,
                        avatar: CircleAvatar(
                          backgroundColor: isSelected ? Colors.white : AppTheme.primary,
                          child: Icon(
                            Icons.person,
                            size: 14,
                            color: isSelected ? AppTheme.primary : Colors.white,
                          ),
                        ),
                        label: Text(
                          child.name,
                          style: TextStyle(
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                            color: isSelected ? Colors.white : AppTheme.textPrimary,
                          ),
                        ),
                        selectedColor: AppTheme.primary,
                        backgroundColor: Colors.grey.shade100,
                        onSelected: (_) {
                          ref.read(activeChildIdProvider.notifier).state = child.id;
                        },
                      );
                    },
                  ),
                ),
                const SizedBox(height: 16),

                // 2. Active Child Header Card
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
                              child: const Icon(Icons.school, color: Colors.white, size: 28),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    currentChild.name,
                                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: Theme.of(context).colorScheme.onPrimaryContainer,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'الحلقة: ${currentChild.halaqaName} • الصلة: ${currentChild.relationship}',
                                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                          color: Theme.of(context).colorScheme.onPrimaryContainer.withAlpha(204),
                                        ),
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
                              'المعلم: ${currentChild.teacherName}',
                              style: const TextStyle(fontWeight: FontWeight.w600),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: currentChild.attendanceRate >= 90 ? Colors.green.shade700 : Colors.amber.shade800,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Text(
                                'حضور: ${currentChild.attendanceRate.toStringAsFixed(0)}%',
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // 3. Active Child Dashboard Content
                childDashboardAsync.when(
                  data: (dash) => Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Active Educational Plan Card
                      if (dash.plan != null) ...[
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
                                      'الخطة التعليمية للابن',
                                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                                    ),
                                    TextButton.icon(
                                      icon: const Icon(Icons.arrow_forward_ios, size: 14),
                                      label: const Text('التفاصيل'),
                                      onPressed: () => context.push('/parent/children/$currentChildId/plan'),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  dash.plan!.name,
                                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(fontWeight: FontWeight.w600),
                                ),
                                const SizedBox(height: 8),
                                LinearProgressIndicator(
                                  value: dash.plan!.progressPercentage / 100,
                                  backgroundColor: Colors.grey.shade200,
                                  color: AppTheme.primary,
                                  minHeight: 8,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                const SizedBox(height: 8),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text('المنجز: ${dash.plan!.completedItems} من ${dash.plan!.totalItems}'),
                                    Text(
                                      '${dash.plan!.progressPercentage.toStringAsFixed(1)}%',
                                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Quick Navigation Grid
                      Text(
                        'متابعة مستوى الابن',
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
                            subtitle: '${dash.totalMemorizations} حفظ • ${dash.totalRevisions} مراجعة',
                            icon: Icons.menu_book_rounded,
                            color: Colors.teal,
                            onTap: () => context.push('/parent/children/$currentChildId/recitation'),
                          ),
                          _QuickNavCard(
                            title: 'الحضور والغياب',
                            subtitle: '${dash.attendance.attendanceRate.toStringAsFixed(1)}% نسبة الحضور',
                            icon: Icons.fact_check_rounded,
                            color: Colors.indigo,
                            onTap: () => context.push('/parent/children/$currentChildId/attendance'),
                          ),
                          _QuickNavCard(
                            title: 'الاختبارات والنتائج',
                            subtitle: '${dash.recentResults.length} نتائج معتمدة',
                            icon: Icons.assignment_turned_in_rounded,
                            color: Colors.deepOrange,
                            onTap: () => context.push('/parent/children/$currentChildId/exams'),
                          ),
                          _QuickNavCard(
                            title: 'التقييمات الدورية',
                            subtitle: dash.latestEvaluation?.rating ?? 'عرض التقييمات',
                            icon: Icons.grade_rounded,
                            color: Colors.amber.shade800,
                            onTap: () => context.push('/parent/children/$currentChildId/evaluations'),
                          ),
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Cumulative Progress Banner
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
                                  const Text('تقرير الإنجاز الشامل', style: TextStyle(fontWeight: FontWeight.bold)),
                                  const SizedBox(height: 4),
                                  Text('مؤشرات الأداء التراكمية ومستوى التميز', style: TextStyle(color: Colors.grey.shade700, fontSize: 12)),
                                ],
                              ),
                              FilledButton.tonal(
                                onPressed: () => context.push('/parent/children/$currentChildId/progress'),
                                child: const Text('عرض التقرير'),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                  loading: () => const LoadingView(message: 'جاري تحميل بيانات الابن...'),
                  error: (err, stack) => ErrorView(
                    message: 'تعذر تحميل بيانات الابن',
                    onRetry: () => ref.refresh(childDashboardProvider(currentChildId)),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل قائمة الأبناء...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل قائمة الأبناء',
          onRetry: () => ref.refresh(parentChildrenProvider),
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
