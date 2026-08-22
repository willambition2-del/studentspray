import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../models/student_models.dart';
import '../providers/student_provider.dart';
import '../../../core/utils/file_export_util.dart';

class StudentExamsScreen extends ConsumerWidget {
  const StudentExamsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final examsAsync = ref.watch(studentExamsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الاختبارات والنتائج'),
      ),
      body: examsAsync.when(
        data: (data) {
          final upcoming = data['upcomingExams'] as List<UpcomingExamModel>? ?? [];
          final results = data['results'] as List<ExamResultModel>? ?? [];

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(studentExamsProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // 1. Upcoming Exams Section
                if (upcoming.isNotEmpty) ...[
                  const SectionHeader(
                    title: 'الاختبارات القادمة والمجدولة',
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
                  title: 'النتائج المعتمدة',
                  icon: Icons.assignment_turned_in_outlined,
                ),
                const SizedBox(height: 8),

                if (results.isEmpty)
                  const EmptyStateView(
                    title: 'لا توجد نتائج معتمدة منشورة بعد',
                    subtitle: 'ستظهر هنا نتائج اختباراتك فور اعتمادها من قبل معلم الحلقة وإدارة المجمع',
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
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontSize: 11,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ),
                          ],
                          if (isPassed) ...[
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton.icon(
                                style: OutlinedButton.styleFrom(
                                  side: const BorderSide(color: AppColors.primary, width: 0.8),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                                  padding: const EdgeInsets.symmetric(vertical: 8),
                                ),
                                icon: const Icon(Icons.workspace_premium_outlined, size: 16, color: AppColors.primary),
                                label: const Text(
                                  'استعراض شهادة الاختبار المعتمدة',
                                  style: TextStyle(fontFamily: AppTypography.fontFamily, fontSize: 11.5, fontWeight: FontWeight.bold, color: AppColors.primary),
                                ),
                                onPressed: () {
                                  showDialog(
                                    context: context,
                                    builder: (ctx) => AlertDialog(
                                      title: const Row(
                                        children: [
                                          Icon(Icons.workspace_premium, color: Color(0xFFD97706)),
                                          SizedBox(width: 8),
                                          Text('شهادة إتمام واجتياز اختبار', style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                                        ],
                                      ),
                                      content: Column(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.all(16),
                                            decoration: BoxDecoration(
                                              color: const Color(0xFFFFFBEB),
                                              borderRadius: BorderRadius.circular(12),
                                              border: Border.all(color: const Color(0xFFFDE68A)),
                                            ),
                                            child: Column(
                                              children: [
                                                const Text(
                                                  '✨ تشهد إدارة الملتقى القرآني باجتياز الطالب الاختبار بنجاح وتميز ✨',
                                                  textAlign: TextAlign.center,
                                                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Color(0xFF92400E)),
                                                ),
                                                const SizedBox(height: 10),
                                                Text('الاختبار: ${r.examTitle}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                                                Text('الدرجة المحرزة: ${r.score.toStringAsFixed(1)} / ${r.maxScore.toStringAsFixed(0)} (${r.percentage.toStringAsFixed(1)}%)',
                                                    style: const TextStyle(fontSize: 12, color: AppColors.primary)),
                                              ],
                                            ),
                                          ),
                                        ],
                                      ),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إغلاق')),
                                          ElevatedButton.icon(
                                            style: ElevatedButton.styleFrom(backgroundColor: AppColors.primary, foregroundColor: Colors.white),
                                            icon: const Icon(Icons.download, size: 16),
                                            label: const Text('حفظ الشهادة'),
                                            onPressed: () async {
                                              Navigator.pop(ctx);
                                              try {
                                                final res = await FileExportUtil.exportStudentCertificatePdf(
                                                  studentName: 'الطالب',
                                                  examTitle: r.examTitle,
                                                  score: r.score,
                                                  maxScore: r.maxScore,
                                                  percentage: r.percentage,
                                                );
                                                if (context.mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('✓ تم حفظ شهادة الاختبار: ${res.fileName} (${res.formattedSize})'),
                                                      backgroundColor: AppColors.statusPresent,
                                                      duration: const Duration(seconds: 4),
                                                    ),
                                                  );
                                                }
                                              } catch (e) {
                                                if (context.mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(content: Text('تعذر تصدير الشهادة: $e'), backgroundColor: Colors.red),
                                                  );
                                                }
                                              }
                                            },
                                          ),
                                      ],
                                    ),
                                  );
                                },
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
        loading: () => const LoadingView(message: 'جاري تحميل الاختبارات والنتائج...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل الاختبارات والنتائج',
          onRetry: () => ref.refresh(studentExamsProvider),
        ),
      ),
    );
  }
}
