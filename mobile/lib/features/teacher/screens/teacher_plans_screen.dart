import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/quran_data.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherPlansScreen extends ConsumerWidget {
  const TeacherPlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(teacherPlansProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الخطط التعليمية والمقررات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(teacherPlansProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
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
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
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
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    plan.typeLabel,
                    style: const TextStyle(
                      color: AppTheme.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            if (plan.halaqaName != null) ...[
              Text(
                'الحلقة المخصصة: ${plan.halaqaName}',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 4),
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
              const Divider(height: 1),
              const SizedBox(height: 10),
              const Text('عناصر الخطة المقررة:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13, color: AppTheme.textPrimary)),
              const SizedBox(height: 8),
              ...plan.items.take(5).map((item) {
                final surahName = QuranData.getSurahName(item.surahNumber);
                return Padding(
                  padding: const EdgeInsets.only(bottom: 6),
                  child: Row(
                    children: [
                      Icon(
                        item.status == 'COMPLETED' ? Icons.check_circle_rounded : Icons.radio_button_unchecked_rounded,
                        size: 16,
                        color: item.status == 'COMPLETED' ? AppTheme.statusPresent : Colors.grey,
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          item.surahNumber != null
                              ? 'سورة $surahName (من آية ${item.fromAyah ?? 1} إلى ${item.toAyah ?? 10})'
                              : 'مقرر جزء ${item.juzNumber ?? 1}',
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(item.statusLabel, style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary)),
                      ),
                    ],
                  ),
                );
              }),
              if (plan.items.length > 5) ...[
                const SizedBox(height: 4),
                Text(
                  '+ ${plan.items.length - 5} عناصر أخرى في الخطة...',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                ),
              ],
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildDateBadge(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
      ),
    );
  }
}
