import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../../student/models/student_models.dart';
import '../providers/parent_provider.dart';
import '../../../core/utils/file_export_util.dart';

class ParentChildExamsScreen extends ConsumerWidget {
  final String studentId;

  const ParentChildExamsScreen({super.key, required this.studentId});

  void _exportChildReportCard(BuildContext context, List<ExamResultModel> results) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
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
                  'كشف الدرجات والشهادات المعتمدة',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                IconButton(icon: const Icon(Icons.close), onPressed: () => Navigator.pop(ctx)),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'إجمالي الاختبارات المعتمدة: ${results.length} اختبار • نسبة النجاح: ${results.isNotEmpty ? ((results.where((r) => r.isPassed).length / results.length) * 100).toStringAsFixed(0) : 0}%',
              style: AppTypography.secondary,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.border, width: 0.8),
              ),
              child: const Text(
                'كشف درجات رسمي معتمد من إدارة الملتقى القرآني موجه لولي الأمر.',
                style: TextStyle(fontFamily: AppTypography.fontFamily, fontSize: 12, color: AppColors.primaryDark),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                icon: const Icon(Icons.print_outlined, color: Colors.white),
                label: const Text(
                  'طباعة / تحميل التقرير الشامل PDF',
                  style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    final res = await FileExportUtil.exportParentScorecardPdf(
                      childName: 'الابن',
                      results: results,
                    );
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('✓ تم حفظ كشف الدرجات: ${res.fileName} (${res.formattedSize})'),
                          backgroundColor: AppColors.statusPresent,
                          duration: const Duration(seconds: 4),
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(content: Text('تعذر تصدير الكشف: $e'), backgroundColor: Colors.red),
                      );
                    }
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final examsAsync = ref.watch(childExamsProvider(studentId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('اختبارات ونتائج الابن'),
        actions: [
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: 'تصدير كشف النتائج',
            onPressed: () {
              final data = examsAsync.valueOrNull;
              final results = data?['results'] as List<ExamResultModel>? ?? [];
              _exportChildReportCard(context, results);
            },
          ),
        ],
      ),
      body: examsAsync.when(
        data: (data) {
          final upcoming = data['upcomingExams'] as List<UpcomingExamModel>? ?? [];
          final results = data['results'] as List<ExamResultModel>? ?? [];

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(childExamsProvider(studentId).future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 1. Upcoming Exams Section
                if (upcoming.isNotEmpty) ...[
                  const SectionHeader(
                    title: 'الاختبارات المجدولة والقادمة',
                    icon: Icons.event_available_outlined,
                  ),
                  const SizedBox(height: 8),
                  ...upcoming.map((e) => ModernCard(
                        margin: const EdgeInsets.only(bottom: 10),
                        padding: const EdgeInsets.all(14),
                        child: Row(
                          children: [
                            Container(
                              width: 40,
                              height: 40,
                              decoration: BoxDecoration(
                                color: const Color(0xFFF3E8FF),
                                borderRadius: BorderRadius.circular(AppRadius.md),
                              ),
                              child: const Icon(Icons.event_note, color: Color(0xFF7C3AED), size: 20),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    e.title,
                                    style: AppTypography.bodyMedium,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    e.scheduledDate != null ? 'الموعد: ${e.scheduledDate}' : 'محدد قريباً',
                                    style: AppTypography.label,
                                  ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.primarySoft,
                                borderRadius: BorderRadius.circular(AppRadius.full),
                              ),
                              child: Text(
                                'الدرجة: ${e.maxScore.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                      )),
                  const SizedBox(height: 16),
                ],

                // 2. Published Results Section
                const SectionHeader(
                  title: 'النتائج المعتمدة للابن',
                  icon: Icons.assignment_turned_in_outlined,
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
                    final isPassed = r.isPassed;
                    return ModernCard(
                      margin: const EdgeInsets.only(bottom: 12),
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  r.examTitle,
                                  style: AppTypography.cardTitle,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: isPassed ? AppColors.statusPresentBg : AppColors.statusAbsentBg,
                                  borderRadius: BorderRadius.circular(AppRadius.full),
                                ),
                                child: Text(
                                  isPassed ? 'ناجح' : 'راسب',
                                  style: TextStyle(
                                    fontFamily: AppTypography.fontFamily,
                                    color: isPassed ? AppColors.statusPresent : AppColors.statusAbsent,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11.5,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Text(
                                'الدرجة: ${r.score.toStringAsFixed(1)} / ${r.maxScore.toStringAsFixed(0)}',
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 14,
                                  color: AppColors.primaryDark,
                                ),
                              ),
                              const Spacer(),
                              Text(
                                '${r.percentage.toStringAsFixed(1)}%',
                                style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                              ),
                            ],
                          ),
                          if (r.date != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'تاريخ الرصد: ${r.date}',
                              style: AppTypography.label,
                            ),
                          ],
                          if (r.notes != null && r.notes!.isNotEmpty) ...[
                            const SizedBox(height: 10),
                            Container(
                              width: double.infinity,
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceMuted,
                                borderRadius: BorderRadius.circular(AppRadius.sm),
                              ),
                              child: Text(
                                'ملاحظات المعلم: ${r.notes}',
                                style: AppTypography.secondary,
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  }),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل اختبارات الابن...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل الاختبارات والنتائج',
          onRetry: () => ref.refresh(childExamsProvider(studentId)),
        ),
      ),
    );
  }
}
