import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentPlanScreen extends ConsumerWidget {
  const StudentPlanScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(studentPlanProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الخطة التعليمية'),
      ),
      body: plansAsync.when(
        data: (plans) {
          if (plans.isEmpty) {
            return const EmptyStateView(
              title: 'لا توجد خطة تعليمية نشطة',
              subtitle: 'سيتم إضافة الخطة من قبل المشرف أو المعلم قريباً',
              icon: Icons.assignment_outlined,
            );
          }

          final plan = plans.first;
          final items = plan.items;

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(studentPlanProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Header Plan Card
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              plan.name,
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                            ),
                            Chip(
                              label: Text(plan.type == 'HIFZ' ? 'حفظ جديد' : 'مراجعة'),
                              backgroundColor: AppTheme.primaryLight.withAlpha(50),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        LinearProgressIndicator(
                          value: plan.progressPercentage / 100,
                          backgroundColor: Colors.grey.shade200,
                          color: AppTheme.primary,
                          minHeight: 10,
                          borderRadius: BorderRadius.circular(5),
                        ),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text('المنجز: ${plan.completedItems} من ${plan.totalItems} مستهدف'),
                            Text(
                              '${plan.progressPercentage.toStringAsFixed(1)}%',
                              style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'المقررات والمستهدفات',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),

                ...items.map((item) {
                  final status = item['status'] as String? ?? 'PENDING';
                  final isCompleted = status == 'COMPLETED';
                  final surahNumber = item['surahNumber'];
                  final fromAyah = item['fromAyah'];
                  final toAyah = item['toAyah'];

                  return Card(
                    margin: const EdgeInsets.only(bottom: 8),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    child: ListTile(
                      leading: CircleAvatar(
                        backgroundColor: isCompleted ? Colors.green.shade100 : Colors.amber.shade100,
                        child: Icon(
                          isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
                          color: isCompleted ? Colors.green.shade800 : Colors.amber.shade800,
                        ),
                      ),
                      title: Text(
                        surahNumber != null ? 'سورة رقم $surahNumber (الآيات $fromAyah - $toAyah)' : 'مقرر تعليمي',
                        style: TextStyle(
                          fontWeight: FontWeight.bold,
                          decoration: isCompleted ? TextDecoration.lineThrough : null,
                        ),
                      ),
                      subtitle: Text(item['notes'] as String? ?? (isCompleted ? 'مكتمل' : 'قيد الإنجاز')),
                      trailing: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: isCompleted ? Colors.green.shade50 : Colors.amber.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isCompleted ? Colors.green.shade300 : Colors.amber.shade300,
                          ),
                        ),
                        child: Text(
                          isCompleted ? 'تم الإنجاز' : 'مستهدف',
                          style: TextStyle(
                            fontSize: 12,
                            color: isCompleted ? Colors.green.shade800 : Colors.amber.shade800,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  );
                }),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل الخطة التعليمية...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل الخطة التعليمية',
          onRetry: () => ref.refresh(studentPlanProvider),
        ),
      ),
    );
  }
}
