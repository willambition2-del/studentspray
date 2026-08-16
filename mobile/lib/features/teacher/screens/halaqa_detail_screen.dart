import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/quran_data.dart';
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
      appBar: AppBar(
        title: const Text('مساحة عمل الحلقة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => ref.invalidate(halaqaWorkspaceProvider(halaqaId)),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(halaqaWorkspaceProvider(halaqaId)),
        child: workspaceAsync.when(
          data: (workspace) {
            final halaqa = workspace.halaqa;
            final plan = workspace.activePlan;
            final students = workspace.students;

            return ListView(
              padding: const EdgeInsets.symmetric(vertical: 16),
              children: [
                // Halaqa Overview Card
                Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: AppTheme.dividerColor),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withAlpha(8),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
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
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.primaryDark,
                              ),
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 4,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.accentGold.withAlpha(30),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'رمز: ${halaqa.code}',
                              style: const TextStyle(
                                color: AppTheme.primaryDark,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '${halaqa.branchName} • جلسة: ${workspace.todayDate}',
                        style: const TextStyle(color: AppTheme.textSecondary, fontSize: 14),
                      ),
                      const SizedBox(height: 16),
                      // Attendance CTA
                      ElevatedButton.icon(
                        onPressed: () {
                          context.push('/teacher/halaqas/$halaqaId/attendance');
                        },
                        icon: const Icon(Icons.how_to_reg_rounded),
                        label: const Text('تسجيل حضور طلاب اليوم'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 14),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Active Plan Card (if available)
                if (plan != null) ...[
                  Container(
                    margin: const EdgeInsets.symmetric(horizontal: 16),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppTheme.primary.withAlpha(12),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.primary.withAlpha(40)),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.assignment_outlined, color: AppTheme.primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'الخطة التعليمية المعتمدة للحلقة',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              Text(
                                plan['name'] as String? ?? 'خطة الحفظ',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primaryDark,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Students Section Header
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 6),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'قائمة الطلاب (${students.length})',
                        style: const TextStyle(
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),

                if (students.isEmpty)
                  const EmptyStateView(
                    title: 'لا يوجد طلاب مسجلين في هذه الحلقة',
                    subtitle: 'تواصل مع الإدارة لإلحاق الطلاب بالحلقة',
                  )
                else
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: students.length,
                    itemBuilder: (context, index) {
                      final student = students[index];
                      return _buildStudentCard(context, student);
                    },
                  ),
              ],
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل مساحة العمل...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(halaqaWorkspaceProvider(halaqaId)),
          ),
        ),
      ),
    );
  }

  Widget _buildStudentCard(BuildContext context, WorkspaceStudent student) {
    Color badgeBg;
    Color badgeText;
    String badgeLabel;

    switch (student.todayAttendanceStatus) {
      case 'PRESENT':
        badgeBg = AppTheme.statusPresent.withAlpha(25);
        badgeText = AppTheme.statusPresent;
        badgeLabel = 'حاضر';
        break;
      case 'ABSENT':
        badgeBg = AppTheme.statusAbsent.withAlpha(25);
        badgeText = AppTheme.statusAbsent;
        badgeLabel = 'غائب';
        break;
      case 'LATE':
        badgeBg = AppTheme.statusLate.withAlpha(25);
        badgeText = AppTheme.statusLate;
        badgeLabel = 'متأخر';
        break;
      case 'EXCUSED':
        badgeBg = AppTheme.statusExcused.withAlpha(25);
        badgeText = AppTheme.statusExcused;
        badgeLabel = 'معذور';
        break;
      default:
        badgeBg = Colors.grey.withAlpha(25);
        badgeText = Colors.grey.shade700;
        badgeLabel = 'لم يُسجل';
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Student Title & Attendance Status
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        student.displayName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                      if (student.studentNumber != null)
                        Text(
                          'رقم الطالب: ${student.studentNumber}',
                          style: const TextStyle(
                            fontSize: 12,
                            color: AppTheme.textMuted,
                          ),
                        ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeBg,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    badgeLabel,
                    style: TextStyle(
                      color: badgeText,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            const Divider(height: 1, color: AppTheme.dividerColor),
            const SizedBox(height: 12),

            // Recitation Today Status
            if (student.todayMemorization != null) ...[
              Row(
                children: [
                  const Icon(Icons.check_circle_outline, color: AppTheme.primary, size: 16),
                  const SizedBox(width: 6),
                  Text(
                    'حفظ اليوم: سورة ${QuranData.getSurahName(student.todayMemorization!['surahNumber'] as int?)} (${student.todayMemorization!['fromAyah']}-${student.todayMemorization!['toAyah']}) • درجة: ${student.todayMemorization!['evaluationScore'] ?? 100}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.primaryDark),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],

            // Action Buttons Row
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      context.push(
                        '/teacher/students/${student.studentId}/memorization?halaqaId=$halaqaId&name=${Uri.encodeComponent(student.displayName)}',
                      );
                    },
                    icon: const Icon(Icons.record_voice_over_outlined, size: 16),
                    label: const Text('تسميع حفظ', style: TextStyle(fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      context.push(
                        '/teacher/students/${student.studentId}/revision?halaqaId=$halaqaId&name=${Uri.encodeComponent(student.displayName)}',
                      );
                    },
                    icon: const Icon(Icons.repeat_rounded, size: 16),
                    label: const Text('مراجعة', style: TextStyle(fontSize: 13)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                IconButton(
                  icon: const Icon(Icons.bar_chart_rounded, color: AppTheme.primary),
                  tooltip: 'سجل تقدم الطالب',
                  onPressed: () {
                    context.push(
                      '/teacher/students/${student.studentId}/progress?name=${Uri.encodeComponent(student.displayName)}',
                    );
                  },
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
