import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/supervisor_models.dart';
import '../providers/supervisor_provider.dart';

class VisitWorkspaceScreen extends ConsumerStatefulWidget {
  final String visitId;

  const VisitWorkspaceScreen({super.key, required this.visitId});

  @override
  ConsumerState<VisitWorkspaceScreen> createState() => _VisitWorkspaceScreenState();
}

class _VisitWorkspaceScreenState extends ConsumerState<VisitWorkspaceScreen> {
  bool _isActionLoading = false;

  Future<void> _changeStatus(String newStatus) async {
    setState(() => _isActionLoading = true);
    try {
      await ref.read(supervisorActionsProvider.notifier).updateVisitStatus(
            visitId: widget.visitId,
            status: newStatus,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(newStatus == 'IN_PROGRESS'
              ? 'تم بدء الزيارة الميدانية بنجاح'
              : 'تم تحديث حالة الزيارة'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر تحديث الحالة: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isActionLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final workspaceAsync = ref.watch(supervisorVisitWorkspaceProvider(widget.visitId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('مساحة تحضير وتنفيذ الزيارة'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => ref.invalidate(supervisorVisitWorkspaceProvider(widget.visitId)),
          ),
        ],
      ),
      body: workspaceAsync.when(
        data: (data) {
          final visit = FieldVisitItem.fromJson(data['visit'] as Map<String, dynamic>);
          final snapshot = data['liveSnapshot'] as Map<String, dynamic>? ?? {};
          final prevVisit = data['previousVisit'] as Map<String, dynamic>?;
          final recs = (data['openRecommendations'] as List? ?? [])
              .map((r) => RecommendationModel.fromJson(r as Map<String, dynamic>))
              .toList();

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header Card
              Card(
                elevation: 2,
                color: Theme.of(context).colorScheme.surfaceContainerHighest,
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            visit.visitNumber,
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                          ),
                          Chip(
                            label: Text(visit.status),
                            backgroundColor: visit.status == 'COMPLETED'
                                ? Colors.green.shade100
                                : Colors.blue.shade100,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('الحلقة: ${visit.halaqaName}',
                          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
                      Text('المعلم: ${visit.teacherName}',
                          style: TextStyle(color: Colors.grey.shade800, fontSize: 14)),
                      if (visit.reason != null) ...[
                        const SizedBox(height: 6),
                        Text('الهدف: ${visit.reason!}',
                            style: TextStyle(color: Colors.grey.shade700, fontSize: 13)),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 16),

              // Live Snapshot Metrics
              Text(
                'المؤشرات الحية للحلقة (Live Preparation Metrics)',
                style: Theme.of(context).textTheme.titleSmall?.copyWith(fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _LiveStatCard(
                      label: 'الطلاب النشطون',
                      value: '${snapshot['totalActiveStudents'] ?? 0}',
                      icon: Icons.people,
                      color: Colors.blue,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _LiveStatCard(
                      label: 'نسبة الحضور',
                      value: '${snapshot['recentAttendanceRate'] ?? 0}%',
                      icon: Icons.how_to_reg,
                      color: Colors.teal,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: _LiveStatCard(
                      label: 'جلسات التسميع',
                      value: '${snapshot['recentMemorizationsCount'] ?? 0}',
                      icon: Icons.menu_book,
                      color: Colors.purple,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Previous Visit Card
              if (prevVisit != null) ...[
                Card(
                  child: ListTile(
                    leading: const Icon(Icons.history, color: Colors.blueGrey),
                    title: const Text('الزيارة السابقة'),
                    subtitle: Text('النتيجة: ${prevVisit['percentage'] ?? "—"}% (${prevVisit['level'] ?? ""})'),
                    trailing: Text(
                      prevVisit['date'] != null
                          ? (prevVisit['date'] as String).split('T').first
                          : '',
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Actions Block
              if (visit.status == 'PLANNED') ...[
                FilledButton.icon(
                  onPressed: _isActionLoading ? null : () => _changeStatus('IN_PROGRESS'),
                  icon: const Icon(Icons.play_arrow),
                  label: const Text('بدء الزيارة الميدانية الآن'),
                  style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    backgroundColor: Colors.teal.shade700,
                  ),
                ),
                const SizedBox(height: 12),
              ],

              // Evaluation Button
              FilledButton.tonalIcon(
                onPressed: () {
                  context.push('/supervisor/visits/${widget.visitId}/evaluation');
                },
                icon: const Icon(Icons.rate_review),
                label: Text(visit.status == 'COMPLETED'
                    ? 'عرض التقييم النهائي المعتمد'
                    : 'استمارة التقييم المعيارية (تسجيل الدرجات)'),
                style: FilledButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 14)),
              ),
              const SizedBox(height: 20),

              // Open Recommendations Section
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'التوصيات المرتبطة (${recs.length})',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                  TextButton.icon(
                    onPressed: () => _showAddRecommendationDialog(context, visit),
                    icon: const Icon(Icons.add, size: 18),
                    label: const Text('إضافة توصية'),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              if (recs.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: Text('لا توجد توصيات مسجلة لهذه الزيارة بعد')),
                  ),
                )
              else
                ...recs.map((r) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        onTap: () => context.push('/supervisor/recommendations/${r.id}'),
                        title: Text(r.title),
                        subtitle: Text('الأولوية: ${r.priority} | الحالة: ${r.status}'),
                        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      ),
                    )),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('حدث خطأ: $err')),
      ),
    );
  }

  void _showAddRecommendationDialog(BuildContext context, FieldVisitItem visit) {
    final titleController = TextEditingController();
    final descController = TextEditingController();
    String priority = 'MEDIUM';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('إضافة توصية جديدة'),
        content: StatefulBuilder(
          builder: (ctx, setDialogState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: titleController,
                decoration: const InputDecoration(labelText: 'عنوان التوصية *', border: OutlineInputBorder()),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: descController,
                decoration: const InputDecoration(labelText: 'تفاصيل التوجيه والتوصية *', border: OutlineInputBorder()),
                maxLines: 3,
              ),
              const SizedBox(height: 12),
              DropdownButtonFormField<String>(
                initialValue: priority,
                decoration: const InputDecoration(labelText: 'مستوى الأولوية', border: OutlineInputBorder()),
                items: const [
                  DropdownMenuItem(value: 'LOW', child: Text('منخفضة')),
                  DropdownMenuItem(value: 'MEDIUM', child: Text('متوسطة')),
                  DropdownMenuItem(value: 'HIGH', child: Text('عالية')),
                  DropdownMenuItem(value: 'URGENT', child: Text('عاجلة جداً')),
                ],
                onChanged: (val) => setDialogState(() => priority = val ?? 'MEDIUM'),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          FilledButton(
            onPressed: () async {
              if (titleController.text.trim().isEmpty || descController.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              final messenger = ScaffoldMessenger.of(context);
              try {
                await ref.read(supervisorActionsProvider.notifier).createRecommendation(
                      visitId: widget.visitId,
                      halaqaId: visit.halaqaId,
                      teacherId: visit.teacherId,
                      title: titleController.text.trim(),
                      description: descController.text.trim(),
                      priority: priority,
                    );
                if (!mounted) return;
                messenger.showSnackBar(
                  const SnackBar(content: Text('تمت إضافة التوصية بنجاح'), backgroundColor: Colors.green),
                );
              } catch (e) {
                if (!mounted) return;
                messenger.showSnackBar(
                  SnackBar(content: Text('تعذر حفظ التوصية: $e'), backgroundColor: Colors.red),
                );
              }
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }
}

class _LiveStatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;

  const _LiveStatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 8),
        child: Column(
          children: [
            Icon(icon, color: color, size: 22),
            const SizedBox(height: 4),
            Text(value, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
            const SizedBox(height: 2),
            Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey), textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}
