import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/parent_provider.dart';

class ParentChildPlanScreen extends ConsumerWidget {
  final String studentId;

  const ParentChildPlanScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final planAsync = ref.watch(childPlanProvider(studentId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الخطة التعليمية للابن'),
      ),
      body: planAsync.when(
        data: (plans) {
          if (plans.isEmpty) {
            return const EmptyStateView(
              title: 'لا توجد خطة تعليمية مسجلة',
              subtitle: 'سيتم إضافة الخطة للابن من قبل المعلم قريباً',
              icon: Icons.assignment_outlined,
            );
          }

          final plan = plans.first;
          final items = plan.items;

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(childPlanProvider(studentId).future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header Plan Card
                ModernCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              plan.name,
                              style: AppTypography.titleMedium,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primarySoft,
                              borderRadius: BorderRadius.circular(AppRadius.full),
                            ),
                            child: Text(
                              plan.type == 'HIFZ' ? 'حفظ جديد' : 'مراجعة',
                              style: const TextStyle(
                                fontFamily: AppTypography.fontFamily,
                                color: AppColors.primaryDark,
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
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
                            'المنجز: ${plan.completedItems} من ${plan.totalItems} مستهدف',
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
                ),
                const SizedBox(height: 16),
                const SectionHeader(
                  title: 'المقررات والمستهدفات',
                  icon: Icons.menu_book_outlined,
                ),
                const SizedBox(height: 8),

                ...items.map((item) {
                  final status = item['status'] as String? ?? 'PENDING';
                  final isCompleted = status == 'COMPLETED';
                  final surahNumber = item['surahNumber'];
                  final fromAyah = item['fromAyah'];
                  final toAyah = item['toAyah'];

                  return ModernCard(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    child: Row(
                      children: [
                        Icon(
                          isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
                          color: isCompleted ? AppColors.statusPresent : AppColors.textMuted,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                surahNumber != null ? 'سورة رقم $surahNumber (الآيات $fromAyah - $toAyah)' : 'مقرر تعليمي',
                                style: TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: isCompleted ? AppColors.textSecondary : AppColors.textPrimary,
                                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                item['notes'] as String? ?? (isCompleted ? 'مكتمل' : 'قيد الإنجاز'),
                                style: AppTypography.label,
                              ),
                            ],
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: isCompleted ? AppColors.statusPresentBg : AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppRadius.full),
                          ),
                          child: Text(
                            isCompleted ? 'تم الإنجاز' : 'مستهدف',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontSize: 11,
                              color: isCompleted ? AppColors.statusPresent : AppColors.textSecondary,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل الخطة التعليمية...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل الخطة التعليمية للابن',
          onRetry: () => ref.refresh(childPlanProvider(studentId)),
        ),
      ),
    );
  }
}
