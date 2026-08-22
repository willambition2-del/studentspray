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
import '../models/student_models.dart';
import '../providers/student_provider.dart';

class StudentHomeScreen extends StatelessWidget {
  const StudentHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
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
        backgroundColor: AppColors.error,
        child: const Icon(Icons.chat_bubble_outline),
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
        backgroundColor: AppColors.error,
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
      icon: const Icon(Icons.refresh),
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
                ModernCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'مؤشرات الإنجاز والتميز',
                              style: TextStyle(
                                fontFamily: AppTypography.fontFamily,
                                fontWeight: FontWeight.bold,
                                fontSize: 14.5,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            SizedBox(height: 2),
                            Text(
                              'سجل تفصيلي لتقدمك في الحفظ والالتزام',
                              style: AppTypography.label,
                            ),
                          ],
                        ),
                      ),
                      InkWell(
                        onTap: () => context.push('/student/progress'),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: const Text(
                            'عرض المؤشرات',
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
              ]),
            ),
          ),
        ],
      ),
      loading: () => const LoadingView(message: 'جاري تحميل لوحة الطالب...'),
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
    final initial = data.student.name.isNotEmpty ? data.student.name[0] : 'ط';

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
                      data.student.name,
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'الحلقة: ${data.student.halaqaName}',
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        color: AppColors.accentGoldSoft,
                        fontSize: 12.5,
                      ),
                    ),
                  ],
                ),
              ),
              if (data.latestEvaluation != null)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppColors.accentGoldSoft,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.star, color: AppColors.accentGoldDark, size: 16),
                      SizedBox(width: 4),
                      Text(
                        'متميز',
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          color: AppColors.accentGoldDark,
                          fontWeight: FontWeight.bold,
                          fontSize: 11.5,
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
                'المعلم: ${data.student.teacherName}',
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
                  color: data.attendance.attendanceRate >= 90
                      ? AppColors.statusPresentBg
                      : AppColors.statusLateBg,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  'حضور: ${data.attendance.attendanceRate.toStringAsFixed(0)}%',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: data.attendance.attendanceRate >= 90
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

class _StudentPlanCard extends StatelessWidget {
  final PlanSummaryModel plan;

  const _StudentPlanCard({required this.plan});

  @override
  Widget build(BuildContext context) {
    return ModernCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'الخطة التعليمية الحالية',
                style: AppTypography.titleMedium,
              ),
              TextButton.icon(
                icon: const Icon(Icons.arrow_forward_ios, size: 12),
                label: const Text('تفاصيل الخطة'),
                onPressed: () => context.push('/student/plan'),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            plan.name,
            style: AppTypography.bodyMedium,
          ),
          const SizedBox(height: 10),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppRadius.full),
            child: LinearProgressIndicator(
              value: (plan.progressPercentage / 100).clamp(0.0, 1.0),
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
                'المكتمل: ${plan.completedItems} من ${plan.totalItems}',
                style: AppTypography.label,
              ),
              Text(
                '${plan.progressPercentage.toStringAsFixed(1)}%',
                style: AppTypography.labelBold.copyWith(color: AppColors.primary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _StudentQuickActionsSection extends ConsumerWidget {
  const _StudentQuickActionsSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SectionHeader(
          title: 'الخدمات والأقسام',
          icon: Icons.grid_view,
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: QuickActionItem(
                title: 'سجل التسميع',
                subtitle: 'الحفظ والمراجعة',
                icon: Icons.menu_book_outlined,
                iconColor: AppColors.secondary,
                iconBgColor: AppColors.secondarySoft,
                onTap: () => context.push('/student/recitation'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: QuickActionItem(
                title: 'الحضور والغياب',
                subtitle: 'سجل الحضور',
                icon: Icons.fact_check_outlined,
                iconColor: AppColors.statusPresent,
                iconBgColor: AppColors.statusPresentBg,
                onTap: () => context.push('/student/attendance'),
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
                subtitle: 'نتائج الاختبارات',
                icon: Icons.assignment_turned_in_outlined,
                iconColor: const Color(0xFF7C3AED),
                iconBgColor: const Color(0xFFF3E8FF),
                onTap: () => context.push('/student/exams'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: QuickActionItem(
                title: 'التقييمات الدورية',
                subtitle: 'التقييم السلوكي',
                icon: Icons.star_outline,
                iconColor: const Color(0xFFD97706),
                iconBgColor: const Color(0xFFFEF3C7),
                onTap: () => context.push('/student/evaluations'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: QuickActionItem(
                title: 'الأنشطة والفعاليات',
                subtitle: 'البرامج والرحلات',
                icon: Icons.event_available_outlined,
                iconColor: Colors.blue.shade700,
                iconBgColor: const Color(0xFFE0F2FE),
                onTap: () => context.push('/student/activities'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: QuickActionItem(
                title: 'المسابقات والنتائج',
                subtitle: 'لوحة التنافس',
                icon: Icons.emoji_events_outlined,
                iconColor: const Color(0xFF9333EA),
                iconBgColor: const Color(0xFFFAF5FF),
                onTap: () => context.push('/student/competitions'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: QuickActionItem(
                title: 'لوحة الأوسمة',
                subtitle: 'أوسمة التميز',
                icon: Icons.emoji_events_outlined,
                iconColor: AppColors.accentGoldDark,
                iconBgColor: AppColors.accentGoldSoft,
                onTap: () => context.push('/student/awards'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: QuickActionItem(
                title: 'التواصل والمقترحات',
                subtitle: 'المساعد الذكي والمقترحات',
                icon: Icons.contact_support_outlined,
                iconColor: const Color(0xFF0D9488),
                iconBgColor: const Color(0xFFCCFBF1),
                onTap: () => _showStudentCommunicationHub(context, ref),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
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
      ],
    );
  }

  void _showStudentCommunicationHub(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'مركز التواصل والمقترحات الطلابية',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 12),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFEEF2FF), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.assignment_turned_in, color: Color(0xFF6366F1)),
              ),
              title: const Text('تسليم واجب / ملاحظة تسميع'),
              subtitle: const Text('إرسال استفسار أو إجابة تكليف إلى معلم الحلقة'),
              onTap: () {
                Navigator.pop(ctx);
                _showTaskResponseDialog(context, ref);
              },
            ),
            const Divider(),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFFEF3C7), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.lightbulb_outline, color: Color(0xFFD97706)),
              ),
              title: const Text('تقديم مقترح تطويري للحلقة'),
              subtitle: const Text('شارك أفكارك ومقترحاتك لتعزيز بيئة الحلقة القرآنية'),
              onTap: () {
                Navigator.pop(ctx);
                _showProposalDialog(context, ref);
              },
            ),
            const Divider(),
            ListTile(
              leading: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFFFFE4E6), borderRadius: BorderRadius.circular(8)),
                child: const Icon(Icons.event_busy, color: Color(0xFFE11D48)),
              ),
              title: const Text('إرسال إشعار عذر غياب'),
              subtitle: const Text('إشعار مسبق لمعلم الحلقة وإدارة الفرع'),
              onTap: () {
                Navigator.pop(ctx);
                context.push('/student/attendance');
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showTaskResponseDialog(BuildContext context, WidgetRef ref) {
    final textController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تسليم واجب / إشعار المعلم'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: textController,
              decoration: const InputDecoration(
                labelText: 'اكتب نص الإجابة أو الاستفسار *',
                border: OutlineInputBorder(),
                hintText: 'تمت مراجعة سورة البقرة من الآية 1 إلى 50...',
              ),
              maxLines: 4,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
            onPressed: () async {
              if (textController.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                final apiClient = ref.read(apiClientProvider);
                await apiClient.post('/student/me/homework-submissions', data: {
                  'taskTitle': 'واجب يومي',
                  'content': textController.text.trim(),
                });
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('✓ تم تسليم إجابتك وتكليفك وحفظه في السيرفر بنجاح'), backgroundColor: AppColors.statusPresent),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('تعذر تسليم الواجب: $e'), backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: const Text('إرسال'),
          ),
        ],
      ),
    );
  }

  void _showProposalDialog(BuildContext context, WidgetRef ref) {
    final titleController = TextEditingController();
    final contentController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تقديم مقترح تطويري'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: titleController,
              decoration: const InputDecoration(labelText: 'عنوان المقترح *', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: contentController,
              decoration: const InputDecoration(labelText: 'تفاصيل الفكرة والمقترح *', border: OutlineInputBorder()),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0D9488), foregroundColor: Colors.white),
            onPressed: () async {
              if (titleController.text.trim().isEmpty || contentController.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                final apiClient = ref.read(apiClientProvider);
                await apiClient.post('/student/me/proposals', data: {
                  'title': titleController.text.trim(),
                  'description': contentController.text.trim(),
                });
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('✓ شكراً لمشاركتك! تم رفع مقترحك واعتماده في السيرفر بنجاح'), backgroundColor: Color(0xFF0D9488)),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('تعذر رفع المقترح: $e'), backgroundColor: Colors.red),
                  );
                }
              }
            },
            child: const Text('رفع المقترح'),
          ),
        ],
      ),
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
        const SectionHeader(
          title: 'الاختبارات القادمة',
          icon: Icons.event_note,
        ),
        const SizedBox(height: 8),
        ...upcomingExams.map(
          (e) => ModernCard(
            margin: const EdgeInsets.only(bottom: 8),
            padding: const EdgeInsets.all(12),
            onTap: () => context.push('/student/exams'),
            child: Row(
              children: [
                Container(
                  width: 38,
                  height: 38,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF3E8FF),
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: const Icon(Icons.event_note, color: Color(0xFF7C3AED), size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(e.title, style: AppTypography.bodyMedium),
                      const SizedBox(height: 2),
                      Text(
                        e.scheduledDate != null ? 'الموعد: ${e.scheduledDate}' : 'الدرجة القصوى: ${e.maxScore}',
                        style: AppTypography.label,
                      ),
                    ],
                  ),
                ),
                const Icon(Icons.chevron_left, size: 18, color: AppColors.textMuted),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
