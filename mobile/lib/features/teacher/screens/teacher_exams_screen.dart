import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherExamsScreen extends ConsumerWidget {
  const TeacherExamsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final examsAsync = ref.watch(teacherExamsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الاختبارات ورصد الدرجات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(teacherExamsProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(teacherExamsProvider),
        child: examsAsync.when(
          data: (exams) {
            if (exams.isEmpty) {
              return const EmptyStateView(
                title: 'لا توجد اختبارات معتمدة حاليًا',
                subtitle: 'يتم اعتماد وتوزيع الاختبارات من خلال إدارة الفرع',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: exams.length,
              itemBuilder: (context, index) {
                final exam = exams[index];
                return _buildExamCard(context, exam);
              },
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل الاختبارات...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(teacherExamsProvider),
          ),
        ),
      ),
    );
  }

  Widget _buildExamCard(BuildContext context, TeacherExamItem exam) {
    return Card(
      margin: const EdgeInsets.only(bottom: 14),
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
                    exam.title,
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
                    exam.examTypeLabel,
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
            if (exam.curriculum != null) ...[
              Text(
                'المنهج: ${exam.curriculum}',
                style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary),
              ),
              const SizedBox(height: 4),
            ],
            Row(
              children: [
                _buildInfoBadge('الدرجة العظمى: ${exam.maxScore.toStringAsFixed(0)}', Colors.grey.shade700),
                const SizedBox(width: 8),
                _buildInfoBadge('درجة النجاح: ${exam.passScore.toStringAsFixed(0)}', AppTheme.statusPresent),
                if (exam.criteria.isNotEmpty) ...[
                  const SizedBox(width: 8),
                  _buildInfoBadge('${exam.criteria.length} معايير', Colors.blue.shade700),
                ],
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  exam.scheduledDate != null
                      ? 'التاريخ: ${exam.scheduledDate!.toIso8601String().substring(0, 10)}'
                      : 'حالة الاختبار: ${exam.status}',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  ),
                  onPressed: () {
                    context.push(
                      '/teacher/exams/${exam.id}/grading?title=${Uri.encodeComponent(exam.title)}&maxScore=${exam.maxScore}&passScore=${exam.passScore}',
                    );
                  },
                  icon: const Icon(Icons.grading_rounded, size: 16),
                  label: const Text('رصد درجات الطلاب', style: TextStyle(fontSize: 13)),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withAlpha(15),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }
}
