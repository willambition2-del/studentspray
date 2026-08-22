import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/utils/quran_data.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class HalaqaDetailScreen extends ConsumerWidget {
  final String halaqaId;

  const HalaqaDetailScreen({super.key, required this.halaqaId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final workspaceAsync = ref.watch(halaqaWorkspaceProvider(halaqaId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('مساحة عمل الحلقة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () => ref.invalidate(halaqaWorkspaceProvider(halaqaId)),
          ),
        ],
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async => ref.invalidate(halaqaWorkspaceProvider(halaqaId)),
        child: workspaceAsync.when(
          data: (workspace) {
            final halaqa = workspace.halaqa;
            final plan = workspace.activePlan;
            final students = workspace.students;

            return ListView(
              padding: const EdgeInsets.symmetric(vertical: 12),
              children: [
                // Halaqa Overview Card
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: ModernCard(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Expanded(
                              child: Text(
                                halaqa.name,
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 10,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.accentGoldSoft,
                                borderRadius: BorderRadius.circular(AppRadius.full),
                              ),
                              child: Text(
                                'رمز: ${halaqa.code}',
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  color: AppColors.accentGoldDark,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11.5,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${halaqa.branchName} • جلسة: ${workspace.todayDate}',
                          style: AppTypography.secondary,
                        ),
                        const SizedBox(height: 14),
                        // Attendance CTA
                        ElevatedButton.icon(
                          onPressed: () {
                            context.push('/teacher/halaqas/$halaqaId/attendance');
                          },
                          icon: const Icon(Icons.fact_check_outlined, size: 18),
                          label: const Text('تسجيل حضور جلسة اليوم'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            minimumSize: const Size(double.infinity, 44),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Active Educational Plan Card
                if (plan != null)
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    child: ModernCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'الخطة التعليمية: ${plan["name"] ?? ""}',
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 15,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppColors.primarySoft,
                                  borderRadius: BorderRadius.circular(AppRadius.full),
                                ),
                                child: Text(
                                  plan["type"]?.toString() ?? 'خطة تفصيلية',
                                  style: const TextStyle(
                                    fontFamily: AppTypography.fontFamily,
                                    color: AppColors.primaryDark,
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (plan['items'] is List && (plan['items'] as List).isNotEmpty) ...[
                            const SizedBox(height: 10),
                            const Divider(height: 1),
                            const SizedBox(height: 10),
                            ...(plan['items'] as List).take(3).map((rawItem) {
                              final item = rawItem is Map ? rawItem : {};
                              final surahNum = item['surahNumber'] as int?;
                              final surahName = QuranData.getSurahName(surahNum);
                              final isCompleted = item['status'] == 'COMPLETED';

                              return Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  children: [
                                    Icon(
                                      isCompleted
                                          ? Icons.check_circle
                                          : Icons.radio_button_unchecked,
                                      size: 16,
                                      color: isCompleted
                                          ? AppColors.statusPresent
                                          : AppColors.textMuted,
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        surahNum != null
                                            ? 'سورة $surahName (من ${item["fromAyah"] ?? 1} إلى ${item["toAyah"] ?? 10})'
                                            : 'مقرر جزء ${item["juzNumber"] ?? 1}',
                                        style: AppTypography.body.copyWith(fontSize: 13),
                                      ),
                                    ),
                                    Text(
                                      isCompleted ? 'مكتمل' : 'قيد المتابعة',
                                      style: TextStyle(
                                        fontFamily: AppTypography.fontFamily,
                                        fontSize: 11,
                                        color: isCompleted
                                            ? AppColors.statusPresent
                                            : AppColors.textSecondary,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 16),

                // Students In Halaqa
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: SectionHeader(
                    title: 'طلاب الحلقة (${students.length})',
                    icon: Icons.people_outline,
                  ),
                ),
                const SizedBox(height: 4),

                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    children: students.map((student) {
                      return _buildStudentRow(context, student);
                    }).toList(),
                  ),
                ),
              ],
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل مساحة الحلقة...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(halaqaWorkspaceProvider(halaqaId)),
          ),
        ),
      ),
    );
  }

  Widget _buildStudentRow(BuildContext context, WorkspaceStudent student) {
    Color statusColor;
    Color statusBg;
    String statusText;

    switch (student.todayAttendanceStatus) {
      case 'PRESENT':
        statusColor = AppColors.statusPresent;
        statusBg = AppColors.statusPresentBg;
        statusText = 'حاضر';
        break;
      case 'ABSENT':
        statusColor = AppColors.statusAbsent;
        statusBg = AppColors.statusAbsentBg;
        statusText = 'غائب';
        break;
      case 'LATE':
        statusColor = AppColors.statusLate;
        statusBg = AppColors.statusLateBg;
        statusText = 'متأخر';
        break;
      case 'EXCUSED':
        statusColor = AppColors.statusExcused;
        statusBg = AppColors.statusExcusedBg;
        statusText = 'معذور';
        break;
      default:
        statusColor = AppColors.textSecondary;
        statusBg = AppColors.surfaceMuted;
        statusText = 'لم يرصد';
    }

    final initial = student.displayName.isNotEmpty ? student.displayName[0] : 'ط';

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(AppRadius.md),
                ),
                alignment: Alignment.center,
                child: Text(
                  initial,
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: AppColors.primaryDark,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student.displayName,
                      style: AppTypography.bodyMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      student.studentNumber ?? 'STU-2026',
                      style: AppTypography.label,
                    ),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: statusColor,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          const Divider(height: 1),
          const SizedBox(height: 8),
          // Recitation action buttons
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.push(
                      '/teacher/halaqas/$halaqaId/memorization?studentId=${student.studentId}&name=${Uri.encodeComponent(student.displayName)}',
                    );
                  },
                  icon: const Icon(Icons.menu_book_outlined, size: 14),
                  label: const Text('تسميع حفظ', style: TextStyle(fontSize: 11.5)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                    minimumSize: const Size(0, 34),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () {
                    context.push(
                      '/teacher/halaqas/$halaqaId/revision?studentId=${student.studentId}&name=${Uri.encodeComponent(student.displayName)}',
                    );
                  },
                  icon: const Icon(Icons.refresh, size: 14),
                  label: const Text('مراجعة وتثبيت', style: TextStyle(fontSize: 11.5)),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
                    minimumSize: const Size(0, 34),
                  ),
                ),
              ),
              const SizedBox(width: 6),
              InkWell(
                onTap: () {
                  context.push(
                    '/teacher/students/${student.studentId}/progress?name=${Uri.encodeComponent(student.displayName)}',
                  );
                },
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Container(
                  padding: const EdgeInsets.all(7),
                  decoration: BoxDecoration(
                    color: AppColors.primarySoft,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: const Icon(Icons.analytics_outlined, size: 16, color: AppColors.primaryDark),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
