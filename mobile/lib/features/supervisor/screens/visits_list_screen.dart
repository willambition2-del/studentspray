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
        children: const [
          _VisitsSubList(status: null),
          _VisitsSubList(status: 'PLANNED'),
          _VisitsSubList(status: 'IN_PROGRESS'),
          _VisitsSubList(status: 'COMPLETED'),
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

  const _VisitsSubList({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitsAsync = ref.watch(supervisorVisitsProvider(status));

    return visitsAsync.when(
      data: (visits) {
        if (visits.isEmpty) {
          return const Center(child: Text('لا توجد زيارات في هذه الفئة'));
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: visits.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final v = visits[index];
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
                          _StatusBadge(status: v.status),
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
