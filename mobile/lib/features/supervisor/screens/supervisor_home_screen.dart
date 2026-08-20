import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../models/supervisor_models.dart';
import '../providers/supervisor_provider.dart';

class SupervisorHomeScreen extends StatelessWidget {
  const SupervisorHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('بوابة المشرف التعليمي'),
        actions: const [
          _AdminHubAction(),
          _ShelfAction(),
          _SupervisorChatBadgeAction(),
          _SupervisorNotificationBadgeAction(),
          _SupervisorRefreshAction(),
          _SupervisorLogoutAction(),
        ],
      ),
      body: const _SupervisorHomeBody(),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/supervisor/visits/new'),
        icon: const Icon(Icons.add),
        label: const Text('زيارة جديدة'),
      ),
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED APPBAR ACTION CONSUMERS
// -----------------------------------------------------------------------------

class _AdminHubAction extends StatelessWidget {
  const _AdminHubAction();

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.assignment_outlined),
      tooltip: 'الشؤون الإدارية والتكليفات',
      onPressed: () => context.push('/admin-hub'),
    );
  }
}

class _ShelfAction extends StatelessWidget {
  const _ShelfAction();

  @override
  Widget build(BuildContext context) {
    return IconButton(
      icon: const Icon(Icons.menu_book_rounded),
      tooltip: 'الرف العام',
      onPressed: () => context.push('/shelf'),
    );
  }
}

class _SupervisorChatBadgeAction extends ConsumerWidget {
  const _SupervisorChatBadgeAction();

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

class _SupervisorNotificationBadgeAction extends ConsumerWidget {
  const _SupervisorNotificationBadgeAction();

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

class _SupervisorRefreshAction extends ConsumerWidget {
  const _SupervisorRefreshAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: const Icon(Icons.refresh),
      onPressed: () {
        ref.read(sessionCacheServiceProvider).clearSupervisorDashboard();
        ref.invalidate(supervisorDashboardProvider);
      },
    );
  }
}

class _SupervisorLogoutAction extends ConsumerWidget {
  const _SupervisorLogoutAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: const Icon(Icons.logout),
      onPressed: () {
        ref.read(authProvider.notifier).logout();
      },
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED SUPERVISOR BODY CONSUMERS
// -----------------------------------------------------------------------------

class _SupervisorHomeBody extends StatelessWidget {
  const _SupervisorHomeBody();

  @override
  Widget build(BuildContext context) {
    return const CustomScrollView(
      physics: AlwaysScrollableScrollPhysics(),
      slivers: [
        SliverPadding(
          padding: EdgeInsets.all(16),
          sliver: SliverList(
            delegate: SliverChildListDelegate.fixed([
              // 1. User Header Card
              _SupervisorHeaderSection(),
              SizedBox(height: 16),

              // 2. Quick Action Feature Grid
              _SupervisorQuickActionsSection(),
              SizedBox(height: 20),

              // 3. Dashboard Metrics & Visits
              _SupervisorDashboardSection(),
            ]),
          ),
        ),
      ],
    );
  }
}

class _SupervisorHeaderSection extends ConsumerWidget {
  const _SupervisorHeaderSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider.select((s) => s.user));

    return Card(
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
    );
  }
}

class _SupervisorQuickActionsSection extends StatelessWidget {
  const _SupervisorQuickActionsSection();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
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
      ],
    );
  }
}

class _SupervisorDashboardSection extends ConsumerWidget {
  const _SupervisorDashboardSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dashboardAsync = ref.watch(supervisorDashboardProvider);

    return dashboardAsync.when(
      skipLoadingOnReload: true,
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
      loading: () => const Padding(
        padding: EdgeInsets.all(16),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      error: (err, _) => Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              Text('تعذر تحميل لوحة المعلومات: $err'),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                icon: const Icon(Icons.refresh),
                label: const Text('إعادة المحاولة'),
                onPressed: () => ref.invalidate(supervisorDashboardProvider),
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
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            CircleAvatar(
              radius: 20,
              backgroundColor: color.withAlpha(38),
              child: Icon(icon, color: color, size: 22),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (subLabel != null) ...[
                    const SizedBox(height: 2),
                    Text(
                      subLabel!,
                      style: TextStyle(
                        fontSize: 10,
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
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              CircleAvatar(
                radius: 18,
                backgroundColor: color.withAlpha(38),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  title,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
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
    final statusColor = _statusColor(visit.status);
    final statusLabel = _statusLabel(visit.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      child: ListTile(
        onTap: onTap,
        title: Text(
          visit.halaqaName,
          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
        ),
        subtitle: Text(
          '${visit.teacherName} • ${visit.scheduledDate}',
          style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withAlpha(38),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text(
            statusLabel,
            style: TextStyle(
              fontSize: 11,
              color: statusColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.green.shade700;
      case 'IN_PROGRESS':
        return Colors.blue;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.orange.shade800;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'COMPLETED':
        return 'مكتملة';
      case 'IN_PROGRESS':
        return 'جارية';
      case 'CANCELLED':
        return 'ملغاة';
      default:
        return 'مجدولة';
    }
  }
}
