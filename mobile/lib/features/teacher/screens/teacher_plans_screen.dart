import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/utils/quran_data.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherPlansScreen extends ConsumerWidget {
  const TeacherPlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(teacherPlansProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الخطط التعليمية والمقررات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () => ref.invalidate(teacherPlansProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async => ref.invalidate(teacherPlansProvider),
        child: plansAsync.when(
          data: (plans) {
            if (plans.isEmpty) {
              return const EmptyStateView(
                title: 'لا توجد خطط تعليمية مقررة حاليًا',
                subtitle: 'يتم اعتماد وتوزيع الخطط التعليمية من خلال إدارة الفرع',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: plans.length,
              itemBuilder: (context, index) {
                final plan = plans[index];
                return _buildPlanCard(context, plan);
              },
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل الخطط التعليمية...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(teacherPlansProvider),
          ),
        ),
      ),
    );
  }

  Widget _buildPlanCard(BuildContext context, TeacherEducationalPlan plan) {
    final completedCount = plan.items.where((i) => i.status == 'COMPLETED').length;
    final totalCount = plan.items.isNotEmpty ? plan.items.length : 1;
    final progress = (completedCount / totalCount).clamp(0.0, 1.0);

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 12),
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
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  plan.typeLabel,
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
          const SizedBox(height: 6),
          if (plan.halaqaName != null) ...[
            Text(
              'الحلقة المخصصة: ${plan.halaqaName}',
              style: AppTypography.secondary,
            ),
            const SizedBox(height: 8),
          ],
          Row(
            children: [
              if (plan.startDate != null)
                _buildDateBadge('البداية: ${plan.startDate!.toIso8601String().substring(0, 10)}'),
              if (plan.endDate != null) ...[
                const SizedBox(width: 8),
                _buildDateBadge('النهاية: ${plan.endDate!.toIso8601String().substring(0, 10)}'),
              ],
            ],
          ),
          if (plan.items.isNotEmpty) ...[
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(AppRadius.full),
              child: LinearProgressIndicator(
                value: progress,
                minHeight: 5,
                backgroundColor: AppColors.surfaceMuted,
                valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
              ),
            ),
            const SizedBox(height: 12),
            const Divider(height: 1),
            const SizedBox(height: 10),
            Text(
              'مفردات الخطة ($completedCount من ${plan.items.length} منجز):',
              style: AppTypography.labelBold.copyWith(color: AppColors.textPrimary),
            ),
            const SizedBox(height: 8),
            ...plan.items.take(5).map((item) {
              final surahName = QuranData.getSurahName(item.surahNumber);
              final isCompleted = item.status == 'COMPLETED';

              return Padding(
                padding: const EdgeInsets.only(bottom: 6),
                child: Row(
                  children: [
                    Icon(
                      isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
                      size: 16,
                      color: isCompleted ? AppColors.statusPresent : AppColors.textMuted,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        item.surahNumber != null
                            ? 'سورة $surahName (من آية ${item.fromAyah ?? 1} إلى ${item.toAyah ?? 10})'
                            : 'مقرر جزء ${item.juzNumber ?? 1}',
                        style: AppTypography.body.copyWith(fontSize: 13),
                      ),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: isCompleted ? AppColors.statusPresentBg : AppColors.surfaceMuted,
                        borderRadius: BorderRadius.circular(AppRadius.sm),
                      ),
                      child: Text(
                        item.statusLabel,
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 10.5,
                          fontWeight: FontWeight.bold,
                          color: isCompleted ? AppColors.statusPresent : AppColors.textSecondary,
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
            if (plan.items.length > 5) ...[
              const SizedBox(height: 4),
              Text(
                '+ ${plan.items.length - 5} عناصر أخرى في الخطة...',
                style: AppTypography.label,
              ),
            ],
          ],
        ],
      ),
    );
  }

  Widget _buildDateBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        text,
        style: AppTypography.label.copyWith(color: AppColors.textSecondary),
      ),
    );
  }
}
