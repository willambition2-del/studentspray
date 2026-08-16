import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../models/administrative_models.dart';
import '../providers/administrative_provider.dart';

class AdministrativeHubScreen extends ConsumerStatefulWidget {
  const AdministrativeHubScreen({super.key});

  @override
  ConsumerState<AdministrativeHubScreen> createState() => _AdministrativeHubScreenState();
}

class _AdministrativeHubScreenState extends ConsumerState<AdministrativeHubScreen>
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
        title: const Text('الشؤون الإدارية والتكليفات'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.assignment_outlined), text: 'طلباتي'),
            Tab(icon: Icon(Icons.task_alt_rounded), text: 'المهام والتكليفات'),
            Tab(icon: Icon(Icons.gavel_rounded), text: 'القرارات'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: const [
          _RequestsTabView(),
          _TasksTabView(),
          _DecisionsTabView(),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        icon: const Icon(Icons.add_rounded),
        label: const Text('طلب إداري'),
        onPressed: () => _showNewRequestDialog(context),
      ),
    );
  }

  void _showNewRequestDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _NewRequestModal(
        onCreated: () {
          ref.invalidate(myAdminRequestsProvider);
        },
      ),
    );
  }
}

class _RequestsTabView extends ConsumerWidget {
  const _RequestsTabView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(myAdminRequestsProvider);

