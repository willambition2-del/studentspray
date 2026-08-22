import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/quick_action_item.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../notifications/providers/notification_provider.dart';
import '../../chat/providers/chat_provider.dart';
import '../models/parent_models.dart';
import '../providers/parent_provider.dart';

class ParentHomeScreen extends StatelessWidget {
  const ParentHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('بوابة ولي الأمر — الملتقى القرآني'),
        actions: const [
          _ParentChatBadgeAction(),
          _ParentNotificationBadgeAction(),
          _ParentRefreshAction(),
          _ParentLogoutAction(),
        ],
      ),
      body: const _ParentHomeBody(),
    );
  }
}

// -----------------------------------------------------------------------------
// ISOLATED APPBAR ACTION CONSUMERS
// -----------------------------------------------------------------------------

class _ParentChatBadgeAction extends ConsumerWidget {
  const _ParentChatBadgeAction();

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

class _ParentNotificationBadgeAction extends ConsumerWidget {
  const _ParentNotificationBadgeAction();

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

class _ParentRefreshAction extends ConsumerWidget {
  const _ParentRefreshAction();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return IconButton(
      icon: const Icon(Icons.refresh),
      tooltip: 'تحديث البيانات',
      onPressed: () {
        ref.read(sessionCacheServiceProvider).clearParentHome();
        ref.invalidate(parentMobileHomeProvider);
      },
    );
  }
}

class _ParentLogoutAction extends ConsumerWidget {
  const _ParentLogoutAction();

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
// ISOLATED PARENT BODY CONSUMERS
// -----------------------------------------------------------------------------

class _ParentHomeBody extends ConsumerWidget {
  const _ParentHomeBody();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childrenAsync = ref.watch(parentChildrenProvider);
    final activeChildId = ref.watch(activeChildIdProvider);

    return childrenAsync.when(
      skipLoadingOnReload: true,
      data: (children) {
        if (children.isEmpty) {
          return const EmptyStateView(
            title: 'لا يوجد أبناء مرتبطين بحسابك',
            subtitle: 'يرجى التواصل مع إدارة المجمع القرآني لربط بيانات الأبناء برقم الهوية أو الهاتف',
            icon: Icons.people_outline,
          );
        }

        final currentChildId = activeChildId ?? children.first.id;
        final currentChild = children.firstWhere(
          (c) => c.id == currentChildId,
          orElse: () => children.first,
        );

        return CustomScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          slivers: [
            SliverPadding(
              padding: const EdgeInsets.all(16),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // 1. Multi-Child Horizontal Switcher
                  Text(
                    'الأبناء والمنتسبين (${children.length})',
                    style: AppTypography.titleMedium,
                  ),
                  const SizedBox(height: 10),
                  SizedBox(
                    height: 42,
                    child: ListView.separated(
                      scrollDirection: Axis.horizontal,
                      itemCount: children.length,
                      separatorBuilder: (_, __) => const SizedBox(width: 8),
                      itemBuilder: (ctx, i) {
                        final child = children[i];
                        final isSelected = child.id == currentChildId;

                        return ChoiceChip(
                          selected: isSelected,
                          showCheckmark: false,
                          avatar: CircleAvatar(
                            radius: 10,
                            backgroundColor: isSelected ? Colors.white : AppColors.primarySoft,
                            child: Icon(
                              Icons.person_outline,
                              size: 12,
                              color: isSelected ? AppColors.primary : AppColors.primaryDark,
                            ),
                          ),
                          label: Text(child.name),
                          labelStyle: TextStyle(
                            fontFamily: AppTypography.fontFamily,
                            fontSize: 12.5,
                            fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                            color: isSelected ? Colors.white : AppColors.textPrimary,
                          ),
                          selectedColor: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.full),
                            side: BorderSide(
                              color: isSelected ? AppColors.primary : AppColors.border,
                              width: 0.8,
                            ),
                          ),
                          onSelected: (_) {
                            ref.read(activeChildIdProvider.notifier).state = child.id;
                          },
                        );
                      },
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Active Child Header Card
                  _ActiveChildHeaderCard(child: currentChild),
                  const SizedBox(height: 16),

                  // 3. Active Child Dashboard Content
                  _ActiveChildDashboardSection(currentChildId: currentChildId, childName: currentChild.name),
                ]),
              ),
            ),
          ],
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل بيانات الأبناء...'),
      error: (err, stack) => ErrorView(
        message: 'تعذر تحميل قائمة الأبناء',
        onRetry: () => ref.refresh(parentChildrenProvider),
      ),
    );
  }
}

class _ActiveChildHeaderCard extends StatelessWidget {
  final ParentChildSummary child;

  const _ActiveChildHeaderCard({required this.child});

