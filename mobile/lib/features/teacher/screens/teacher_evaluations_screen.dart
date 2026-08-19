import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class TeacherEvaluationsScreen extends ConsumerWidget {
  const TeacherEvaluationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final evaluationsAsync = ref.watch(teacherEvaluationsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('التقييم التربوي والسلوكي'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(teacherEvaluationsProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(teacherEvaluationsProvider),
        child: evaluationsAsync.when(
          data: (evaluations) {
            if (evaluations.isEmpty) {
              return const EmptyStateView(
                title: 'لا توجد تقييمات مسجلة حاليًا',
                subtitle: 'استخدم زر الإضافة بالأسفل لتقييم طلاب الحلقة',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: evaluations.length,
              itemBuilder: (context, index) {
                final ev = evaluations[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              ev.studentName,
                              style: const TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryDark,
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.accentGold.withAlpha(30),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                '${ev.overallScore.toStringAsFixed(0)} / 100 (${ev.ratingLabel})',
                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryDark,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'التاريخ: ${ev.evaluationDate.toIso8601String().substring(0, 10)}',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          children: [
                            _buildScoreBadge('السلوك: ${ev.behaviorScore.toStringAsFixed(0)}'),
                            const SizedBox(width: 8),
                            _buildScoreBadge('الانضباط: ${ev.discipline.toStringAsFixed(0)}'),
                            const SizedBox(width: 8),
                            _buildScoreBadge('المشاركة: ${ev.participation.toStringAsFixed(0)}'),
                          ],
                        ),
                        if (ev.teacherNotes != null && ev.teacherNotes!.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Container(
                            width: double.infinity,
                            padding: const EdgeInsets.all(10),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Text(
                              'ملاحظات وتوجيهات المعلم: ${ev.teacherNotes}',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل التقييمات التربوية...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(teacherEvaluationsProvider),
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        onPressed: () => _showAddEvaluationDialog(context, ref),
        icon: const Icon(Icons.add_rounded),
        label: const Text('تقييم طالب جديد'),
      ),
    );
  }

  Widget _buildScoreBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
      ),
    );
  }

  void _showAddEvaluationDialog(BuildContext context, WidgetRef ref) {
    final studentsAsync = ref.read(teacherStudentsProvider);
    final allStudents = studentsAsync.valueOrNull ?? [];

    if (allStudents.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('لا توجد بيانات طلاب متاحة حالياً')),
      );
      return;
    }

    String selectedStudentId = allStudents.first.studentId;
    double behavior = 90;
    double discipline = 90;
    double participation = 90;
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'إضافة تقييم تربوي وسلوكي',
                    style: TextStyle(fontSize: 17, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedStudentId,
                decoration: const InputDecoration(
                  labelText: 'اختر الطالب',
                  border: OutlineInputBorder(),
                ),
                items: allStudents
                    .map((s) => DropdownMenuItem(
                          value: s.studentId,
                          child: Text(s.displayName),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setModalState(() => selectedStudentId = val);
                },
              ),
              const SizedBox(height: 12),
              Text('السلوك والآداب (${behavior.toInt()})'),
              Slider(
                value: behavior,
                min: 50,
                max: 100,
                divisions: 10,
                label: '${behavior.toInt()}',
                onChanged: (val) => setModalState(() => behavior = val),
              ),
              Text('الانضباط والالتزام (${discipline.toInt()})'),
              Slider(
                value: discipline,
                min: 50,
                max: 100,
                divisions: 10,
                label: '${discipline.toInt()}',
                onChanged: (val) => setModalState(() => discipline = val),
              ),
              Text('المشاركة والتفاعل (${participation.toInt()})'),
              Slider(
                value: participation,
                min: 50,
                max: 100,
                divisions: 10,
                label: '${participation.toInt()}',
                onChanged: (val) => setModalState(() => participation = val),
              ),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'توجيهات وملاحظات المعلم',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  onPressed: () async {
                    final overall = (behavior + discipline + participation) / 3;
                    String rating = 'VERY_GOOD';
                    if (overall >= 90) {
                      rating = 'EXCELLENT';
                    } else if (overall >= 80) {
                      rating = 'VERY_GOOD';
                    } else if (overall >= 70) {
                      rating = 'GOOD';
                    } else {
                      rating = 'ACCEPTABLE';
                    }

                    try {
                      final ops = ref.read(teacherOperationsProvider);
                      await ops.submitStudentEvaluation(
                        studentId: selectedStudentId,
                        halaqaId: 'halaqa-auto',
                        evaluationDate: DateTime.now().toIso8601String().substring(0, 10),
                        behaviorScore: behavior,
                        discipline: discipline,
                        participation: participation,
                        overallScore: overall,
                        rating: rating,
                        teacherNotes: notesController.text.trim(),
                      );
                      if (context.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('تم إضافة التقييم التربوي بنجاح')),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('تعذر حفظ التقييم: $e')),
                        );
                      }
                    }
                  },
                  child: const Text('حفظ التقييم'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
