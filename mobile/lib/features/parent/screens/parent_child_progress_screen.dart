import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/parent_provider.dart';

class ParentChildProgressScreen extends ConsumerWidget {
  final String studentId;

  const ParentChildProgressScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(childProgressProvider(studentId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('تقرير إنجاز الابن'),
      ),
      body: progressAsync.when(
        data: (data) {
          final attendanceRate = (data['attendanceRate'] as num?)?.toDouble() ?? 100.0;
          final totalSessions = (data['totalSessions'] as num?)?.toInt() ?? 0;
          final totalHifz = (data['totalMemorizations'] as num?)?.toInt() ?? 0;
          final totalRev = (data['totalRevisions'] as num?)?.toInt() ?? 0;
          final totalExams = (data['totalExamsTaken'] as num?)?.toInt() ?? 0;
          final examAvg = (data['examAveragePercentage'] as num?)?.toDouble() ?? 0.0;
          final evalAvg = (data['evaluationAverage'] as num?)?.toDouble() ?? 0.0;
          final statusLabel = data['statusLabel'] as String? ?? 'ملتزم بالخطة';

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(childProgressProvider(studentId).future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Distinction Banner
                ModernCard(
                  backgroundColor: AppColors.primaryDark,
                  borderColor: Colors.transparent,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Icon(Icons.emoji_events_outlined, color: AppColors.accentGold, size: 44),
                      const SizedBox(height: 10),
                      Text(
                        statusLabel,
                        style: const TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          color: Colors.white,
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'متابعة دورية مستمرة لتعزيز مستوى الابن في حفظ القرآن الكريم والتزامه بالحلقة',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          color: Colors.white70,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                const SectionHeader(
                  title: 'المؤشرات التراكمية للابن',
                  icon: Icons.analytics_outlined,
                ),
                const SizedBox(height: 10),

                // Metrics Grid
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'نسبة الحضور',
                        value: '${attendanceRate.toStringAsFixed(1)}%',
                        subtitle: '$totalSessions جلسة مسجلة',
                        icon: Icons.check_circle_outline,
                        iconColor: AppColors.statusPresent,
                        iconBgColor: AppColors.statusPresentBg,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: MetricCard(
                        title: 'معدل الاختبارات',
                        value: '${examAvg.toStringAsFixed(1)}%',
                        subtitle: '$totalExams اختبارات معتمدة',
                        icon: Icons.assignment_turned_in_outlined,
                        iconColor: const Color(0xFF7C3AED),
                        iconBgColor: const Color(0xFFF3E8FF),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'جلسات الحفظ',
                        value: '$totalHifz',
                        subtitle: 'مقررات حفظ منجزة',
                        icon: Icons.menu_book_outlined,
                        iconColor: AppColors.secondary,
                        iconBgColor: AppColors.secondarySoft,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: MetricCard(
                        title: 'جلسات المراجعة',
                        value: '$totalRev',
                        subtitle: 'تثبيت ومراجعة',
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
                        title: 'متوسط التقييم التربوي',
                        value: '${evalAvg.toStringAsFixed(1)} / 100',
                        subtitle: 'السلوك والانضباط',
                        icon: Icons.star_outline,
                        iconColor: AppColors.accentGoldDark,
                        iconBgColor: AppColors.accentGoldSoft,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل تقرير إنجاز الابن...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل تقرير إنجاز الابن',
          onRetry: () => ref.refresh(childProgressProvider(studentId)),
        ),
      ),
    );
  }
}
