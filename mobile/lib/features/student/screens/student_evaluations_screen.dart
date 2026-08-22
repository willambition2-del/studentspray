import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentEvaluationsScreen extends ConsumerWidget {
  const StudentEvaluationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final evalsAsync = ref.watch(studentEvaluationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('التقييمات الدورية والتربوية'),
      ),
      body: evalsAsync.when(
        data: (evaluations) {
          if (evaluations.isEmpty) {
            return const EmptyStateView(
              title: 'لا توجد تقييمات دورية مسجلة بعد',
              subtitle: 'ستظهر هنا تقييماتك السلوكية والأخلاقية فور اعتمادها من قبل معلم الحلقة',
              icon: Icons.grade_outlined,
            );
          }

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(studentEvaluationsProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: evaluations.length,
              itemBuilder: (ctx, i) {
                final ev = evaluations[i];

                Color ratingColor;
                Color ratingBg;
                String ratingLabel;

                switch (ev.rating) {
                  case 'EXCELLENT':
                    ratingColor = AppColors.statusPresent;
                    ratingBg = AppColors.statusPresentBg;
                    ratingLabel = 'ممتاز ومتميز';
                    break;
                  case 'VERY_GOOD':
                    ratingColor = AppColors.primary;
                    ratingBg = AppColors.primarySoft;
                    ratingLabel = 'جيد جداً';
                    break;
                  case 'GOOD':
                    ratingColor = AppColors.statusExcused;
                    ratingBg = AppColors.statusExcusedBg;
                    ratingLabel = 'جيد';
                    break;
                  case 'ACCEPTABLE':
                    ratingColor = AppColors.statusLate;
                    ratingBg = AppColors.statusLateBg;
                    ratingLabel = 'مقبول';
                    break;
                  default:
                    ratingColor = AppColors.statusAbsent;
                    ratingBg = AppColors.statusAbsentBg;
                    ratingLabel = 'يحتاج إلى تحسين';
                }

                return ModernCard(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            ev.period ?? 'التقييم الدوري الأول',
                            style: AppTypography.cardTitle,
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: ratingBg,
                              borderRadius: BorderRadius.circular(AppRadius.full),
                            ),
                            child: Text(
                              ratingLabel,
                              style: TextStyle(
                                fontFamily: AppTypography.fontFamily,
                                color: ratingColor,
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'تاريخ التقييم: ${ev.evaluationDate}',
                        style: AppTypography.label,
                      ),
                      const SizedBox(height: 12),
                      const Divider(height: 1),
                      const SizedBox(height: 10),
                      Row(
                        children: [
                          if (ev.behaviorScore != null)
                            _buildScorePill('السلوك والأخلاق', ev.behaviorScore!),
                          if (ev.overallScore != null) ...[
                            const SizedBox(width: 8),
                            _buildScorePill('الدرجة الإجمالية', ev.overallScore!),
                          ],
                        ],
                      ),
                      if (ev.actionLabel != null && ev.actionLabel!.isNotEmpty) ...[
                        const SizedBox(height: 8),
                        Text(
                          'التوصية: ${ev.actionLabel}',
                          style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                        ),
                      ],
                      if (ev.teacherNotes != null && ev.teacherNotes!.isNotEmpty) ...[
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'توجيهات المعلم:',
                                style: TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11.5,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                ev.teacherNotes!,
                                style: AppTypography.secondary,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل التقييمات التربوية...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل التقييمات التربوية',
          onRetry: () => ref.refresh(studentEvaluationsProvider),
        ),
      ),
    );
  }

  Widget _buildScorePill(String label, double score) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        '$label: ${score.toStringAsFixed(0)}',
        style: const TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
