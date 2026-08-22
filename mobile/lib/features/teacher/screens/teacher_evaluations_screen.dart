import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/utils/file_export_util.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class TeacherEvaluationsScreen extends ConsumerWidget {
  const TeacherEvaluationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final evaluationsAsync = ref.watch(teacherEvaluationsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('التقييم التربوي والسلوكي'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () => ref.invalidate(teacherEvaluationsProvider),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
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
                return ModernCard(
                  margin: const EdgeInsets.only(bottom: 12),
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
                              fontFamily: AppTypography.fontFamily,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primarySoft,
                                  borderRadius: BorderRadius.circular(AppRadius.full),
                                ),
                                child: Text(
                                  '${ev.overallScore.toStringAsFixed(0)} / 100 (${ev.ratingLabel})',
                                  style: const TextStyle(
                                    fontFamily: AppTypography.fontFamily,
                                    fontWeight: FontWeight.bold,
                                    color: AppColors.primaryDark,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 4),
                              IconButton(
                                icon: const Icon(Icons.picture_as_pdf, color: Colors.red, size: 20),
                                tooltip: 'تصدير تقرير تقييم الطالب PDF',
                                onPressed: () async {
                                  final res = await FileExportUtil.exportTeacherEvaluationPdf(ev);
                                  if (context.mounted) {
                                    ScaffoldMessenger.of(context).showSnackBar(
                                      SnackBar(
                                        content: Text('✓ تم تصدير تقرير التقييم PDF بنجاح (${res.formattedSize})'),
                                        backgroundColor: AppColors.statusPresent,
                                      ),
                                    );
                                  }
                                },
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        'التاريخ: ${ev.evaluationDate.toIso8601String().substring(0, 10)}',
                        style: AppTypography.label,
                      ),
                      const SizedBox(height: 10),
                      Wrap(
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          _buildScoreBadge('السلوك: ${ev.behaviorScore.toStringAsFixed(0)}'),
                          _buildScoreBadge('الانضباط: ${ev.discipline.toStringAsFixed(0)}'),
                          _buildScoreBadge('المشاركة: ${ev.participation.toStringAsFixed(0)}'),
                        ],
                      ),
                      if (ev.teacherNotes != null && ev.teacherNotes!.isNotEmpty) ...[
                        const SizedBox(height: 12),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: Text(
                            'ملاحظات المعلم: ${ev.teacherNotes}',
                            style: AppTypography.secondary,
                          ),
                        ),
                      ],
                    ],
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
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _showAddEvaluationDialog(context, ref),
        icon: const Icon(Icons.add, size: 20),
        label: const Text(
          'تقييم طالب جديد',
          style: TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
    );
  }

  Widget _buildScoreBadge(String label) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        label,
        style: const TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
        ),
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
      backgroundColor: AppColors.surface,
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
                    style: TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: selectedStudentId,
                decoration: const InputDecoration(
                  labelText: 'اختر الطالب',
                ),
                items: allStudents
                    .map((s) => DropdownMenuItem(
                          value: s.studentId,
                          child: Text(s.displayName),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) {
                    setModalState(() => selectedStudentId = val);
                  }
                },
              ),
              const SizedBox(height: 16),
              Text(
                'السلوك والأخلاق: ${behavior.toStringAsFixed(0)} / 100',
                style: AppTypography.secondaryMedium,
              ),
              Slider(
                value: behavior,
                min: 0,
                max: 100,
                divisions: 20,
                activeColor: AppColors.primary,
                onChanged: (val) => setModalState(() => behavior = val),
              ),
              Text(
                'الانضباط والمواظبة: ${discipline.toStringAsFixed(0)} / 100',
                style: AppTypography.secondaryMedium,
              ),
              Slider(
                value: discipline,
                min: 0,
                max: 100,
                divisions: 20,
                activeColor: AppColors.primary,
                onChanged: (val) => setModalState(() => discipline = val),
              ),
              Text(
                'المشاركة والتفاعل: ${participation.toStringAsFixed(0)} / 100',
                style: AppTypography.secondaryMedium,
              ),
              Slider(
                value: participation,
                min: 0,
                max: 100,
                divisions: 20,
                activeColor: AppColors.primary,
                onChanged: (val) => setModalState(() => participation = val),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: notesController,
                maxLines: 2,
                decoration: const InputDecoration(
                  hintText: 'ملاحظات إضافية على التقييم...',
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    final now = DateTime.now().toIso8601String().split('T')[0];
                    final overall = (behavior + discipline + participation) / 3;
                    String rating = 'EXCELLENT';
                    if (overall < 60) {
                      rating = 'NEEDS_REVIEW';
                    } else if (overall < 70) {
                      rating = 'ACCEPTABLE';
                    } else if (overall < 80) {
                      rating = 'GOOD';
                    } else if (overall < 90) {
                      rating = 'VERY_GOOD';
                    }

                    await ref.read(teacherOperationsProvider).submitStudentEvaluation(
                          studentId: selectedStudentId,
                          halaqaId: 'halaqa-auto',
                          evaluationDate: now,
                          behaviorScore: behavior,
                          discipline: discipline,
                          participation: participation,
                          overallScore: overall,
                          rating: rating,
                          teacherNotes: notesController.text.isNotEmpty ? notesController.text : null,
                        );
                    ref.invalidate(teacherEvaluationsProvider);
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('✓ تم حفظ التقييم بنجاح'),
                          backgroundColor: AppColors.statusPresent,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('فشل حفظ التقييم: $e'),
                          backgroundColor: AppColors.statusAbsent,
                        ),
                      );
                    }
                  }
                },
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 46),
                ),
                child: const Text('حفظ التقييم'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