    return requestsAsync.when(
      data: (requests) {
        if (requests.isEmpty) {
          return const EmptyStateView(
            title: 'لا توجد طلبات إدارية مقدمة حالياً',
            icon: Icons.assignment_outlined,
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.refresh(myAdminRequestsProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              return _RequestCard(request: req);
            },
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل الطلبات الإدارية...'),
      error: (err, _) => ErrorView(
        message: 'فشل تحميل الطلبات: $err',
        onRetry: () => ref.refresh(myAdminRequestsProvider),
      ),
    );
  }
}

class _RequestCard extends StatelessWidget {
  final AdminRequestModel request;

  const _RequestCard({required this.request});

  Color _getStatusColor(String status) {
    switch (status) {
      case 'APPROVED':
        return AppTheme.statusPresent;
      case 'REJECTED':
        return AppTheme.statusAbsent;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return Colors.amber.shade800;
      default:
        return Colors.grey.shade600;
    }
  }

  String _getStatusLabel(String status) {
    switch (status) {
      case 'APPROVED':
        return 'معتمد';
      case 'REJECTED':
        return 'مرفوض';
      case 'SUBMITTED':
        return 'قيد المراجعة';
      case 'DRAFT':
        return 'مسودة';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor(request.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: statusColor.withValues(alpha: 0.3), width: 1.2),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    request.title,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: statusColor.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    _getStatusLabel(request.status),
                    style: TextStyle(
                      color: statusColor,
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              request.description,
              style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Icon(Icons.calendar_today_outlined, size: 14, color: Colors.grey.shade500),
                const SizedBox(width: 4),
                Text(
                  request.createdAt.toIso8601String().split('T')[0],
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                ),
                const Spacer(),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade100,
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    'أولوية: ${request.priority}',
                    style: TextStyle(fontSize: 11, color: Colors.grey.shade700),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _TasksTabView extends ConsumerWidget {
  const _TasksTabView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tasksAsync = ref.watch(myAdminTasksProvider);

    return tasksAsync.when(
      data: (tasks) {
        if (tasks.isEmpty) {
          return const EmptyStateView(
            title: 'لا توجد تكليفات أو مهام مسندة إليك حالياً',
            icon: Icons.task_alt_rounded,
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.refresh(myAdminTasksProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: tasks.length,
            itemBuilder: (context, index) {
              final task = tasks[index];
              return _TaskCard(
                task: task,
                onFollowUpAdded: () => ref.refresh(myAdminTasksProvider),
              );
            },
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل المهام والتكليفات...'),
      error: (err, _) => ErrorView(
        message: 'فشل تحميل المهام: $err',
        onRetry: () => ref.refresh(myAdminTasksProvider),
      ),
    );
  }
}

class _TaskCard extends ConsumerWidget {
  final AdminTaskModel task;
  final VoidCallback onFollowUpAdded;

  const _TaskCard({required this.task, required this.onFollowUpAdded});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCompleted = task.status == 'COMPLETED';

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(
          color: task.isOverdue
              ? AppTheme.statusAbsent
              : (isCompleted ? AppTheme.statusPresent : Colors.grey.shade300),
          width: task.isOverdue ? 1.5 : 1,
        ),
      ),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Row(
          children: [
            Expanded(
              child: Text(
                task.title,
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  decoration: isCompleted ? TextDecoration.lineThrough : null,
                ),
              ),
            ),
            if (task.isOverdue)
              Container(
                margin: const EdgeInsets.only(left: 8),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppTheme.statusAbsent.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: const Text(
                  'متأخر',
                  style: TextStyle(
                    color: AppTheme.statusAbsent,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        subtitle: task.dueAt != null
            ? Text(
                'الموعد المحدد: ${task.dueAt!.toIso8601String().split('T')[0]}',
                style: TextStyle(
                  fontSize: 12,
                  color: task.isOverdue ? AppTheme.statusAbsent : Colors.grey.shade600,
                ),
              )
            : null,
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (task.description != null && task.description!.isNotEmpty) ...[
                  Text(
                    task.description!,
                    style: TextStyle(color: Colors.grey.shade800, fontSize: 13),
                  ),
                  const Divider(height: 24),
                ],
                const Text(
                  'سجل المتابعة والإنجاز:',
                  style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                ),
                const SizedBox(height: 8),
                if (task.followUps.isEmpty)
                  Text(
                    'لا توجد ملاحظات متابعة سابقة',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 12),
                  )
                else
                  ...task.followUps.map(
                    (f) => Padding(
                      padding: const EdgeInsets.only(bottom: 6),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.circle, size: 6, color: Colors.blueGrey),
                          const SizedBox(width: 6),
                          Expanded(
                            child: Text(
                              '${f.note} (${f.createdAt.toIso8601String().split('T')[0]})',
                              style: const TextStyle(fontSize: 12),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  icon: const Icon(Icons.add_comment_outlined, size: 18),
                  label: const Text('إضافة تقدم / إكمال المهمة'),
                  onPressed: () => _showAddFollowUpModal(context, ref),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showAddFollowUpModal(BuildContext context, WidgetRef ref) {
    final noteCtrl = TextEditingController();
    bool markComplete = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('تسجيل تقدم بالمهمة'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: noteCtrl,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'ملاحظة الإنجاز أو المتابعة',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('تعليم المهمة كمكتملة'),
                value: markComplete,
                onChanged: (val) => setState(() => markComplete = val ?? false),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              onPressed: () async {
                if (noteCtrl.text.trim().isEmpty) return;
                Navigator.pop(ctx);
                final service = ref.read(administrativeServiceProvider);
                await service.addTaskFollowUp(
                  task.id,
                  note: noteCtrl.text.trim(),
                  status: markComplete ? 'COMPLETED' : 'IN_PROGRESS',
                );
                onFollowUpAdded();
              },
              child: const Text('حفظ'),
            ),
          ],
        ),
      ),
    );
  }
}

class _DecisionsTabView extends ConsumerWidget {
  const _DecisionsTabView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final decisionsAsync = ref.watch(myAdminDecisionsProvider);

    return decisionsAsync.when(
      data: (decisions) {
        if (decisions.isEmpty) {
          return const EmptyStateView(
            title: 'لا توجد قرارات إدارية معلنة حالياً',
            icon: Icons.gavel_rounded,
          );
        }
        return RefreshIndicator(
          onRefresh: () async => ref.refresh(myAdminDecisionsProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: decisions.length,
            itemBuilder: (context, index) {
              final dec = decisions[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppTheme.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              dec.decisionNumber,
                              style: const TextStyle(
                                color: AppTheme.primary,
                                fontWeight: FontWeight.bold,
                                fontSize: 12,
                              ),
                            ),
                          ),
                          const Spacer(),
                          Text(
                            dec.issuedAt.toIso8601String().split('T')[0],
                            style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        dec.title,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        dec.content,
                        style: TextStyle(color: Colors.grey.shade700, fontSize: 13),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل القرارات الإدارية...'),
      error: (err, _) => ErrorView(
        message: 'فشل تحميل القرارات: $err',
        onRetry: () => ref.refresh(myAdminDecisionsProvider),
      ),
    );
  }
}

class _NewRequestModal extends ConsumerStatefulWidget {
  final VoidCallback onCreated;

  const _NewRequestModal({required this.onCreated});

  @override
  ConsumerState<_NewRequestModal> createState() => _NewRequestModalState();
}

class _NewRequestModalState extends ConsumerState<_NewRequestModal> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  String _selectedType = 'GENERAL';
  final String _selectedPriority = 'NORMAL';
  bool _isLoading = false;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'تقديم طلب إداري جديد',
                style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                initialValue: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'نوع الطلب',
                  border: OutlineInputBorder(),
                ),
                items: const [
                  DropdownMenuItem(value: 'GENERAL', child: Text('طلب عام')),
                  DropdownMenuItem(value: 'LEAVE', child: Text('طلب إجازة / استئذان')),
                  DropdownMenuItem(value: 'EXCEPTION', child: Text('استثناء خطة أو منهج')),
                  DropdownMenuItem(value: 'TRANSFER', child: Text('نقل حلقة أو فرع')),
                  DropdownMenuItem(value: 'ACTIVITY_PROPOSAL', child: Text('مقترح نشاط أو رحلة')),
                ],
                onChanged: (val) => setState(() => _selectedType = val ?? 'GENERAL'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleCtrl,
                decoration: const InputDecoration(
                  labelText: 'عنوان الطلب',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'يرجى كتابة العنوان' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descCtrl,
                maxLines: 4,
                decoration: const InputDecoration(
                  labelText: 'تفاصيل الطلب والمبررات',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'يرجى كتابة التفاصيل' : null,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const CircularProgressIndicator(color: Colors.white)
                      : const Text('إرسال الطلب للاعتماد'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final service = ref.read(administrativeServiceProvider);
      await service.createRequest(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        type: _selectedType,
        priority: _selectedPriority,
        submitNow: true,
      );
      if (mounted) {
        Navigator.pop(context);
        widget.onCreated();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم تقديم الطلب للاعتماد بنجاح')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل تقديم الطلب: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }
}
