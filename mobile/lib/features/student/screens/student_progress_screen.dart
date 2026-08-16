import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentPortalProgressScreen extends ConsumerWidget {
  const StudentPortalProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(studentProgressProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('مؤشرات الإنجاز والتقدم'),
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
            onRefresh: () async => ref.refresh(studentProgressProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Top Distinction Banner
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppTheme.primaryDark, AppTheme.primary],
                      begin: Alignment.topRight,
                      end: Alignment.bottomLeft,
                    ),
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: AppTheme.primaryDark.withAlpha(77),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      const Icon(Icons.workspace_premium_rounded, color: Colors.amber, size: 48),
                      const SizedBox(height: 10),
                      Text(
                        statusLabel,
                        style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'استمر في العطاء والالتزام للوصول إلى ختم القرآن الكريم بتفوق وإتقان',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.white70, fontSize: 13),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                Text(
                  'المؤشرات التراكمية',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 12),

                // Metrics Grid
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  mainAxisSpacing: 12,
                  crossAxisSpacing: 12,
                  childAspectRatio: 1.3,
                  children: [
                    _MetricCard(
                      title: 'نسبة الحضور',
                      value: '${attendanceRate.toStringAsFixed(1)}%',
                      subtitle: '$totalSessions جلسة مسجلة',
                      color: Colors.green,
                      icon: Icons.check_circle_outline,
                    ),
                    _MetricCard(
                      title: 'معدل الاختبارات',
                      value: '${examAvg.toStringAsFixed(1)}%',
                      subtitle: '$totalExams اختبارات معتمدة',
                      color: Colors.deepOrange,
                      icon: Icons.assignment_turned_in_outlined,
                    ),
                    _MetricCard(
                      title: 'مقررات الحفظ',
                      value: '$totalHifz',
                      subtitle: 'تسميعات حفظ متقنة',
                      color: Colors.teal,
                      icon: Icons.bookmark_added_outlined,
                    ),
                    _MetricCard(
                      title: 'مقررات المراجعة',
                      value: '$totalRev',
                      subtitle: 'تسميعات تثبيت ومراجعة',
                      color: Colors.indigo,
                      icon: Icons.auto_stories_outlined,
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Overall Evaluation Progress
                Card(
                  elevation: 1,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('متوسط التقييمات السلوكية والتربوية', style: TextStyle(fontWeight: FontWeight.bold)),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: LinearProgressIndicator(
                                value: (evalAvg / 100).clamp(0.0, 1.0),
                                backgroundColor: Colors.grey.shade200,
                                color: AppTheme.primary,
                                minHeight: 10,
                                borderRadius: BorderRadius.circular(5),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Text(
                              '${evalAvg.toStringAsFixed(1)}%',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: AppTheme.primary),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل مؤشرات التقدم...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل مؤشرات التقدم',
          onRetry: () => ref.refresh(studentProgressProvider),
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String subtitle;
  final MaterialColor color;
  final IconData icon;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.subtitle,
    required this.color,
    required this.icon,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade700)),
                Icon(icon, size: 18, color: color.shade700),
              ],
            ),
            const SizedBox(height: 6),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color.shade900)),
            const SizedBox(height: 2),
            Text(subtitle, style: TextStyle(fontSize: 10, color: Colors.grey.shade600), maxLines: 1),
          ],
        ),
      ),
    );
  }
}
