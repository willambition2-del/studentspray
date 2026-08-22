import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../../auth/providers/auth_provider.dart';
import '../../../core/files/attachment_picker_service.dart';
import '../models/parent_models.dart';
import '../providers/parent_provider.dart';

class ParentRequestsScreen extends ConsumerStatefulWidget {
  const ParentRequestsScreen({super.key});

  @override
  ConsumerState<ParentRequestsScreen> createState() => _ParentRequestsScreenState();
}

class _ParentRequestsScreenState extends ConsumerState<ParentRequestsScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final homeAsync = ref.watch(parentMobileHomeProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('مركز الطلبات والتواصل الرسمي'),
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
            Tab(text: 'تقديم طلب جديد', icon: Icon(Icons.add_circle_outline, size: 18)),
            Tab(text: 'سجل وتتبع الطلبات', icon: Icon(Icons.history, size: 18)),
          ],
        ),
      ),
      body: homeAsync.when(
        data: (snapshot) {
          final children = snapshot.children;
          return TabBarView(
            controller: _tabController,
            children: [
              _NewRequestFormTab(children: children, onSubmitted: () => _tabController.animateTo(1)),
              _RequestHistoryTab(children: children),
            ],
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل بوابة الطلبات...'),
        error: (err, _) => ErrorView(
          message: 'تعذر تحميل بوابة الطلبات: $err',
          onRetry: () => ref.refresh(parentMobileHomeProvider),
        ),
      ),
    );
  }
}

class _NewRequestFormTab extends ConsumerStatefulWidget {
  final List<ParentChildSummary> children;
  final VoidCallback onSubmitted;

  const _NewRequestFormTab({required this.children, required this.onSubmitted});

  @override
  ConsumerState<_NewRequestFormTab> createState() => _NewRequestFormTabState();
}

