import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherExamGradingScreen extends ConsumerStatefulWidget {
  final String examId;
  final String examTitle;
  final double maxScore;
  final double passScore;

  const TeacherExamGradingScreen({
    super.key,
    required this.examId,
    required this.examTitle,
    this.maxScore = 100.0,
    this.passScore = 60.0,
  });

  @override
  ConsumerState<TeacherExamGradingScreen> createState() => _TeacherExamGradingScreenState();
}

class _TeacherExamGradingScreenState extends ConsumerState<TeacherExamGradingScreen> {
  @override
  Widget build(BuildContext context) {
    final resultsAsync = ref.watch(teacherExamResultsProvider(widget.examId));
    final studentsAsync = ref.watch(teacherStudentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('رصد درجات: ${widget.examTitle}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              ref.invalidate(teacherExamResultsProvider(widget.examId));
              ref.invalidate(teacherStudentsProvider);
            },
          ),
        ],
      ),
      body: resultsAsync.when(
        data: (results) {
          return studentsAsync.when(
            data: (allStudents) {
              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // Exam Overview Header
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('معايير الرصد', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                            const SizedBox(height: 4),
                            Text('الدرجة العظمى: ${widget.maxScore.toStringAsFixed(0)} • درجة النجاح: ${widget.passScore.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withAlpha(20),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'تم رصد: ${results.length} / ${allStudents.length}',
                            style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 12),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Students List for Grading
                  const Text('قائمة الطلاب للرصد والتقييم',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                  const SizedBox(height: 8),

                  ...allStudents.map((student) {
                    final existingResult = results.cast<TeacherExamResultItem?>().firstWhere(
                          (r) => r?.studentId == student.studentId,
                          orElse: () => null,
                        );

                    final hasGraded = existingResult != null;
                    final score = existingResult?.score ?? 0.0;
                    final isPassed = existingResult?.isPassed ?? (score >= widget.passScore);

                    return Card(
                      margin: const EdgeInsets.only(bottom: 10),
                      child: ListTile(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        leading: CircleAvatar(
                          backgroundColor: hasGraded
                              ? (isPassed ? AppTheme.statusPresent.withAlpha(20) : AppTheme.statusAbsent.withAlpha(20))
                              : Colors.grey.withAlpha(20),
                          child: Icon(
                            hasGraded ? (isPassed ? Icons.check_rounded : Icons.close_rounded) : Icons.edit_note_rounded,
                            color: hasGraded ? (isPassed ? AppTheme.statusPresent : AppTheme.statusAbsent) : Colors.grey,
                          ),
                        ),
                        title: Text(
                          student.displayName,
                          style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        subtitle: Text(
                          hasGraded
                              ? 'الدرجة: ${score.toStringAsFixed(1)} / ${widget.maxScore.toStringAsFixed(0)} (${isPassed ? "ناجح" : "راسب"})'
                              : 'لم ترصد الدرجة بعد',
                          style: TextStyle(
                            fontSize: 12,
                            color: hasGraded ? (isPassed ? AppTheme.statusPresent : AppTheme.statusAbsent) : AppTheme.textMuted,
                            fontWeight: hasGraded ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                        trailing: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: hasGraded ? Colors.grey.shade100 : AppTheme.primary,
                            foregroundColor: hasGraded ? AppTheme.primaryDark : Colors.white,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          ),
                          onPressed: () {
                            _showGradeDialog(context, student, existingResult);
                          },
                          child: Text(hasGraded ? 'تعديل' : 'رصد'),
                        ),
                      ),
                    );
                  }),
                ],
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل قائمة الطلاب...'),
            error: (err, _) => ErrorView(message: err.toString()),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل نتائج الاختبار...'),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.invalidate(teacherExamResultsProvider(widget.examId)),
        ),
      ),
    );
  }

  void _showGradeDialog(BuildContext context, WorkspaceStudent student, TeacherExamResultItem? currentResult) {
    final scoreController = TextEditingController(text: currentResult != null ? '${currentResult.score}' : '');
    final notesController = TextEditingController(text: currentResult?.notes ?? '');
    bool isPassed = currentResult?.isPassed ?? true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('رصد درجة: ${student.displayName}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: scoreController,
                keyboardType: const TextInputType.numberWithOptions(decimal: true),
                decoration: InputDecoration(
                  labelText: 'الدرجة المحرزة (من ${widget.maxScore.toStringAsFixed(0)})',
                  border: const OutlineInputBorder(),
                ),
                onChanged: (val) {
                  final score = double.tryParse(val) ?? 0.0;
                  setDialogState(() {
                    isPassed = score >= widget.passScore;
                  });
                },
              ),
              const SizedBox(height: 12),
              CheckboxListTile(
                title: const Text('اجتياز الاختبار (ناجح)'),
                value: isPassed,
                onChanged: (val) => setDialogState(() => isPassed = val ?? true),
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'ملاحظات المعلم وتقييم التلاوة',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
              onPressed: () async {
                final score = double.tryParse(scoreController.text.trim());
                if (score == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('يرجى إدخال درجة صحيحة')),
                  );
                  return;
                }

                try {
                  final ops = ref.read(teacherOperationsProvider);
                  await ops.gradeExam(
                    examId: widget.examId,
                    studentId: student.studentId,
                    score: score,
                    isPassed: isPassed,
                    notes: notesController.text.trim(),
                  );
                  if (context.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم رصد درجة الطالب بنجاح')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('تعذر رصد الدرجة: $e')),
                    );
                  }
                }
              },
              child: const Text('حفظ الدرجة'),
            ),
          ],
        ),
      ),
    );
  }
}
