import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/supervisor_provider.dart';

class RecommendationsListScreen extends ConsumerStatefulWidget {
  const RecommendationsListScreen({super.key});

  @override
  ConsumerState<RecommendationsListScreen> createState() => _RecommendationsListScreenState();
}

class _RecommendationsListScreenState extends ConsumerState<RecommendationsListScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
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
        title: const Text('سجل التوصيات والمتابعات'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'الجارية / المفتوحة'),
            Tab(text: 'المكتملة'),
            Tab(text: 'الكل'),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(supervisorRecommendationsProvider),
          ),
        ],
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _RecommendationsSubList(status: 'OPEN'),
          _RecommendationsSubList(status: 'COMPLETED'),
          _RecommendationsSubList(status: null),
        ],
      ),
    );
  }
}

class _RecommendationsSubList extends ConsumerWidget {
  final String? status;

  const _RecommendationsSubList({required this.status});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final recsAsync = ref.watch(supervisorRecommendationsProvider(status));

    return recsAsync.when(
      data: (recs) {
        if (recs.isEmpty) {
          return const Center(child: Text('لا توجد توصيات في هذا التبويب'));
        }

        return ListView.separated(
          padding: const EdgeInsets.all(16),
          itemCount: recs.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final r = recs[index];
            return Card(
              elevation: 2,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: InkWell(
                onTap: () => context.push('/supervisor/recommendations/${r.id}'),
                borderRadius: BorderRadius.circular(12),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              r.title,
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                          ),
                          _PriorityBadge(priority: r.priority),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text('المعلم: ${r.teacherName} | الحلقة: ${r.halaqaName}',
                          style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                      const SizedBox(height: 8),
                      Text(
                        r.description,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: TextStyle(color: Colors.grey.shade800, fontSize: 13),
                      ),
                      const Divider(height: 20),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            r.dueDate != null ? 'تاريخ الاستحقاق: ${r.dueDate!.split("T").first}' : 'الحالة: ${r.status}',
                            style: TextStyle(
                              color: r.isOverdue ? Colors.red : Colors.grey.shade600,
                              fontSize: 12,
                              fontWeight: r.isOverdue ? FontWeight.bold : FontWeight.normal,
                            ),
                          ),
                          if (r.followUps.isNotEmpty)
                            Text(
                              '${r.followUps.length} متابعات مسجلة',
                              style: const TextStyle(color: Colors.teal, fontSize: 12, fontWeight: FontWeight.bold),
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
}

class _PriorityBadge extends StatelessWidget {
  final String priority;

  const _PriorityBadge({required this.priority});

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;
    String label;

    switch (priority) {
      case 'URGENT':
        bg = Colors.red.shade100;
        fg = Colors.red.shade900;
        label = 'عاجلة';
        break;
      case 'HIGH':
        bg = Colors.orange.shade100;
        fg = Colors.orange.shade900;
        label = 'عالية';
        break;
      case 'MEDIUM':
        bg = Colors.blue.shade100;
        fg = Colors.blue.shade900;
        label = 'متوسطة';
        break;
      case 'LOW':
        bg = Colors.grey.shade200;
        fg = Colors.grey.shade800;
        label = 'منخفضة';
        break;
      default:
        bg = Colors.grey.shade200;
        fg = Colors.grey.shade800;
        label = priority;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Text(label, style: TextStyle(color: fg, fontSize: 11, fontWeight: FontWeight.bold)),
    );
  }
}
