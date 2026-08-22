import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/supervisor_provider.dart';

class VisitsListScreen extends ConsumerStatefulWidget {
  const VisitsListScreen({super.key});

  @override
  ConsumerState<VisitsListScreen> createState() => _VisitsListScreenState();
}

class _VisitsListScreenState extends ConsumerState<VisitsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  DateTimeRange? _selectedDateRange;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('الزيارات الميدانية'),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'الكل'),
            Tab(text: 'المجدولة'),
            Tab(text: 'الجارية'),
            Tab(text: 'المكتملة'),
          ],
        ),
        actions: [
          if (_selectedDateRange != null)
            IconButton(
              icon: const Icon(Icons.filter_alt_off, color: Colors.amber),
              tooltip: 'إلغاء تصفية التاريخ',
              onPressed: () => setState(() => _selectedDateRange = null),
            ),
          IconButton(
            icon: Icon(
              Icons.date_range_outlined,
              color: _selectedDateRange != null ? Colors.amber : null,
            ),
            tooltip: 'تصفية حسب نطاق التاريخ',
            onPressed: () async {
              final range = await showDateRangePicker(
                context: context,
                firstDate: DateTime(2020),
                lastDate: DateTime(2030),
                initialDateRange: _selectedDateRange,
              );
              if (range != null) {
                setState(() => _selectedDateRange = range);
              }
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () {
              ref.invalidate(supervisorVisitsProvider);
            },
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _VisitsSubList(status: null, dateRange: _selectedDateRange),
          _VisitsSubList(status: 'PLANNED', dateRange: _selectedDateRange),
          _VisitsSubList(status: 'IN_PROGRESS', dateRange: _selectedDateRange),
          _VisitsSubList(status: 'COMPLETED', dateRange: _selectedDateRange),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/supervisor/visits/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _VisitsSubList extends ConsumerWidget {
  final String? status;
  final DateTimeRange? dateRange;

  const _VisitsSubList({required this.status, this.dateRange});

  void _showCancelDialog(BuildContext context, WidgetRef ref, String visitId, String visitNumber) {
    final reasonController = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('إلغاء الزيارة الميدانية: $visitNumber'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('هل أنت متأكد من إلغاء هذه الزيارة الميدانية؟ يرجى توضيح سبب الإلغاء:'),
            const SizedBox(height: 12),
            TextField(
              controller: reasonController,
              decoration: const InputDecoration(
                labelText: 'سبب الإلغاء',
                border: OutlineInputBorder(),
                hintText: 'ظرف طارئ، تأجيل الجلسة...',
              ),
              maxLines: 2,
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('تراجع')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              try {
                await ref.read(supervisorActionsProvider.notifier).updateVisitStatus(
                      visitId: visitId,
                      status: 'CANCELLED',
                      generalNotes: reasonController.text.trim().isNotEmpty ? 'سبب الإلغاء: ${reasonController.text.trim()}' : null,
                    );
                if (context.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('✓ تم إلغاء الزيارة الميدانية بنجاح'), backgroundColor: Colors.red),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('تعذر إلغاء الزيارة: $e')),
                  );
                }
              }
            },
            child: const Text('تأكيد الإلغاء'),
          ),
        ],
      ),
    );
  }

  void _showRescheduleDialog(BuildContext context, WidgetRef ref, String visitId, String visitNumber) {
    DateTime selectedDate = DateTime.now().add(const Duration(days: 2));
    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('إعادة جدولة الزيارة: $visitNumber'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text('حدد الموعد الجديد للزيارة الميدانية:'),
              const SizedBox(height: 16),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.calendar_today, color: Colors.teal),
                title: Text('التاريخ: ${selectedDate.toIso8601String().substring(0, 10)}'),
                trailing: ElevatedButton(
                  onPressed: () async {
                    final picked = await showDatePicker(
                      context: context,
                      initialDate: selectedDate,
                      firstDate: DateTime.now(),
                      lastDate: DateTime.now().add(const Duration(days: 90)),
                    );
                    if (picked != null) {
                      setDialogState(() => selectedDate = picked);
                    }
                  },
                  child: const Text('تغيير'),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: Colors.teal, foregroundColor: Colors.white),
              onPressed: () async {
                try {
                  await ref.read(supervisorActionsProvider.notifier).updateVisitStatus(
                        visitId: visitId,
                        status: 'PLANNED',
                        scheduledDate: selectedDate.toIso8601String(),
                        generalNotes: 'تمت إعادة الجدولة إلى: ${selectedDate.toIso8601String().substring(0, 10)}',
                      );
                  if (context.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('✓ تمت إعادة جدولة الزيارة الميدانية بنجاح'), backgroundColor: Colors.teal),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('تعذر إعادة الجدولة: $e')),
                    );
                  }
                }
              },
              child: const Text('حفظ الموعد الجديد'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitsAsync = ref.watch(supervisorVisitsProvider(status));

    return visitsAsync.when(
      data: (allVisits) {
        final visits = dateRange == null
            ? allVisits
            : allVisits.where((v) {
                if (v.scheduledDate == null) return false;
                try {
                  final dt = DateTime.parse(v.scheduledDate!);
                  return dt.isAfter(dateRange!.start.subtract(const Duration(days: 1))) &&
                      dt.isBefore(dateRange!.end.add(const Duration(days: 1)));
                } catch (_) {
                  return false;
                }
              }).toList();

        if (visits.isEmpty) {
          return const Center(child: Text('لا توجد زيارات مطابقة للتصفية'));
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: visits.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final v = visits[index];
            final isPlanned = v.status == 'PLANNED';

            return Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: InkWell(
                onTap: () => context.push('/supervisor/visits/${v.id}'),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            v.visitNumber,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Row(
                            children: [
                              _StatusBadge(status: v.status),
                              if (isPlanned) ...[
                                const SizedBox(width: 4),
                                PopupMenuButton<String>(
                                  icon: const Icon(Icons.more_vert, size: 20, color: Colors.grey),
                                  onSelected: (val) {
                                    if (val == 'reschedule') {
                                      _showRescheduleDialog(context, ref, v.id, v.visitNumber);
                                    } else if (val == 'cancel') {
                                      _showCancelDialog(context, ref, v.id, v.visitNumber);
                                    }
                                  },
                                  itemBuilder: (ctx) => [
                                    const PopupMenuItem(
                                      value: 'reschedule',
                                      child: Row(
                                        children: [
                                          Icon(Icons.edit_calendar, size: 18, color: Colors.teal),
                                          SizedBox(width: 8),
                                          Text('إعادة جدولة الزيارة'),
                                        ],
                                      ),
                                    ),
                                    const PopupMenuItem(
                                      value: 'cancel',
                                      child: Row(
                                        children: [
                                          Icon(Icons.cancel_outlined, size: 18, color: Colors.red),
                                          SizedBox(width: 8),
                                          Text('إلغاء الزيارة'),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('الحلقة: ${v.halaqaName}', style: const TextStyle(fontSize: 14)),
                      Text('المعلم: ${v.teacherName}', style: TextStyle(color: Colors.grey.shade700)),
                      if (v.reason != null && v.reason!.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        Text('الهدف: ${v.reason!}', style: TextStyle(color: Colors.grey.shade600, fontSize: 13)),
                      ],
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            v.completedAt != null
                                ? 'اكتملت: ${v.completedAt!.split("T").first}'
                                : (v.scheduledDate != null
                                    ? 'الموعد: ${v.scheduledDate!.split("T").first}'
                                    : 'نوع: ${_visitTypeLabel(v.visitType)}'),
                            style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                          ),
                          if (v.evaluationScore != null)
                            Chip(
                              label: Text('${v.evaluationScore}% — ${_levelLabel(v.evaluationLevel)}'),
                              backgroundColor: Colors.green.shade50,
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (err, _) => Center(child: Text('حدث خطأ: $err')),
    );
  }

  String _visitTypeLabel(String type) {
    switch (type) {
      case 'ROUTINE':
        return 'دورية';
      case 'FOLLOW_UP':
        return 'متابعة';
      case 'DIAGNOSTIC':
        return 'تشخيصية';
      case 'EMERGENCY':
        return 'طارئة';
      case 'COMPREHENSIVE':
        return 'شاملة';
      default:
        return type;
    }
  }

  String _levelLabel(String? level) {
    switch (level) {
      case 'EXCELLENT':
        return 'ممتاز';
      case 'VERY_GOOD':
        return 'جيد جداً';
      case 'GOOD':
        return 'جيد';
      case 'NEEDS_IMPROVEMENT':
        return 'يحتاج تحسين';
      case 'NEEDS_INTERVENTION':
        return 'يحتاج تدخل';
      default:
        return level ?? '';
    }
  }
}

class _StatusBadge extends StatelessWidget {
  final String status;

  const _StatusBadge({required this.status});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (status) {
      case 'COMPLETED':
        bg = Colors.green.shade100;
        fg = Colors.green.shade900;
        label = 'مكتملة';
        break;
      case 'IN_PROGRESS':
        bg = Colors.blue.shade100;
        fg = Colors.blue.shade900;
        label = 'جارية';
        break;
      case 'PLANNED':
        bg = Colors.orange.shade100;
        fg = Colors.orange.shade900;
        label = 'مجدولة';
        break;
      default:
        bg = Colors.grey.shade200;
        fg = Colors.grey.shade800;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        label,
        style: TextStyle(color: fg, fontWeight: FontWeight.bold, fontSize: 12),
      ),
    );
  }
}
