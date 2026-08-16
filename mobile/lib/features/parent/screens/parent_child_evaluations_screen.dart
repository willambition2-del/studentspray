import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/parent_provider.dart';

class ParentChildEvaluationsScreen extends ConsumerWidget {
  final String studentId;

  const ParentChildEvaluationsScreen({super.key, required this.studentId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final evalsAsync = ref.watch(childEvaluationsProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('التقييمات التربوية للابن'),
      ),
      body: evalsAsync.when(
        data: (evaluations) {
          if (evaluations.isEmpty) {
            return const EmptyStateView(
              title: 'لا توجد تقييمات دورية مسجلة للابن بعد',
              subtitle: 'ستظهر هنا التقييمات السلوكية والتربوية فور اعتمادها من قبل معلم الحلقة',
              icon: Icons.grade_outlined,
            );
          }

          return RefreshIndicator(
            onRefresh: () async => ref.refresh(childEvaluationsProvider(studentId).future),
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: evaluations.length,
              itemBuilder: (ctx, i) {
                final ev = evaluations[i];

                Color ratingColor;
                String ratingLabel;

                switch (ev.rating) {
                  case 'EXCELLENT':
                    ratingColor = Colors.green;
                    ratingLabel = 'ممتاز ومتميز';
                    break;
                  case 'VERY_GOOD':
                    ratingColor = Colors.teal;
                    ratingLabel = 'جيد جداً';
                    break;
                  case 'GOOD':
                    ratingColor = Colors.blue;
                    ratingLabel = 'جيد';
                    break;
                  case 'ACCEPTABLE':
                    ratingColor = Colors.amber.shade800;
                    ratingLabel = 'مقبول';
                    break;
                  default:
                    ratingColor = Colors.red;
                    ratingLabel = 'يحتاج إلى تحسين';
                }

                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  elevation: 2,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              ev.period ?? 'تقييم دوري',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: ratingColor.withAlpha(38),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(color: ratingColor.withAlpha(128)),
                              ),
                              child: Text(
                                ratingLabel,
                                style: TextStyle(color: ratingColor, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          'تاريخ التقييم: ${ev.evaluationDate}',
                          style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                        ),
                        const SizedBox(height: 12),
                        const Divider(),
                        const SizedBox(height: 8),

                        // Score breakdown
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            if (ev.behaviorScore != null)
                              _ScoreBadge(title: 'السلوك', score: ev.behaviorScore!),
                            if (ev.discipline != null)
                              _ScoreBadge(title: 'الانضباط', score: ev.discipline!),
                            if (ev.participation != null)
                              _ScoreBadge(title: 'المشاركة', score: ev.participation!),
                            if (ev.overallScore != null)
                              _ScoreBadge(title: 'الإجمالي', score: ev.overallScore!, isOverall: true),
                          ],
                        ),

                        if (ev.teacherNotes != null && ev.teacherNotes!.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('توجيهات وملاحظات المعلم:', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                                const SizedBox(height: 4),
                                Text(ev.teacherNotes!, style: TextStyle(color: Colors.grey.shade800, fontSize: 12)),
                              ],
                            ),
                          ),
                        ],

                        if (ev.actionLabel != null && ev.actionLabel!.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              const Icon(Icons.thumb_up_alt_outlined, size: 16, color: Colors.green),
                              const SizedBox(width: 6),
                              Text(
                                'التوصية: ${ev.actionLabel}',
                                style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold, fontSize: 12),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل تقييمات الابن...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل تقييمات الابن',
          onRetry: () => ref.refresh(childEvaluationsProvider(studentId)),
        ),
      ),
    );
  }
}

class _ScoreBadge extends StatelessWidget {
  final String title;
  final double score;
  final bool isOverall;

  const _ScoreBadge({
    required this.title,
    required this.score,
    this.isOverall = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          '${score.toStringAsFixed(0)}%',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: isOverall ? AppTheme.primary : Colors.grey.shade800,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: TextStyle(
            fontSize: 11,
            color: isOverall ? AppTheme.primary : Colors.grey.shade600,
            fontWeight: isOverall ? FontWeight.bold : FontWeight.normal,
          ),
        ),
      ],
    );
  }
}
