import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class TeacherReportsScreen extends ConsumerWidget {
  const TeacherReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(teacherDashboardStatsProvider);
    final halaqasAsync = ref.watch(myHalaqasProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('التقارير والإحصائيات التحليلية'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () {
              ref.invalidate(teacherDashboardStatsProvider);
              ref.invalidate(myHalaqasProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async {
          ref.invalidate(teacherDashboardStatsProvider);
          ref.invalidate(myHalaqasProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // KPI Summary Cards
            statsAsync.when(
              data: (stats) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const SectionHeader(
                    title: 'الملخص التراكمي العام للحلقات',
                    icon: Icons.analytics_outlined,
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Expanded(
                        child: MetricCard(
                          title: 'معدل الحضور',
                          value: '${stats.attendanceRate.toStringAsFixed(1)}%',
                          subtitle: '${stats.todayPresent} حاضر • ${stats.todayAbsent} غائب',
                          icon: Icons.fact_check_outlined,
                          iconColor: stats.attendanceRate >= 80 ? AppColors.statusPresent : AppColors.statusAbsent,
                          iconBgColor: stats.attendanceRate >= 80 ? AppColors.statusPresentBg : AppColors.statusAbsentBg,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: MetricCard(
                          title: 'إجمالي الطلاب',
                          value: '${stats.totalStudents}',
                          subtitle: '${stats.totalHalaqas} حلقات تعليمية',
                          icon: Icons.school_outlined,
                          iconColor: AppColors.primary,
                          iconBgColor: AppColors.primarySoft,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: MetricCard(
                          title: 'جلسات التسميع',
                          value: '${stats.todayMemorization}',
                          subtitle: 'جلسات يومية منجزة',
                          icon: Icons.menu_book_outlined,
                          iconColor: AppColors.secondary,
                          iconBgColor: AppColors.secondarySoft,
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: MetricCard(
                          title: 'جلسات المراجعة',
                          value: '${stats.todayRevision}',
                          subtitle: 'تثبيت ومراجعة مستمرة',
                          icon: Icons.refresh,
                          iconColor: const Color(0xFF4F46E5),
                          iconBgColor: const Color(0xFFEEF2FF),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: MetricCard(
                          title: 'الاختبارات المقررة',
                          value: '${stats.upcomingExams}',
                          subtitle: 'اختبارات معتمدة',
                          icon: Icons.assignment_turned_in_outlined,
                          iconColor: const Color(0xFF7C3AED),
                          iconBgColor: const Color(0xFFF3E8FF),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: MetricCard(
                          title: 'التقييمات المسجلة',
                          value: '${stats.recordedEvaluations}',
                          subtitle: 'تقييمات سلوكية دورية',
                          icon: Icons.star_outline,
                          iconColor: const Color(0xFFD97706),
                          iconBgColor: const Color(0xFFFEF3C7),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              loading: () => const LoadingView(message: 'جاري حساب المؤشرات التراكمية...'),
              error: (err, _) => ErrorView(message: err.toString()),
            ),
            const SizedBox(height: 20),

            // Performance by Halaqa Section
            const SectionHeader(
              title: 'مؤشرات الأداء حسب الحلقة',
              icon: Icons.group_outlined,
            ),
            const SizedBox(height: 4),

            halaqasAsync.when(
              data: (halaqas) {
                if (halaqas.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا توجد حلقات متاحة',
                    subtitle: 'تواصل مع الإدارة لتخصيص الحلقات',
                  );
                }

                return Column(
                  children: halaqas.map((h) {
                    return ModernCard(
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(14),
                      child: Row(
                        children: [
                          Container(
                            width: 42,
                            height: 42,
                            decoration: BoxDecoration(
                              color: AppColors.primarySoft,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                            ),
                            child: const Icon(
                              Icons.group_outlined,
                              color: AppColors.primary,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  h.name,
                                  style: AppTypography.bodyMedium,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${h.branchName} • رمز: ${h.code} • ${h.studentsCount} طالب',
                                  style: AppTypography.secondary,
                                ),
                              ],
                            ),
                          ),
                          TextButton(
                            onPressed: () => context.push('/teacher/halaqas/${h.id}'),
                            child: const Row(
                              children: [
                                Text('عرض', style: TextStyle(fontFamily: AppTypography.fontFamily)),
                                SizedBox(width: 2),
                                Icon(Icons.arrow_back_ios, size: 10),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  }).toList(),
                );
              },
              loading: () => const LoadingView(message: 'جاري تحميل حلقات المعلم...'),
              error: (err, _) => ErrorView(message: err.toString()),
            ),
          ],
        ),
      ),
    );
  }
}
