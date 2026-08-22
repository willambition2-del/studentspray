import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../models/administrative_models.dart';
import '../providers/administrative_provider.dart';

import '../../../core/files/attachment_picker_service.dart';
import '../../auth/providers/auth_provider.dart';

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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الشؤون الإدارية والتكليفات'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          tabs: const [
            Tab(icon: Icon(Icons.assignment_outlined, size: 18), text: 'طلباتي'),
            Tab(icon: Icon(Icons.check_circle_outline, size: 18), text: 'المهام والتكليفات'),
            Tab(icon: Icon(Icons.gavel, size: 18), text: 'القرارات'),
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
        icon: const Icon(Icons.add),
        label: const Text(
          'طلب إداري',
          style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold),
        ),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        onPressed: () => _showNewRequestDialog(context),
      ),
    );
  }

  void _showNewRequestDialog(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
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
            subtitle: 'يمكنك تقديم طلب جديد مثل طلب إجازة أو نقل حلقة بالضغط على زر الإضافة أدناه',
            icon: Icons.assignment_outlined,
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
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
        message: 'فشل تحميل الطلبات',
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
        return AppColors.statusPresent;
      case 'REJECTED':
        return AppColors.statusAbsent;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return AppColors.statusLate;
      default:
        return AppColors.textSecondary;
    }
  }

  Color _getStatusBg(String status) {
    switch (status) {
      case 'APPROVED':
        return AppColors.statusPresentBg;
      case 'REJECTED':
        return AppColors.statusAbsentBg;
      case 'SUBMITTED':
      case 'UNDER_REVIEW':
        return AppColors.statusLateBg;
      default:
        return AppColors.surfaceMuted;
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
    final statusBg = _getStatusBg(request.status);

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  request.title,
                  style: AppTypography.cardTitle,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  _getStatusLabel(request.status),
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            request.description,
            style: AppTypography.body,
          ),
          const SizedBox(height: 12),
          const Divider(height: 1),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textMuted),
              const SizedBox(width: 4),
              Text(
                request.createdAt.toIso8601String().split('T')[0],
                style: AppTypography.label,
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                decoration: BoxDecoration(
                  color: AppColors.surfaceMuted,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Text(
                  'أولوية: ${request.priority}',
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 11,
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ],
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
            subtitle: 'ستظهر هنا المهام والتكليفات الإدارية المسندة لك من قبل الإدارة',
            icon: Icons.check_circle_outline,
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
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
        message: 'فشل تحميل المهام',
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

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 12),
      borderColor: task.isOverdue
          ? AppColors.statusAbsent
          : (isCompleted ? AppColors.statusPresent : AppColors.border),
      padding: EdgeInsets.zero,
      child: Theme(
        data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          title: Row(
            children: [
              Expanded(
                child: Text(
                  task.title,
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
              ),
              if (task.isOverdue)
                Container(
                  margin: const EdgeInsets.only(right: 8),
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: AppColors.statusAbsentBg,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: const Text(
                    'متأخر',
                    style: TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      color: AppColors.statusAbsent,
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
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 12,
                    color: task.isOverdue ? AppColors.statusAbsent : AppColors.textMuted,
                  ),
                )
              : null,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (task.description != null && task.description!.isNotEmpty) ...[
                    Text(
                      task.description!,
                      style: AppTypography.body,
                    ),
                    const Divider(height: 20),
                  ],
                  const Text(
                    'سجل المتابعة والإنجاز:',
                    style: TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                  const SizedBox(height: 8),
                  if (task.followUps.isEmpty)
                    const Text(
                      'لا توجد ملاحظات متابعة سابقة',
                      style: AppTypography.label,
                    )
                  else
                    ...task.followUps.map(
                      (f) => Padding(
                        padding: const EdgeInsets.only(bottom: 6),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Icon(Icons.circle, size: 6, color: AppColors.primary),
                            const SizedBox(width: 6),
                            Expanded(
                              child: Text(
                                '${f.note} (${f.createdAt.toIso8601String().split('T')[0]})',
                                style: AppTypography.secondary,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  const SizedBox(height: 12),
                  ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    icon: const Icon(Icons.add_comment_outlined, size: 18),
                    label: const Text(
                      'إضافة تقدم / إكمال المهمة',
                      style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold),
                    ),
                    onPressed: () => _showAddFollowUpModal(context, ref),
                  ),
                ],
              ),
            ),
          ],
        ),
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: const Text(
            'تسجيل تقدم بالمهمة',
            style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: noteCtrl,
                maxLines: 3,
                style: const TextStyle(fontFamily: AppTypography.fontFamily),
                decoration: const InputDecoration(
                  labelText: 'ملاحظة الإنجاز أو المتابعة',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text(
                  'تعليم المهمة كمكتملة',
                  style: TextStyle(fontFamily: AppTypography.fontFamily),
                ),
                value: markComplete,
                activeColor: AppColors.primary,
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
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
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
            subtitle: 'ستظهر هنا التعاميم والقرارات الإدارية الصادرة من إدارة المجمع',
            icon: Icons.gavel,
          );
        }
        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.refresh(myAdminDecisionsProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: decisions.length,
            itemBuilder: (context, index) {
              final dec = decisions[index];
              return ModernCard(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(AppRadius.sm),
                          ),
                          child: Text(
                            dec.decisionNumber,
                            style: const TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              color: AppColors.primaryDark,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          dec.issuedAt.toIso8601String().split('T')[0],
                          style: AppTypography.label,
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      dec.title,
                      style: AppTypography.cardTitle,
                    ),
                    const SizedBox(height: 6),
                    Text(
                      dec.content,
                      style: AppTypography.body,
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل القرارات الإدارية...'),
      error: (err, _) => ErrorView(
        message: 'فشل تحميل القرارات',
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
  String? _attachedFileName;
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
                style: TextStyle(
                  fontFamily: AppTypography.fontFamily,
                  fontWeight: FontWeight.bold,
                  fontSize: 18,
                  color: AppColors.textPrimary,
                ),
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
                style: const TextStyle(fontFamily: AppTypography.fontFamily),
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
                style: const TextStyle(fontFamily: AppTypography.fontFamily),
                decoration: const InputDecoration(
                  labelText: 'تفاصيل الطلب والمبررات',
                  border: OutlineInputBorder(),
                ),
                validator: (val) => val == null || val.trim().isEmpty ? 'يرجى كتابة التفاصيل' : null,
              ),
              const SizedBox(height: 12),
              ListTile(
                contentPadding: EdgeInsets.zero,
                leading: const Icon(Icons.attach_file, color: AppColors.primary),
                title: Text(
                  _attachedFileName != null
                      ? 'المرفق: $_attachedFileName'
                      : 'إرفاق تقرير أو مستند رسمي من الجهاز (اختياري)',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 13,
                    color: _attachedFileName != null ? AppColors.primaryDark : AppColors.textSecondary,
                    fontWeight: _attachedFileName != null ? FontWeight.bold : FontWeight.normal,
                  ),
                ),
                trailing: _attachedFileName != null
                    ? IconButton(
                        icon: const Icon(Icons.close, color: Colors.red),
                        onPressed: () => setState(() {
                          _attachedFileName = null;
                          _uploadedUrl = null;
                        }),
                      )
                    : TextButton.icon(
                        icon: const Icon(Icons.upload_file, size: 18),
                        label: const Text('اختيار ملف'),
                        onPressed: () async {
                          final messenger = ScaffoldMessenger.of(context);
                          try {
                            final picked = await AttachmentPickerService.pickAttachment();
                            if (picked == null) return;

                            messenger.showSnackBar(
                              SnackBar(content: Text('جاري رفع ${picked.name}...'), duration: const Duration(seconds: 1)),
                            );

                            final apiClient = ref.read(apiClientProvider);
                            final uploaded = await AttachmentPickerService.uploadAttachment(
                              file: picked,
                              apiClient: apiClient,
                            );

                            if (mounted) {
                              setState(() {
                                _attachedFileName = uploaded.fileName;
                                _uploadedUrl = uploaded.url;
                              });
                            }
                          } catch (e) {
                            messenger.showSnackBar(
                              SnackBar(content: Text('فشل اختيار/رفع الملف: $e'), backgroundColor: Colors.red),
                            );
                          }
                        },
                      ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                  ),
                  onPressed: _isLoading ? null : _submit,
                  child: _isLoading
                      ? const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Text(
                          'إرسال الطلب للاعتماد',
                          style: TextStyle(
                            fontFamily: AppTypography.fontFamily,
                            fontWeight: FontWeight.bold,
                            fontSize: 15,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  String? _uploadedUrl;

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isLoading = true);

    try {
      final service = ref.read(administrativeServiceProvider);
      final descText = _attachedFileName != null
          ? '${_descCtrl.text.trim()}\n[مرفق رسمي: $_attachedFileName (${_uploadedUrl ?? ""})]'
          : _descCtrl.text.trim();

      await service.createRequest(
        title: _titleCtrl.text.trim(),
        description: descText,
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