  @override
  Widget build(BuildContext context) {
    final initial = child.name.isNotEmpty ? child.name[0] : 'ط';

    return ModernCard(
      backgroundColor: AppColors.primaryDark,
      borderColor: Colors.transparent,
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
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
                      child.name,
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'الحلقة: ${child.halaqaName} • الصلة: ${child.relationship}',
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
          const SizedBox(height: 12),
          const Divider(color: Colors.white12, height: 1),
          const SizedBox(height: 10),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'المعلم: ${child.teacherName}',
                style: const TextStyle(
                  fontFamily: AppTypography.fontFamily,
                  color: Colors.white70,
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: child.attendanceRate >= 90
                      ? AppColors.statusPresentBg
                      : AppColors.statusLateBg,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  'حضور: ${child.attendanceRate.toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: child.attendanceRate >= 90
                        ? AppColors.statusPresent
                        : AppColors.statusLate,
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _ActiveChildDashboardSection extends ConsumerWidget {
  final String currentChildId;
  final String childName;

  const _ActiveChildDashboardSection({
    required this.currentChildId,
    required this.childName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final childDashboardAsync = ref.watch(childDashboardProvider(currentChildId));

    return childDashboardAsync.when(
      skipLoadingOnReload: true,
      data: (dash) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (dash.plan != null) ...[
            ModernCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'الخطة التعليمية للابن',
                        style: AppTypography.titleMedium,
                      ),
                      TextButton.icon(
                        icon: const Icon(Icons.arrow_forward_ios, size: 12),
                        label: const Text('التفاصيل'),
                        onPressed: () => context.push('/parent/children/$currentChildId/plan'),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Text(
                    dash.plan!.name,
                    style: AppTypography.bodyMedium,
                  ),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadius.full),
                    child: LinearProgressIndicator(
                      value: (dash.plan!.progressPercentage / 100).clamp(0.0, 1.0),
                      backgroundColor: AppColors.surfaceMuted,
                      color: AppColors.primary,
                      minHeight: 6,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'المنجز: ${dash.plan!.completedItems} من ${dash.plan!.totalItems}',
                        style: AppTypography.label,
                      ),
                      Text(
                        '${dash.plan!.progressPercentage.toStringAsFixed(1)}%',
                        style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
          ],

          // Quick Navigation Grid
          const SectionHeader(
            title: 'متابعة مستوى الابن',
            icon: Icons.analytics_outlined,
          ),
          const SizedBox(height: 10),

          // 2x3 Action Cards Grid
          Row(
            children: [
              Expanded(
                child: QuickActionItem(
                  title: 'سجل التسميع',
                  subtitle: '${dash.totalMemorizations} حفظ • ${dash.totalRevisions} مراجعة',
                  icon: Icons.menu_book_outlined,
                  iconColor: AppColors.secondary,
                  iconBgColor: AppColors.secondarySoft,
                  onTap: () => context.push('/parent/children/$currentChildId/recitation'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: QuickActionItem(
                  title: 'الحضور والغياب',
                  subtitle: '${dash.attendance.attendanceRate.toStringAsFixed(1)}% نسبة الحضور',
                  icon: Icons.fact_check_outlined,
                  iconColor: AppColors.statusPresent,
                  iconBgColor: AppColors.statusPresentBg,
                  onTap: () => context.push('/parent/children/$currentChildId/attendance'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: QuickActionItem(
                  title: 'الاختبارات والنتائج',
                  subtitle: '${dash.recentResults.length} نتائج معتمدة',
                  icon: Icons.assignment_turned_in_outlined,
                  iconColor: const Color(0xFF7C3AED),
                  iconBgColor: const Color(0xFFF3E8FF),
                  onTap: () => context.push('/parent/children/$currentChildId/exams'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: QuickActionItem(
                  title: 'التقييمات الدورية',
                  subtitle: dash.latestEvaluation?.rating ?? 'عرض التقييمات',
                  icon: Icons.star_outline,
                  iconColor: const Color(0xFFD97706),
                  iconBgColor: const Color(0xFFFEF3C7),
                  onTap: () => context.push('/parent/children/$currentChildId/evaluations'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: QuickActionItem(
                  title: 'الأنشطة والجوائز',
                  subtitle: 'المسابقات والأوسمة',
                  icon: Icons.emoji_events_outlined,
                  iconColor: AppColors.accentGoldDark,
                  iconBgColor: AppColors.accentGoldSoft,
                  onTap: () => context.push(
                    '/parent/children/$currentChildId/activities-awards?name=${Uri.encodeComponent(childName)}',
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: QuickActionItem(
                  title: 'الرف العام',
                  subtitle: 'المقالات والمصادر',
                  icon: Icons.library_books_outlined,
                  iconColor: AppColors.primary,
                  iconBgColor: AppColors.primarySoft,
                  onTap: () => context.push('/shelf'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Row(
            children: [
              Expanded(
                child: QuickActionItem(
                  title: 'مركز الطلبات',
                  subtitle: 'الدعم والمواعيد والتواصل',
                  icon: Icons.contact_support_outlined,
                  iconColor: const Color(0xFF0D9488),
                  iconBgColor: const Color(0xFFCCFBF1),
                  onTap: () => context.push('/parent/requests'),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: QuickActionItem(
                  title: 'محادثة المعلم',
                  subtitle: 'التواصل المباشر',
                  icon: Icons.chat_outlined,
                  iconColor: const Color(0xFF6366F1),
                  iconBgColor: const Color(0xFFEEF2FF),
                  onTap: () => context.push('/chat'),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Cumulative Progress Banner
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'تقرير الإنجاز الشامل',
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontWeight: FontWeight.bold,
                          fontSize: 14.5,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'مؤشرات الأداء التراكمية ومستوى التميز',
                        style: AppTypography.label,
                      ),
                    ],
                  ),
                ),
                InkWell(
                  onTap: () => context.push('/parent/children/$currentChildId/progress'),
                  borderRadius: BorderRadius.circular(AppRadius.md),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    child: const Text(
                      'عرض التقرير',
                      style: TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 12.5,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      loading: () => const Padding(
        padding: EdgeInsets.all(24),
        child: LoadingView(message: 'جاري تحميل ملخص مستوى الابن...'),
      ),
      error: (err, stack) => ErrorView(
        message: 'تعذر تحميل بيانات الابن',
        onRetry: () => ref.refresh(childDashboardProvider(currentChildId)),
      ),
    );
  }
}
