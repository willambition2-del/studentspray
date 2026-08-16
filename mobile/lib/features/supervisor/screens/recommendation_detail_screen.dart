import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/supervisor_provider.dart';

class RecommendationDetailScreen extends ConsumerStatefulWidget {
  final String recommendationId;

  const RecommendationDetailScreen({super.key, required this.recommendationId});

  @override
  ConsumerState<RecommendationDetailScreen> createState() =>
      _RecommendationDetailScreenState();
}

class _RecommendationDetailScreenState
    extends ConsumerState<RecommendationDetailScreen> {
  final _followUpController = TextEditingController();
  String _followUpStatus = 'COMPLETED';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _followUpController.dispose();
    super.dispose();
  }

  Future<void> _addFollowUp() async {
    if (_followUpController.text.trim().isEmpty) return;

    setState(() => _isSubmitting = true);
    try {
      await ref.read(supervisorActionsProvider.notifier).addRecommendationFollowUp(
            recommendationId: widget.recommendationId,
            status: _followUpStatus,
            notes: _followUpController.text.trim(),
          );

      if (!mounted) return;
      _followUpController.clear();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم تسجيل إجراء المتابعة وتحديث التوصية بنجاح'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر تسجيل المتابعة: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final recsAsync = ref.watch(supervisorRecommendationsProvider(null));

    return Scaffold(
      appBar: AppBar(
        title: const Text('تفاصيل التوصية والمتابعة'),
      ),
      body: recsAsync.when(
        data: (recs) {
          final match = recs.where((r) => r.id == widget.recommendationId);
          if (match.isEmpty) {
            return const Center(child: Text('لم يتم العثور على التوصية المطلوبة'));
          }
          final r = match.first;

          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Main Card
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
                            ),
                          ),
                          Chip(
                            label: Text(r.status),
                            backgroundColor: r.status == 'COMPLETED'
                                ? Colors.green.shade100
                                : Colors.orange.shade100,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text('المعلم: ${r.teacherName}', style: const TextStyle(fontSize: 14)),
                      Text('الحلقة: ${r.halaqaName}', style: TextStyle(color: Colors.grey.shade700)),
                      const SizedBox(height: 12),
                      const Text('نص التوجيه والتوصية:', style: TextStyle(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 4),
                      Text(r.description, style: const TextStyle(fontSize: 14, height: 1.4)),
                      if (r.dueDate != null) ...[
                        const SizedBox(height: 12),
                        Text(
                          'تاريخ الاستحقاق: ${r.dueDate!.split("T").first}',
                          style: TextStyle(
                            color: r.isOverdue ? Colors.red : Colors.grey.shade700,
                            fontWeight: r.isOverdue ? FontWeight.bold : FontWeight.normal,
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Timeline of follow-ups
              Text(
                'سجل المتابعات والإجراءات (${r.followUps.length})',
                style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),

              if (r.followUps.isEmpty)
                const Card(
                  child: Padding(
                    padding: EdgeInsets.all(16),
                    child: Center(child: Text('لا توجد متابعات مسجلة بعد')),
                  ),
                )
              else
                ...r.followUps.map((f) => Card(
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListTile(
                        leading: Icon(
                          f['status'] == 'COMPLETED' ? Icons.check_circle : Icons.update,
                          color: f['status'] == 'COMPLETED' ? Colors.green : Colors.blue,
                        ),
                        title: Text(f['notes'] as String? ?? ''),
                        subtitle: Text(
                          'الحالة: ${f["status"]} | ${f["createdAt"] != null ? (f["createdAt"] as String).split("T").first : ""}',
                        ),
                      ),
                    )),
              const SizedBox(height: 20),

              // Add Follow-Up Form
              Card(
                elevation: 2,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'تسجيل إجراء متابعة جديد',
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _followUpController,
                        decoration: const InputDecoration(
                          labelText: 'ملاحظات المعاينة والمتابعة *',
                          border: OutlineInputBorder(),
                        ),
                        maxLines: 3,
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _followUpStatus,
                        decoration: const InputDecoration(
                          labelText: 'تحديث حالة التوصية',
                          border: OutlineInputBorder(),
                        ),
                        items: const [
                          DropdownMenuItem(value: 'IN_PROGRESS', child: Text('قيد المعالجة (IN_PROGRESS)')),
                          DropdownMenuItem(value: 'COMPLETED', child: Text('تم الإنجاز وإغلاق التوصية (COMPLETED)')),
                          DropdownMenuItem(value: 'CANCELLED', child: Text('إلغاء التوصية (CANCELLED)')),
                        ],
                        onChanged: (val) => setState(() => _followUpStatus = val ?? 'COMPLETED'),
                      ),
                      const SizedBox(height: 16),
                      FilledButton.icon(
                        onPressed: _isSubmitting ? null : _addFollowUp,
                        icon: _isSubmitting
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.send),
                        label: const Text('حفظ إجراء المتابعة'),
                        style: FilledButton.styleFrom(
                          minimumSize: const Size.fromHeight(48),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('حدث خطأ: $err')),
      ),
    );
  }
}
