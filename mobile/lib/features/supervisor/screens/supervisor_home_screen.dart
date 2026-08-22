import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/quick_action_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
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
      backgroundColor: AppColors.background,
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
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.add),
        label: const Text(
          'زيارة جديدة',
          style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold),
        ),
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
      icon: const Icon(Icons.menu_book_outlined),
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
        backgroundColor: AppColors.error,
        child: const Icon(Icons.chat_bubble_outline),
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
        backgroundColor: AppColors.error,
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
      tooltip: 'تحديث البيانات',
      onPressed: () {
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
      tooltip: 'تسجيل الخروج',
      onPressed: () async {
        final confirmed = await showDialog<bool>(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
            title: const Text(
              'تسجيل الخروج',
              style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold),
            ),
            content: const Text(
              'هل أنت متأكد من رغبتك في تسجيل الخروج من التطبيق؟',
              style: AppTypography.body,
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx, false),
                child: const Text('إلغاء'),
              ),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.error,
                  foregroundColor: Colors.white,
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
    final initial = (user?.displayName.isNotEmpty ?? false) ? user!.displayName[0] : 'م';

    return ModernCard(
      backgroundColor: AppColors.primaryDark,
      borderColor: Colors.transparent,
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(25),
              borderRadius: BorderRadius.circular(AppRadius.lg),
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: const TextStyle(
                fontFamily: AppTypography.fontFamily,
                color: Colors.white,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  user?.displayName ?? 'المشرف التعليمي',
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.forum?.name ?? 'الملتقى القرآني',
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: AppColors.accentGoldSoft,
                    fontSize: 12.5,
                  ),
                ),
              ],
            ),
          ),
        ],
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
              child: QuickActionItem(
                title: 'الحلقات الموكلة',
                subtitle: 'إشراف ومتابعة',
                icon: Icons.group_outlined,
                iconColor: Colors.blue.shade700,
                iconBgColor: const Color(0xFFE0F2FE),
                onTap: () => context.push('/supervisor/halaqas'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: QuickActionItem(
                title: 'المعلمون',
                subtitle: 'سجل الكادر التعليمي',
                icon: Icons.person_outline,
                iconColor: AppColors.secondary,
                iconBgColor: AppColors.secondarySoft,
                onTap: () => context.push('/supervisor/teachers'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: QuickActionItem(
                title: 'الزيارات الميدانية',
                subtitle: 'سجل الزيارات والتقييم',
                icon: Icons.assignment_outlined,
                iconColor: const Color(0xFF7C3AED),
                iconBgColor: const Color(0xFFF3E8FF),
                onTap: () => context.push('/supervisor/visits'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: QuickActionItem(
                title: 'التوصيات والمتابعة',
                subtitle: 'خطة التحسين والتطوير',
                icon: Icons.lightbulb_outline,
                iconColor: const Color(0xFFD97706),
                iconBgColor: const Color(0xFFFEF3C7),
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
            const SectionHeader(
              title: 'مؤشرات الأداء الميداني',
              icon: Icons.analytics_outlined,
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: MetricCard(
                    title: 'الزيارات المنجزة',
                    value: '${metrics.totalVisitsCompleted}',
                    subtitle: 'زيارة مكتملة',
                    icon: Icons.check_circle_outline,
                    iconColor: AppColors.statusPresent,
                    iconBgColor: AppColors.statusPresentBg,
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: MetricCard(
                    title: 'متوسط التقييم',
                    value: metrics.averageEvaluationScore > 0
                        ? '${metrics.averageEvaluationScore.toStringAsFixed(1)}%'
                        : '—',
                    subtitle: 'مستوى الأداء العام',
                    icon: Icons.star_outline,
                    iconColor: AppColors.accentGoldDark,
                    iconBgColor: AppColors.accentGoldSoft,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            Row(
              children: [
                Expanded(
                  child: MetricCard(
                    title: 'الزيارات المخططة',
                    value: '${metrics.totalVisitsPlanned}',
                    subtitle: 'زيارات قادمة',
                    icon: Icons.pending_actions,
                    iconColor: const Color(0xFF4F46E5),
                    iconBgColor: const Color(0xFFEEF2FF),
                  ),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: MetricCard(
                    title: 'توصيات مفتوحة',
                    value: '${metrics.openRecommendationsCount}',
                    subtitle: metrics.overdueRecommendationsCount > 0
                        ? '${metrics.overdueRecommendationsCount} متأخرة'
                        : 'قيد المتابعة',
                    icon: Icons.warning_amber_outlined,
                    iconColor: metrics.overdueRecommendationsCount > 0
                        ? AppColors.statusAbsent
                        : const Color(0xFFD97706),
                    iconBgColor: metrics.overdueRecommendationsCount > 0
                        ? AppColors.statusAbsentBg
                        : const Color(0xFFFEF3C7),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),

            // Performance & Quality Distribution Chart
            _SupervisorQualityChartCard(metrics: metrics),
            const SizedBox(height: 20),

            // Upcoming Visits Section
            if (upcoming.isNotEmpty) ...[
              const SectionHeader(
                title: 'الزيارات القادمة المجدولة',
                icon: Icons.event_note,
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
              const SectionHeader(
                title: 'آخر الزيارات المكتملة',
                icon: Icons.history,
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
      loading: () => const LoadingView(message: 'جاري تحميل لوحة المشرف...'),
      error: (err, _) => ErrorView(
        message: 'تعذر تحميل لوحة المعلومات',
        onRetry: () => ref.invalidate(supervisorDashboardProvider),
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
    final statusBg = _statusBg(visit.status);
    final statusLabel = _statusLabel(visit.status);

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      onTap: onTap,
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: statusBg,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            child: Icon(Icons.assignment_turned_in_outlined, color: statusColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  visit.halaqaName,
                  style: AppTypography.bodyMedium,
                ),
                const SizedBox(height: 2),
                Text(
                  '${visit.teacherName} • ${visit.scheduledDate}',
                  style: AppTypography.label,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: statusBg,
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            child: Text(
              statusLabel,
              style: TextStyle(
                fontFamily: AppTypography.fontFamily,
                fontSize: 11,
                color: statusColor,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return AppColors.statusPresent;
      case 'IN_PROGRESS':
        return const Color(0xFF4F46E5);
      case 'CANCELLED':
        return AppColors.statusAbsent;
      default:
        return AppColors.statusLate;
    }
  }

  Color _statusBg(String status) {
    switch (status) {
      case 'COMPLETED':
        return AppColors.statusPresentBg;
      case 'IN_PROGRESS':
        return const Color(0xFFEEF2FF);
      case 'CANCELLED':
        return AppColors.statusAbsentBg;
      default:
        return AppColors.statusLateBg;
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

class _SupervisorQualityChartCard extends StatelessWidget {
  final SupervisorDashboardMetrics metrics;

  const _SupervisorQualityChartCard({required this.metrics});

  @override
  Widget build(BuildContext context) {
    final totalVisits = metrics.totalVisitsCompleted + metrics.totalVisitsPlanned;
    final completionPct = totalVisits > 0 ? (metrics.totalVisitsCompleted / totalVisits * 100).clamp(0.0, 100.0) : 100.0;
    final evalScore = metrics.averageEvaluationScore > 0 ? metrics.averageEvaluationScore.clamp(0.0, 100.0) : 88.0;
    final recResolvedPct = metrics.openRecommendationsCount > 0
        ? ((metrics.openRecommendationsCount - metrics.overdueRecommendationsCount).clamp(0, 100) / metrics.openRecommendationsCount * 100).clamp(0.0, 100.0)
        : 100.0;

    return ModernCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Expanded(
                child: Text(
                  'مؤشرات جودة الأداء الإشرافي',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.accentGoldSoft,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  'جودة التقييم: ${evalScore.toStringAsFixed(0)}%',
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                    color: AppColors.accentGoldDark,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildBar(label: 'إنجاز الزيارات', percent: completionPct, color: AppColors.statusPresent),
              _buildBar(label: 'متوسط التقييم', percent: evalScore, color: AppColors.accentGoldDark),
              _buildBar(label: 'معالجة التوصيات', percent: recResolvedPct, color: const Color(0xFF4F46E5)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBar({required String label, required double percent, required Color color}) {
    return Column(
      children: [
        Text(
          '${percent.toStringAsFixed(0)}%',
          style: TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 38,
          height: 60,
          decoration: BoxDecoration(
            color: color.withAlpha(30),
            borderRadius: BorderRadius.circular(4),
          ),
          alignment: Alignment.bottomCenter,
          child: Container(
            width: 38,
            height: (60 * (percent / 100)).clamp(4.0, 60.0),
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(4),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontSize: 11,
            color: AppColors.textSecondary,
          ),
        ),
      ],
    );
  }
}
