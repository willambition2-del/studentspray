import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../../core/utils/file_export_util.dart';
import '../../auth/providers/auth_provider.dart';
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
  String _selectedRosterFilter = 'all'; // 'all', 'graded', 'ungraded', 'passed', 'failed'

  void _exportGradeSheet(List<TeacherExamResultItem> results, List<WorkspaceStudent> allStudents) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'تصدير كشف نتائج الاختبار',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'الاختبار: ${widget.examTitle} • تم رصد ${results.length} من أصل ${allStudents.length} طالب',
              style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Text(
                'الناجحون: ${results.where((r) => r.isPassed).length} | الراسبون: ${results.where((r) => !r.isPassed).length} | المتوسط: ${results.isNotEmpty ? (results.fold<double>(0, (s, r) => s + r.score) / results.length).toStringAsFixed(1) : 0}',
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, color: AppTheme.primaryDark),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                icon: const Icon(Icons.print_outlined, color: Colors.white),
                label: const Text('طباعة / مشاركة كشف الدرجات المعتمد', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    final res = await FileExportUtil.exportGradeSheetCsv(
                      examTitle: widget.examTitle,
                      maxScore: widget.maxScore,
                      results: results,
                      students: allStudents,
                    );
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('✓ تم حفظ كشف الدرجات: ${res.fileName} (${res.formattedSize})'),
                        backgroundColor: AppTheme.statusPresent,
                        duration: const Duration(seconds: 4),
                      ),
                    );
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('تعذر تصدير الكشف: $e'), backgroundColor: Colors.red),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showStudentHistory(BuildContext context, WorkspaceStudent student) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) => Consumer(
        builder: (context, ref, _) {
          final historyAsync = ref.watch(studentFullHistoryProvider(student.studentId));

          return Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'سجل إنجاز وتقييم: ${student.displayName}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
                  ],
                ),
                const SizedBox(height: 12),
                historyAsync.when(
                  data: (history) {
                    final memorization = history['memorization'] as List<dynamic>? ?? [];
                    final revisions = history['revision'] as List<dynamic>? ?? [];
                    final evaluations = history['evaluations'] as List<dynamic>? ?? [];

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.grey.shade50,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  const Text('إحصائيات الإنجاز المسجلة', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                    decoration: BoxDecoration(color: AppTheme.statusPresent.withAlpha(20), borderRadius: BorderRadius.circular(4)),
                                    child: Text('${memorization.length} حفظ • ${revisions.length} مراجعة', style: const TextStyle(color: AppTheme.statusPresent, fontSize: 11, fontWeight: FontWeight.bold)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              Text(
                                evaluations.isNotEmpty
                                    ? 'آخر تقييم دوري: ${evaluations.first['rating'] ?? 'ممتاز'} (${evaluations.first['overallScore'] ?? 100}%)'
                                    : 'سجل الطالب منتظم ومؤهل للاختبارات الدورية',
                                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                              ),
                            ],
                          ),
                        ),
                      ],
                    );
                  },
                  loading: () => const Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: CircularProgressIndicator()),
                  ),
                  error: (err, _) => Text('تعذر تحميل السجل: $err', style: const TextStyle(color: Colors.red, fontSize: 11)),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('إغلاق السجل'),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final resultsAsync = ref.watch(teacherExamResultsProvider(widget.examId));
    final studentsAsync = ref.watch(teacherStudentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('رصد درجات: ${widget.examTitle}'),
        actions: [
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: 'تصدير الكشف',
            onPressed: () {
              final results = resultsAsync.valueOrNull ?? [];
              final students = studentsAsync.valueOrNull ?? [];
              _exportGradeSheet(results, students);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
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
              final gradedCount = results.length;
              final passedCount = results.where((r) => r.isPassed).length;
              final failedCount = results.where((r) => !r.isPassed).length;
              final avgScore = results.isNotEmpty ? (results.fold<double>(0, (s, r) => s + r.score) / results.length) : 0.0;

              // Distribution counts
              final c90 = results.where((r) => (r.score / widget.maxScore) >= 0.9).length;
              final c80 = results.where((r) => (r.score / widget.maxScore) >= 0.8 && (r.score / widget.maxScore) < 0.9).length;
              final c70 = results.where((r) => (r.score / widget.maxScore) >= 0.7 && (r.score / widget.maxScore) < 0.8).length;
              final c60 = results.where((r) => (r.score / widget.maxScore) >= 0.6 && (r.score / widget.maxScore) < 0.7).length;
              final cBelow60 = results.where((r) => (r.score / widget.maxScore) < 0.6).length;

              // Filtered list
              final filteredStudents = allStudents.where((student) {
                final existingResult = results.cast<TeacherExamResultItem?>().firstWhere(
                      (r) => r?.studentId == student.studentId,
                      orElse: () => null,
                    );
                if (_selectedRosterFilter == 'graded') return existingResult != null;
                if (_selectedRosterFilter == 'ungraded') return existingResult == null;
                if (_selectedRosterFilter == 'passed') return existingResult?.isPassed == true;
                if (_selectedRosterFilter == 'failed') return existingResult != null && !existingResult.isPassed;
                return true;
              }).toList();

              return ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  // 1. Exam Overview & Metrics Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('معايير الرصد والنتائج', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                                const SizedBox(height: 4),
                                Text(
                                  'العظمى: ${widget.maxScore.toStringAsFixed(0)} • النجاح: ${widget.passScore.toStringAsFixed(0)} • المتوسط: ${avgScore.toStringAsFixed(1)}',
                                  style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                                ),
                              ],
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                              decoration: BoxDecoration(
                                color: AppTheme.primary.withAlpha(20),
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                'المرصود: $gradedCount / ${allStudents.length}',
                                style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary, fontSize: 12),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Row(
                          children: [
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(color: AppTheme.statusPresent.withAlpha(15), borderRadius: BorderRadius.circular(6)),
                                alignment: Alignment.center,
                                child: Text('ناجح: $passedCount', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.statusPresent, fontSize: 12)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(color: AppTheme.statusAbsent.withAlpha(15), borderRadius: BorderRadius.circular(6)),
                                alignment: Alignment.center,
                                child: Text('راسب: $failedCount', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.statusAbsent, fontSize: 12)),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(vertical: 6),
                                decoration: BoxDecoration(color: Colors.grey.shade100, borderRadius: BorderRadius.circular(6)),
                                alignment: Alignment.center,
                                child: Text('بانتظار: ${allStudents.length - gradedCount}', style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.textSecondary, fontSize: 12)),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 14),

                  // 2. Grade Distribution Widget
                  if (results.isNotEmpty) ...[
                    Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('توزيع الدرجات والمستويات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              _buildDistBar('90+', c90, results.length, const Color(0xFF059669)),
                              _buildDistBar('80-89', c80, results.length, const Color(0xFF10B981)),
                              _buildDistBar('70-79', c70, results.length, const Color(0xFFF59E0B)),
                              _buildDistBar('60-69', c60, results.length, const Color(0xFFEA580C)),
                              _buildDistBar('<60', cBelow60, results.length, const Color(0xFFDC2626)),
                            ],
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 14),
                  ],

                  // 3. Status Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        _buildFilterChip('الكل (${allStudents.length})', 'all'),
                        _buildFilterChip('تم الرصد ($gradedCount)', 'graded'),
                        _buildFilterChip('غير مرصود (${allStudents.length - gradedCount})', 'ungraded'),
                        _buildFilterChip('الناجحون ($passedCount)', 'passed'),
                        _buildFilterChip('الراسبون ($failedCount)', 'failed'),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 4. Students Roster for Grading
                  if (filteredStudents.isEmpty)
                    const Padding(
                      padding: EdgeInsets.all(24),
                      child: Center(child: Text('لا يوجد طلاب مطابقين للتصفية المحددة')),
                    )
                  else
                    ...filteredStudents.map((student) {
                      final existingResult = results.cast<TeacherExamResultItem?>().firstWhere(
                            (r) => r?.studentId == student.studentId,
                            orElse: () => null,
                          );

                      final hasGraded = existingResult != null;
                      final score = existingResult?.score ?? 0.0;
                      final isPassed = existingResult?.isPassed ?? (score >= widget.passScore);

                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          leading: CircleAvatar(
                            backgroundColor: hasGraded
                                ? (isPassed ? AppTheme.statusPresent.withAlpha(20) : AppTheme.statusAbsent.withAlpha(20))
                                : Colors.grey.withAlpha(20),
                            child: Icon(
                              hasGraded ? (isPassed ? Icons.check : Icons.close) : Icons.edit_note,
                              color: hasGraded ? (isPassed ? AppTheme.statusPresent : AppTheme.statusAbsent) : Colors.grey,
                            ),
                          ),
                          title: Text(
                            student.displayName,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                          ),
                          subtitle: Text(
                            hasGraded
                                ? 'الدرجة: ${score.toStringAsFixed(1)} / ${widget.maxScore.toStringAsFixed(0)} (${isPassed ? "ناجح" : "راسب"})'
                                : 'لم ترصد الدرجة بعد',
                            style: TextStyle(
                              fontSize: 11.5,
                              color: hasGraded ? (isPassed ? AppTheme.statusPresent : AppTheme.statusAbsent) : AppTheme.textMuted,
                              fontWeight: hasGraded ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          trailing: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.history, size: 20, color: AppTheme.textSecondary),
                                tooltip: 'سجل اختبارات الطالب',
                                onPressed: () => _showStudentHistory(context, student),
                              ),
                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: hasGraded ? Colors.grey.shade100 : AppTheme.primary,
                                  foregroundColor: hasGraded ? AppTheme.primaryDark : Colors.white,
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                ),
                                onPressed: () {
                                  _showGradeDialog(context, student, existingResult);
                                },
                                child: Text(hasGraded ? 'تعديل' : 'رصد', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                              ),
                            ],
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

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _selectedRosterFilter == value;
    return Padding(
      padding: const EdgeInsets.only(left: 6),
      child: ChoiceChip(
        label: Text(label),
        selected: isSelected,
        labelStyle: TextStyle(
          fontSize: 11,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
          color: isSelected ? Colors.white : AppTheme.textSecondary,
        ),
        selectedColor: AppTheme.primary,
        backgroundColor: Colors.white,
        onSelected: (_) => setState(() => _selectedRosterFilter = value),
      ),
    );
  }

  Widget _buildDistBar(String label, int count, int total, Color color) {
    final pct = total > 0 ? (count / total) : 0.0;
    return Expanded(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 2),
        child: Column(
          children: [
            Text('$count', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11, color: color)),
            const SizedBox(height: 4),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: pct,
                backgroundColor: color.withAlpha(30),
                valueColor: AlwaysStoppedAnimation<Color>(color),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 4),
            Text(label, style: const TextStyle(fontSize: 9.5, color: AppTheme.textSecondary)),
          ],
        ),
      ),
    );
  }

  void _showGradeDialog(BuildContext context, WorkspaceStudent student, TeacherExamResultItem? currentResult) {
    final scoreController = TextEditingController(text: currentResult != null ? '${currentResult.score}' : '');
    final notesController = TextEditingController(text: currentResult?.notes ?? '');
    final auditReasonController = TextEditingController();
    bool isPassed = currentResult?.isPassed ?? true;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(currentResult != null ? 'تعديل درجة: ${student.displayName}' : 'رصد درجة: ${student.displayName}'),
          content: SingleChildScrollView(
            child: Column(
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
                const SizedBox(height: 10),
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
                if (currentResult != null) ...[
                  const SizedBox(height: 10),
                  TextField(
                    controller: auditReasonController,
                    decoration: const InputDecoration(
                      labelText: 'سبب تعديل الدرجة (تدقيق أكاديمي)',
                      border: OutlineInputBorder(),
                      hintText: 'إعادة تصحيح، خطأ رصد، مراجعة مع المشرف...',
                    ),
                    maxLines: 1,
                  ),
                ],
              ],
            ),
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

                if (currentResult != null && auditReasonController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('يرجى كتابة سبب تعديل الدرجة للتدقيق الأكاديمي')),
                  );
                  return;
                }

                try {
                  if (currentResult != null) {
                    final apiClient = ref.read(apiClientProvider);
                    await apiClient.patch(
                      '/exams/${widget.examId}/results/${currentResult.id}',
                      data: {
                        'score': score,
                        'isPassed': isPassed,
                        'notes': notesController.text.trim(),
                        'correctionReason': auditReasonController.text.trim(),
                      },
                    );
                    ref.invalidate(teacherExamResultsProvider(widget.examId));
                  } else {
                    final ops = ref.read(teacherOperationsProvider);
                    await ops.gradeExam(
                      examId: widget.examId,
                      studentId: student.studentId,
                      score: score,
                      isPassed: isPassed,
                      notes: notesController.text.trim(),
                    );
                  }
                  if (context.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('✓ تم حفظ واعتماد درجة الطالب وتوثيق التدقيق بنجاح')),
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
              child: const Text('حفظ واعتماد'),
            ),
          ],
        ),
      ),
    );
  }
}