class _NewRequestFormTabState extends ConsumerState<_NewRequestFormTab> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedChildId;
  String _requestType = 'EDUCATIONAL_SUPPORT';
  String _priority = 'NORMAL';
  final _titleController = TextEditingController();
  final _detailsController = TextEditingController();
  DateTime? _preferredMeetingDate;
  String? _attachedFileName;
  String? _uploadedUrl;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    if (widget.children.isNotEmpty) {
      _selectedChildId = widget.children.first.id;
    }
  }

  @override
  void dispose() {
    _titleController.dispose();
    _detailsController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSubmitting = true);

    try {
      final apiClient = ref.read(apiClientProvider);
      final detailsText = _attachedFileName != null
          ? '${_detailsController.text.trim()}\n[مرفق رسمي: $_attachedFileName (${_uploadedUrl ?? ""})]'
          : _detailsController.text.trim();

      await apiClient.post('/parent/me/requests', data: {
        'studentId': _selectedChildId,
        'subject': _titleController.text.trim(),
        'details': detailsText,
        'requestType': _requestType,
        'priority': _priority,
        if (_preferredMeetingDate != null)
          'meetingDate': DateFormat('yyyy-MM-dd').format(_preferredMeetingDate!),
      });

      ref.invalidate(parentRequestsProvider);

      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('✓ تم تقديم طلبك الرسمي وحفظه في السيرفر بنجاح — ستتم مراجعته من قبل إدارة الملتقى'),
            backgroundColor: AppColors.statusPresent,
          ),
        );
        _titleController.clear();
        _detailsController.clear();
        _attachedFileName = null;
        _uploadedUrl = null;
        widget.onSubmitted();
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر تقديم الطلب: $e'), backgroundColor: Colors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'تفاصيل الطلب الرسمي',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 14),

                // 1. Child Selector
                if (widget.children.isNotEmpty) ...[
                  DropdownButtonFormField<String>(
                    initialValue: _selectedChildId,
                    decoration: const InputDecoration(
                      labelText: 'الابن المعني بالطلب *',
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.person_outline),
                    ),
                    items: widget.children
                        .map((c) => DropdownMenuItem(
                              value: c.id,
                              child: Text('${c.name} (${c.halaqaName})'),
                            ))
                        .toList(),
                    onChanged: (val) => setState(() => _selectedChildId = val),
                  ),
                  const SizedBox(height: 14),
                ],

                // 2. Request Type
                DropdownButtonFormField<String>(
                  initialValue: _requestType,
                  decoration: const InputDecoration(
                    labelText: 'نوع الطلب *',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.category_outlined),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'EDUCATIONAL_SUPPORT', child: Text('دعم تعليمي / خطة علاجية')),
                    DropdownMenuItem(value: 'MEETING_REQUEST', child: Text('طلب موعد اجتماع مع المعلم')),
                    DropdownMenuItem(value: 'GENERAL_INQUIRY', child: Text('استفسار عام للإدارة')),
                    DropdownMenuItem(value: 'DATA_UPDATE', child: Text('طلب تحديث بيانات الابن')),
                  ],
                  onChanged: (val) => setState(() => _requestType = val ?? 'EDUCATIONAL_SUPPORT'),
                ),
                const SizedBox(height: 14),

                // 3. Subject Title
                TextFormField(
                  controller: _titleController,
                  decoration: const InputDecoration(
                    labelText: 'عنوان الطلب أو الموضوع *',
                    border: OutlineInputBorder(),
                    hintText: 'مثال: طلب جلسة تقوية في مخارج الحروف...',
                  ),
                  validator: (v) => v == null || v.trim().isEmpty ? 'يرجى كتابة عنوان الطلب' : null,
                ),
                const SizedBox(height: 14),

                // 4. Meeting date picker if meeting request
                if (_requestType == 'MEETING_REQUEST') ...[
                  ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                      side: const BorderSide(color: AppColors.border),
                    ),
                    leading: const Icon(Icons.calendar_month, color: AppColors.primary),
                    title: Text(
                      _preferredMeetingDate != null
                          ? 'الموعد المفضل: ${_preferredMeetingDate!.toIso8601String().substring(0, 10)}'
                          : 'حدد الموعد المناسب للاجتماع',
                    ),
                    trailing: const Icon(Icons.edit_calendar),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: DateTime.now().add(const Duration(days: 2)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now().add(const Duration(days: 30)),
                      );
                      if (picked != null) {
                        setState(() => _preferredMeetingDate = picked);
                      }
                    },
                  ),
                  const SizedBox(height: 14),
                ],

                // 5. Details
                TextFormField(
                  controller: _detailsController,
                  decoration: const InputDecoration(
                    labelText: 'شرح وتفاصيل الطلب *',
                    border: OutlineInputBorder(),
                    hintText: 'اكتب هنا كافة الملاحظات والتفاصيل التي ترغب بإيصالها للإدارة والمعلم...',
                  ),
                  maxLines: 4,
                  validator: (v) => v == null || v.trim().isEmpty ? 'يرجى توضيح تفاصيل الطلب' : null,
                ),
                const SizedBox(height: 14),

                // 6. Priority
                DropdownButtonFormField<String>(
                  initialValue: _priority,
                  decoration: const InputDecoration(
                    labelText: 'مستوى الأهمية والسرعة',
                    border: OutlineInputBorder(),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'NORMAL', child: Text('عادية (خلال 48 ساعة)')),
                    DropdownMenuItem(value: 'HIGH', child: Text('عاجلة (خلال 24 ساعة)')),
                    DropdownMenuItem(value: 'URGENT', child: Text('طارئة جداً')),
                  ],
                  onChanged: (val) => setState(() => _priority = val ?? 'NORMAL'),
                ),
                const SizedBox(height: 14),

                // 7. Attachment Picker
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.attach_file, color: AppColors.primary),
                  title: Text(
                    _attachedFileName != null
                        ? 'المرفق: $_attachedFileName'
                        : 'إرفاق تقرير طبي أو وثيقة رسمية من الجهاز (اختياري)',
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
                const SizedBox(height: 20),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                    ),
                    icon: _isSubmitting
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.send_rounded),
                    label: const Text(
                      'إرسال الطلب الرسمي',
                      style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                    onPressed: _isSubmitting ? null : _submit,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _RequestHistoryTab extends ConsumerWidget {
  final List<ParentChildSummary> children;

  const _RequestHistoryTab({required this.children});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(parentRequestsProvider);

    return requestsAsync.when(
      data: (requests) {
        if (requests.isEmpty) {
          return const EmptyStateView(
            title: 'لا توجد طلبات سابقة',
            subtitle: 'يمكنك تقديم طلب جديد عبر تبويب تقديم طلب جديد',
            icon: Icons.assignment_outlined,
          );
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.refresh(parentRequestsProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: requests.length,
            itemBuilder: (context, index) {
              final req = requests[index];
              final child = children.firstWhere(
                (c) => c.id == req.studentId,
                orElse: () => children.isNotEmpty
                    ? children.first
                    : ParentChildSummary(
                        id: '',
                        name: 'الابن',
                        relationship: 'ولي أمر',
                        isPrimary: false,
                        halaqaName: 'غير محدد',
                        teacherName: 'غير محدد',
                        attendanceRate: 100,
                      ),
              );

              return Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: _buildRequestCard(
                  context,
                  title: req.title,
                  childName: child.name,
                  type: req.priority == 'URGENT' ? 'عاجل' : 'طلب رسمي',
                  date: req.createdAt.length >= 10 ? req.createdAt.substring(0, 10) : 'اليوم',
                  status: req.status,
                  statusLabel: req.statusLabel,
                  adminResponse: req.adminResponse ?? 'طلبك قيد المتابعة من قبل إدارة الملتقى.',
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل سجل الطلبات...'),
      error: (err, _) => ErrorView(
        message: 'تعذر تحميل سجل الطلبات: $err',
        onRetry: () => ref.refresh(parentRequestsProvider),
      ),
    );
  }

  Widget _buildRequestCard(
    BuildContext context, {
    required String title,
    required String childName,
    required String type,
    required String date,
    required String status,
    required String statusLabel,
    required String adminResponse,
  }) {
    final isDone = status == 'COMPLETED';

    return ModernCard(
      padding: const EdgeInsets.all(14),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  title,
                  style: AppTypography.cardTitle,
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: isDone ? AppColors.statusPresentBg : AppColors.statusLateBg,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  statusLabel,
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: isDone ? AppColors.statusPresent : AppColors.statusLate,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text('الابن: $childName • النوع: $type • التاريخ: $date', style: AppTypography.secondary),
          const SizedBox(height: 10),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(AppRadius.md),
              border: Border.all(color: AppColors.border, width: 0.8),
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.admin_panel_settings_outlined, size: 18, color: AppColors.primary),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'رد الإدارة: $adminResponse',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 12,
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
