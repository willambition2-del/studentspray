import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentAttendanceScreen extends ConsumerWidget {
  const StudentAttendanceScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final attendanceAsync = ref.watch(studentAttendanceProvider);

    return Scaffold(
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
            onRefresh: () async => ref.refresh(studentAttendanceProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Attendance Summary Card
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('نسبة الحضور الإجمالية', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                            Text(
                              '${rate.toStringAsFixed(1)}%',
                              style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                color: rate >= 90 ? Colors.green.shade700 : (rate >= 75 ? Colors.amber.shade800 : Colors.red.shade700),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _StatColumn(title: 'الجلسات', value: '$total', color: Colors.blueGrey),
                            _StatColumn(title: 'حاضر', value: '$present', color: Colors.green),
                            _StatColumn(title: 'غائب', value: '$absent', color: Colors.red),
                            _StatColumn(title: 'متأخر', value: '$late', color: Colors.orange),
                            _StatColumn(title: 'مستأذن', value: '$excused', color: Colors.blue),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  'سجل الجلسات السابقة',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),

                if (history.isEmpty)
                  const EmptyStateView(title: 'لا توجد جلسات مسجلة بعد', icon: Icons.event_busy)
                else
                  ...history.map((record) {
                    final status = record['status'] as String? ?? 'PRESENT';
                    final date = record['date'] as String? ?? '';
                    final notes = record['notes'] as String?;

                    Color statusColor;
                    String statusText;
                    IconData statusIcon;

                    switch (status) {
                      case 'PRESENT':
                        statusColor = Colors.green;
                        statusText = 'حاضر';
                        statusIcon = Icons.check_circle;
                        break;
                      case 'ABSENT':
                        statusColor = Colors.red;
                        statusText = 'غائب';
                        statusIcon = Icons.cancel;
                        break;
                      case 'LATE':
                        statusColor = Colors.orange;
                        statusText = 'متأخر';
                        statusIcon = Icons.access_time;
                        break;
                      case 'EXCUSED':
                        statusColor = Colors.blue;
                        statusText = 'مستأذن';
                        statusIcon = Icons.info_outline;
                        break;
                      default:
                        statusColor = Colors.grey;
                        statusText = status;
                        statusIcon = Icons.help_outline;
                    }

                    return Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: ListTile(
                        leading: CircleAvatar(
                          backgroundColor: statusColor.withAlpha(38),
                          child: Icon(statusIcon, color: statusColor),
                        ),
                        title: Text('جلسة تاريخ: $date', style: const TextStyle(fontWeight: FontWeight.w600)),
                        subtitle: notes != null ? Text(notes) : null,
                        trailing: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withAlpha(38),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            statusText,
                            style: TextStyle(color: statusColor, fontWeight: FontWeight.bold),
                          ),
                        ),
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

class _StatColumn extends StatelessWidget {
  final String title;
  final String value;
  final MaterialColor color;

  const _StatColumn({
    required this.title,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color.shade800)),
        const SizedBox(height: 2),
        Text(title, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
      ],
    );
  }
}
