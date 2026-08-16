import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../models/supervisor_models.dart';
import '../providers/supervisor_provider.dart';

class SupervisorHomeScreen extends ConsumerWidget {
  const SupervisorHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final dashboardAsync = ref.watch(supervisorDashboardProvider);
    final unreadNotifs = ref.watch(unreadNotificationsCountProvider).valueOrNull ?? 0;
    final unreadChat = ref.watch(chatTotalUnreadCountProvider).valueOrNull ?? 0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('بوابة المشرف التعليمي'),
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
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(supervisorDashboardProvider);
              ref.invalidate(unreadNotificationsCountProvider);
              ref.invalidate(chatTotalUnreadCountProvider);
            },
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              ref.read(authProvider.notifier).logout();
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(supervisorDashboardProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // User Header Card
            Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              color: Theme.of(context).colorScheme.primaryContainer,
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 28,
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      child: const Icon(Icons.verified_user, color: Colors.white, size: 30),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            user?.displayName ?? 'المشرف التعليمي',
                            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            user?.forum?.name ?? 'الملتقى القرآني',
                            style: Theme.of(context).textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Quick Action Grid
            Row(
              children: [
                Expanded(
                  child: _QuickActionCard(
                    title: 'الحلقات الموكلة',
                    icon: Icons.groups,
                    color: Colors.blue.shade700,
                    onTap: () => context.push('/supervisor/halaqas'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickActionCard(
                    title: 'المعلمون',
                    icon: Icons.person_outline,
                    color: Colors.teal.shade700,
                    onTap: () => context.push('/supervisor/teachers'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _QuickActionCard(
                    title: 'الزيارات الميدانية',
                    icon: Icons.assignment_outlined,
                    color: Colors.purple.shade700,
                    onTap: () => context.push('/supervisor/visits'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _QuickActionCard(
                    title: 'التوصيات والمتابعة',
                    icon: Icons.lightbulb_outline,
                    color: Colors.orange.shade800,
                    onTap: () => context.push('/supervisor/recommendations'),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Dashboard Metrics
            dashboardAsync.when(
              data: (data) {
                final metrics = SupervisorDashboardMetrics.fromJson(
                    data['metrics'] as Map<String, dynamic>? ?? {});
                final recent = (data['recentVisits'] as List? ?? [])
                    .map((v) => FieldVisitItem.fromJson(v as Map<String, dynamic>))
                    .toList();
                final upcoming = (data['upcomingVisits'] as List? ?? [])
                    .map((v) => FieldVisitItem.fromJson(v as Map<String, dynamic>))
                    .toList();

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'مؤشرات الأداء الميداني',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _MetricCard(
                            label: 'الزيارات المنجزة',
                            value: '${metrics.totalVisitsCompleted}',
                            icon: Icons.check_circle,
                            color: Colors.green.shade700,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _MetricCard(
                            label: 'متوسط التقييم',
                            value: metrics.averageEvaluationScore > 0
                                ? '${metrics.averageEvaluationScore}%'
                                : '—',
                            icon: Icons.star,
                            color: Colors.amber.shade800,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: _MetricCard(
                            label: 'الزيارات المخططة',
                            value: '${metrics.totalVisitsPlanned}',
                            icon: Icons.pending_actions,
                            color: Colors.blue,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _MetricCard(
                            label: 'توصيات مفتوحة',
                            value: '${metrics.openRecommendationsCount}',
                            icon: Icons.warning_amber,
                            color: metrics.overdueRecommendationsCount > 0
                                ? Colors.red
                                : Colors.orange,
                            subLabel: metrics.overdueRecommendationsCount > 0
                                ? '${metrics.overdueRecommendationsCount} متأخرة'
                                : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),

                    // Upcoming Visits Section
                    if (upcoming.isNotEmpty) ...[
                      Text(
                        'الزيارات القادمة المجدولة',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      ...upcoming.map((visit) => _VisitSummaryTile(
                            visit: visit,
                            onTap: () => context.push('/supervisor/visits/${visit.id}'),
                          )),
                      const SizedBox(height: 16),
                    ],

                    // Recent Visits Section
                    if (recent.isNotEmpty) ...[
                      Text(
                        'آخر الزيارات المكتملة',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                      const SizedBox(height: 8),
                      ...recent.map((visit) => _VisitSummaryTile(
                            visit: visit,
                            onTap: () => context.push('/supervisor/visits/${visit.id}'),
                          )),
                    ],
                  ],
                );
              },
              loading: () => const Center(
                child: Padding(
                  padding: EdgeInsets.all(32),
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (err, _) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Text('تعذر تحميل لوحة المعلومات: $err'),
                ),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/supervisor/visits/new'),
        icon: const Icon(Icons.add),
        label: const Text('زيارة جديدة'),
      ),
    );
  }
}

class _QuickActionCard extends StatelessWidget {
  final String title;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _QuickActionCard({
    required this.title,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(10),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
          child: Column(
            children: [
              Icon(icon, size: 32, color: color),
              const SizedBox(height: 8),
              Text(
                title,
                textAlign: TextAlign.center,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final String? subLabel;

  const _MetricCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
    this.subLabel,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    label,
                    style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 22,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            if (subLabel != null) ...[
              const SizedBox(height: 2),
              Text(
                subLabel!,
                style: const TextStyle(fontSize: 11, color: Colors.red, fontWeight: FontWeight.bold),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _VisitSummaryTile extends StatelessWidget {
  final FieldVisitItem visit;
  final VoidCallback onTap;

  const _VisitSummaryTile({
    required this.visit,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        onTap: onTap,
        title: Text('${visit.halaqaName} — ${visit.teacherName}'),
        subtitle: Text('رقم: ${visit.visitNumber} | الحالة: ${_statusLabel(visit.status)}'),
        trailing: visit.evaluationScore != null
            ? Chip(
                label: Text('${visit.evaluationScore}%'),
                backgroundColor: Colors.green.shade100,
              )
            : const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'COMPLETED':
        return 'مكتملة';
      case 'IN_PROGRESS':
        return 'جارية';
      case 'PLANNED':
        return 'مجدولة';
      case 'CANCELLED':
        return 'ملغاة';
      default:
        return status;
    }
  }
}
