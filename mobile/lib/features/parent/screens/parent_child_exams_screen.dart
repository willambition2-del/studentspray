import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/state_views.dart';
import '../../student/models/student_models.dart';
import '../providers/parent_provider.dart';

class ParentChildExamsScreen extends ConsumerWidget {
  final String studentId;

  const ParentChildExamsScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final examsAsync = ref.watch(childExamsProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('اختبارات ونتائج الابن'),
      ),
      body: examsAsync.when(
        data: (data) {
          final upcoming = data['upcomingExams'] as List<UpcomingExamModel>? ?? [];
          final results = data['results'] as List<ExamResultModel>? ?? [];

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(childExamsProvider(studentId).future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 1. Upcoming Exams Section
                if (upcoming.isNotEmpty) ...[
                  Text(
                    'الاختبارات المجدولة والقادمة',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  ...upcoming.map((e) => Card(
                        elevation: 1,
                        margin: const EdgeInsets.only(bottom: 10),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                        child: Padding(
                          padding: const EdgeInsets.all(14),
                          child: Row(
                            children: [
                              CircleAvatar(
                                backgroundColor: Colors.deepOrange.shade100,
                                child: Icon(Icons.event_available, color: Colors.deepOrange.shade800),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(e.title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                    const SizedBox(height: 4),
                                    Text(
                                      e.scheduledDate != null ? 'الموعد: ${e.scheduledDate}' : 'محدد قريباً',
                                      style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                                    ),
                                  ],
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: Colors.blue.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  'الدرجة: ${e.maxScore.toStringAsFixed(0)}',
                                  style: TextStyle(color: Colors.blue.shade800, fontWeight: FontWeight.bold, fontSize: 12),
                                ),
                              ),
                            ],
                          ),
                        ),
                      )),
                  const SizedBox(height: 16),
                ],

                // 2. Published Results Section
                Text(
                  'النتائج المعتمدة للابن',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),

                if (results.isEmpty)
                  const EmptyStateView(
                    title: 'لا توجد نتائج معتمدة منشورة بعد',
                    subtitle: 'ستظهر هنا نتائج اختبارات الابن فور اعتمادها من قبل إدارة المجمع والمشرف التربوي',
                    icon: Icons.assignment_late_outlined,
                  )
                else
                  ...results.map((r) {
                    return Card(
                      elevation: 2,
                      margin: const EdgeInsets.only(bottom: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Expanded(
                                  child: Text(
                                    r.examTitle,
                                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: r.isPassed ? Colors.green.shade50 : Colors.red.shade50,
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: r.isPassed ? Colors.green.shade300 : Colors.red.shade300,
                                    ),
                                  ),
                                  child: Text(
                                    r.isPassed ? 'ناجح' : 'راسب',
                                    style: TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                      color: r.isPassed ? Colors.green.shade800 : Colors.red.shade800,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('الدرجة المحصلة: ${r.score} من ${r.maxScore}'),
                                Text(
                                  '${r.percentage.toStringAsFixed(1)}%',
                                  style: TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: r.isPassed ? Colors.green.shade700 : Colors.red.shade700,
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value: (r.percentage / 100).clamp(0.0, 1.0),
                              backgroundColor: Colors.grey.shade200,
                              color: r.isPassed ? Colors.green : Colors.red,
                              minHeight: 6,
                              borderRadius: BorderRadius.circular(3),
                            ),
                            if (r.notes != null && r.notes!.isNotEmpty) ...[
                              const SizedBox(height: 10),
                              Text(
                                'ملاحظات: ${r.notes}',
                                style: TextStyle(color: Colors.grey.shade700, fontSize: 12, fontStyle: FontStyle.italic),
                              ),
                            ],
                          ],
                        ),
                      ),
                    );
                  }),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل الاختبارات والنتائج...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل اختبارات الابن',
          onRetry: () => ref.refresh(childExamsProvider(studentId)),
        ),
      ),
    );
  }
}
