import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/quran_data.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class StudentProgressScreen extends ConsumerWidget {
  final String studentId;
  final String studentName;

  const StudentProgressScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(studentProgressProvider(studentId));

    return Scaffold(
      appBar: AppBar(
        title: Text('تقدم الطالب: $studentName'),
      ),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(studentProgressProvider(studentId)),
        child: progressAsync.when(
          data: (progress) {
            return ListView(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              children: [
                // Student Profile Card
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: AppTheme.primaryDark,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundColor: AppTheme.accentGold.withAlpha(40),
                        child: const Icon(
                          Icons.school_rounded,
                          color: AppTheme.accentGold,
                          size: 30,
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              progress.displayName,
                              style: const TextStyle(
                                fontSize: 17,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${progress.halaqaName ?? 'حلقة عامة'}${progress.studentNumber != null ? ' • رقم: ${progress.studentNumber}' : ''}',
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppTheme.accentGoldLight,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // Active Plan Card
                if (progress.activePlanName != null) ...[
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'الخطة التعليمية النشطة',
                                style: TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.textSecondary,
                                ),
                              ),
                              Text(
                                '${progress.planProgressPercentage}%',
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(
                            progress.activePlanName!,
                            style: const TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: AppTheme.textPrimary,
                            ),
                          ),
                          const SizedBox(height: 12),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: LinearProgressIndicator(
                              value: progress.planProgressPercentage / 100.0,
                              minHeight: 8,
                              backgroundColor: AppTheme.dividerColor,
                              color: AppTheme.primary,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],

                // Metrics Grid (Attendance, Memorization, Revision)
                Row(
                  children: [
                    _buildMetricCard(
                      title: 'نسبة الحضور',
                      value: '${progress.attendanceRate}%',
                      icon: Icons.calendar_today_rounded,
                      color: AppTheme.statusPresent,
                    ),
                    const SizedBox(width: 10),
                    _buildMetricCard(
                      title: 'جلسات الحفظ',
                      value: '${progress.totalMemorizationSessions}',
                      subtitle:
                          'معدل: ${progress.avgMemorizationScore.toStringAsFixed(1)}',
                      icon: Icons.record_voice_over_rounded,
                      color: AppTheme.primary,
                    ),
                    const SizedBox(width: 10),
                    _buildMetricCard(
                      title: 'جلسات المراجعة',
                      value: '${progress.totalRevisionSessions}',
                      subtitle:
                          'معدل: ${progress.avgRevisionScore.toStringAsFixed(1)}',
                      icon: Icons.repeat_rounded,
                      color: AppTheme.accentGold,
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // Recent Memorizations Section
                const Text(
                  'آخر سجلات الحفظ والتسميع',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (progress.recentMemorization.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'لا توجد سجلات حفظ مسجلة حتى الآن',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  )
                else
                  ...progress.recentMemorization.map((memo) {
                    final surahName =
                        QuranData.getSurahName(memo['surahNumber'] as int?);
                    final fromAyah = memo['fromAyah'];
                    final toAyah = memo['toAyah'];
                    final date = memo['date'] != null
                        ? (memo['date'] as String).split('T')[0]
                        : '';
                    final score = memo['evaluationScore'] ?? 100;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.primary.withAlpha(20),
                          child: const Icon(
                            Icons.book_rounded,
                            color: AppTheme.primary,
                            size: 20,
                          ),
                        ),
                        title: Text('سورة $surahName (الآيات $fromAyah - $toAyah)'),
                        subtitle: Text(
                          '$date • الدرجة: $score/100',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.statusPresent.withAlpha(20),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            memo['rating'] as String? ?? 'ممتاز',
                            style: const TextStyle(
                              color: AppTheme.statusPresent,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
                const SizedBox(height: 20),

                // Recent Revisions Section
                const Text(
                  'آخر سجلات المراجعة والتثبيت',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                if (progress.recentRevision.isEmpty)
                  const Padding(
                    padding: EdgeInsets.symmetric(vertical: 12),
                    child: Text(
                      'لا توجد سجلات مراجعة مسجلة حتى الآن',
                      style: TextStyle(color: AppTheme.textMuted, fontSize: 13),
                    ),
                  )
                else
                  ...progress.recentRevision.map((rev) {
                    final surahName = rev['surahNumber'] != null
                        ? QuranData.getSurahName(rev['surahNumber'] as int?)
                        : (rev['juzNumber'] != null
                            ? 'الجزء ${rev['juzNumber']}'
                            : 'مراجعة عامة');
                    final date = rev['date'] != null
                        ? (rev['date'] as String).split('T')[0]
                        : '';
                    final score = rev['evaluationScore'] ?? 100;

                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: AppTheme.accentGold.withAlpha(20),
                          child: const Icon(
                            Icons.repeat_rounded,
                            color: AppTheme.accentGold,
                            size: 20,
                          ),
                        ),
                        title: Text(surahName),
                        subtitle: Text(
                          '$date • الدرجة: $score/100',
                          style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                        ),
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppTheme.accentGold.withAlpha(20),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Text(
                            rev['rating'] as String? ?? 'ممتاز',
                            style: const TextStyle(
                              color: AppTheme.primaryDark,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    );
                  }),
              ],
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل مؤشرات الطالب...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(studentProgressProvider(studentId)),
          ),
        ),
      ),
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppTheme.dividerColor),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              title,
              style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
            ),
            if (subtitle != null) ...[
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
