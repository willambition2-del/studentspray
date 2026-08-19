import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class TeacherReportsScreen extends ConsumerWidget {
  const TeacherReportsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(teacherDashboardStatsProvider);
    final halaqasAsync = ref.watch(myHalaqasProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('التقارير والإحصائيات التحليلية'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              ref.invalidate(teacherDashboardStatsProvider);
              ref.invalidate(myHalaqasProvider);
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(teacherDashboardStatsProvider);
          ref.invalidate(myHalaqasProvider);
        },
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // KPI Summary Cards
            statsAsync.when(
              data: (stats) => Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'الملخص التراكمي العام للحلقات',
                    style: TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatTile(
                          title: 'معدل الحضور',
                          value: '${stats.attendanceRate.toStringAsFixed(1)}%',
                          subtitle: 'حاضر: ${stats.todayPresent} • غائب: ${stats.todayAbsent}',
                          icon: Icons.fact_check_rounded,
                          color: stats.attendanceRate >= 80 ? AppTheme.statusPresent : AppTheme.statusAbsent,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatTile(
                          title: 'إجمالي الطلاب',
                          value: '${stats.totalStudents}',
                          subtitle: 'عبر ${stats.totalHalaqas} حلقات',
                          icon: Icons.school_rounded,
                          color: AppTheme.primaryLight,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatTile(
                          title: 'جلسات التسميع',
                          value: '${stats.todayMemorization}',
                          subtitle: 'تسميع يومي منجز',
                          icon: Icons.auto_stories_rounded,
                          color: Colors.teal,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatTile(
                          title: 'جلسات المراجعة',
                          value: '${stats.todayRevision}',
                          subtitle: 'تثبيت ومراجعة',
                          icon: Icons.refresh_rounded,
                          color: Colors.indigo,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: _buildStatTile(
                          title: 'الاختبارات المعتمدة',
                          value: '${stats.upcomingExams}',
                          subtitle: 'اختبارات مقررة',
                          icon: Icons.assignment_turned_in_rounded,
                          color: Colors.purple.shade700,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: _buildStatTile(
                          title: 'التقييمات التربوية',
                          value: '${stats.recordedEvaluations}',
                          subtitle: 'تقييمات سلوكية',
                          icon: Icons.star_half_rounded,
                          color: Colors.amber.shade800,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              loading: () => const LoadingView(message: 'جاري حساب المؤشرات التراكمية...'),
              error: (err, _) => ErrorView(message: err.toString()),
            ),
            const SizedBox(height: 24),

            // Performance by Halaqa Section
            const Text(
              'مؤشرات الأداء حسب الحلقة',
              style: TextStyle(
                fontSize: 17,
                fontWeight: FontWeight.bold,
                color: AppTheme.primaryDark,
              ),
            ),
            const SizedBox(height: 12),

            halaqasAsync.when(
              data: (halaqas) {
                if (halaqas.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا توجد حلقات متاحة',
                    subtitle: 'تواصل مع الإدارة لتخصيص الحلقات',
                  );
                }

                return ListView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: halaqas.length,
                  itemBuilder: (context, index) {
                    final h = halaqas[index];
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
                                  h.name,
                                  style: const TextStyle(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 16,
                                    color: AppTheme.primaryDark,
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: AppTheme.primary.withAlpha(15),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: Text(
                                    '${h.studentsCount} طالب',
                                    style: const TextStyle(
                                      color: AppTheme.primary,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              '${h.branchName} • الرمز: ${h.code}',
                              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const LoadingView(message: 'جاري تحميل مؤشرات الحلقات...'),
              error: (err, _) => ErrorView(message: err.toString()),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatTile({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(5),
            blurRadius: 6,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: color.withAlpha(20),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 18),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade700,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: AppTheme.textPrimary,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 11,
              color: color,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
