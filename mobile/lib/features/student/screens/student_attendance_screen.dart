import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentAttendanceScreen extends ConsumerWidget {
  const StudentAttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceAsync = ref.watch(studentAttendanceProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سجل الحضور والغياب'),
      ),
      body: attendanceAsync.when(
        data: (data) {
          final summary = data['summary'] as Map<String, dynamic>? ?? {};
          final history = data['history'] as List? ?? [];
          final rate = (summary['attendanceRate'] as num?)?.toDouble() ?? 100.0;
          final total = (summary['totalSessions'] as num?)?.toInt() ?? 0;
          final present = (summary['presentCount'] as num?)?.toInt() ?? 0;
          final absent = (summary['absentCount'] as num?)?.toInt() ?? 0;
          final late = (summary['lateCount'] as num?)?.toInt() ?? 0;
          final excused = (summary['excusedCount'] as num?)?.toInt() ?? 0;

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(studentAttendanceProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Attendance Summary Card
                ModernCard(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Text(
                            'نسبة الالتزام بالحضور',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontWeight: FontWeight.bold,
                              fontSize: 15,
                              color: AppColors.textPrimary,
                            ),
                          ),
                          Text(
                            '${rate.toStringAsFixed(1)}%',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              color: rate >= 90
                                  ? AppColors.statusPresent
                                  : (rate >= 75 ? AppColors.statusLate : AppColors.statusAbsent),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceAround,
                        children: [
                          _StatCol(title: 'الجلسات', value: '$total', color: AppColors.textPrimary),
                          _StatCol(title: 'حاضر', value: '$present', color: AppColors.statusPresent),
                          _StatCol(title: 'غائب', value: '$absent', color: AppColors.statusAbsent),
                          _StatCol(title: 'متأخر', value: '$late', color: AppColors.statusLate),
                          _StatCol(title: 'مستأذن', value: '$excused', color: AppColors.statusExcused),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const SectionHeader(
                  title: 'سجل الجلسات السابقة',
                  icon: Icons.history,
                ),
                const SizedBox(height: 8),

                if (history.isEmpty)
                  const EmptyStateView(title: 'لا توجد جلسات مسجلة بعد', icon: Icons.event_busy_outlined)
                else
                  ...history.map((record) {
                    final status = record['status'] as String? ?? 'PRESENT';
                    final date = record['date'] as String? ?? '';
                    final notes = record['notes'] as String?;

                    Color statusColor;
                    Color statusBg;
                    String statusText;
                    IconData statusIcon;

                    switch (status) {
                      case 'PRESENT':
                        statusColor = AppColors.statusPresent;
                        statusBg = AppColors.statusPresentBg;
                        statusText = 'حاضر';
                        statusIcon = Icons.check_circle;
                        break;
                      case 'ABSENT':
                        statusColor = AppColors.statusAbsent;
                        statusBg = AppColors.statusAbsentBg;
                        statusText = 'غائب';
                        statusIcon = Icons.cancel;
                        break;
                      case 'LATE':
                        statusColor = AppColors.statusLate;
                        statusBg = AppColors.statusLateBg;
                        statusText = 'متأخر';
                        statusIcon = Icons.access_time;
                        break;
                      case 'EXCUSED':
                        statusColor = AppColors.statusExcused;
                        statusBg = AppColors.statusExcusedBg;
                        statusText = 'بعذر';
                        statusIcon = Icons.info_outline;
                        break;
                      default:
                        statusColor = AppColors.textSecondary;
                        statusBg = AppColors.surfaceMuted;
                        statusText = status;
                        statusIcon = Icons.help_outline;
                    }

                    return ModernCard(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          Icon(statusIcon, color: statusColor, size: 20),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'جلسة تاريخ: $date',
                                  style: AppTypography.bodyMedium,
                                ),
                                if (notes != null && notes.isNotEmpty) ...[
                                  const SizedBox(height: 2),
                                  Text('ملاحظة: $notes', style: AppTypography.label),
                                ],
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
                                fontWeight: FontWeight.bold,
                                fontSize: 11.5,
                              ),
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل سجل الحضور...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل سجل الحضور',
          onRetry: () => ref.refresh(studentAttendanceProvider),
        ),
      ),
    );
  }
}

class _StatCol extends StatelessWidget {
  final String title;
  final String value;
  final Color color;

  const _StatCol({required this.title, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: color,
          ),
        ),
        const SizedBox(height: 2),
        Text(
          title,
          style: AppTypography.label,
        ),
      ],
    );
  }
}
