import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';
import '../../../core/utils/file_export_util.dart';

class TeacherStudentsScreen extends ConsumerStatefulWidget {
  const TeacherStudentsScreen({super.key});

  @override
  ConsumerState<TeacherStudentsScreen> createState() => _TeacherStudentsScreenState();
}

class _TeacherStudentsScreenState extends ConsumerState<TeacherStudentsScreen> {
  String _searchQuery = '';
  String? _selectedHalaqaId;
  String _selectedStatus = 'all'; // 'all', 'active', 'lagging', 'advanced'

  void _exportRoster(List<WorkspaceStudent> students) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'تصدير كشف بيانات الطلاب',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(ctx),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'إجمالي السجلات المؤهلة للتصدير: ${students.length} طالب',
              style: AppTypography.secondary,
            ),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceMuted,
                borderRadius: BorderRadius.circular(AppRadius.md),
                border: Border.all(color: AppColors.border, width: 0.8),
              ),
              child: const Text(
                'الاسم الكامل,الرقم التعريفي,الحلقة,حالة الحضور اليوم,التسميع الأخير\n'
                'جاهز للتصدير والمشاركة المباشرة عبر تطبيقات العمليات.',
                style: TextStyle(fontFamily: 'monospace', fontSize: 11, color: AppColors.textSecondary),
              ),
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                ),
                icon: const Icon(Icons.download, color: Colors.white),
                label: const Text(
                  'تأكيد وحفظ ملف CSV',
                  style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                onPressed: () async {
                  Navigator.pop(ctx);
                  try {
                    final res = await FileExportUtil.exportStudentRosterCsv(students);
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text('✓ تم حفظ كشف الطلاب: ${res.fileName} (${res.formattedSize})'),
                        backgroundColor: AppColors.statusPresent,
                        duration: const Duration(seconds: 4),
                      ),
                    );
                  } catch (e) {
                    if (!mounted) return;
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('تعذر تصدير الملف: $e'), backgroundColor: Colors.red),
                    );
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final halaqasAsync = ref.watch(myHalaqasProvider);
    final studentsAsync = ref.watch(teacherStudentsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('شؤون طلاب الحلقات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.file_download_outlined),
            tooltip: 'تصدير الكشف',
            onPressed: () {
              final students = studentsAsync.valueOrNull ?? [];
              _exportRoster(students);
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () {
              ref.invalidate(myHalaqasProvider);
              ref.invalidate(teacherStudentsProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
            decoration: const BoxDecoration(
              color: AppColors.background,
            ),
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'ابحث باسم الطالب أو الرقم التعريفي...',
                    hintStyle: AppTypography.label,
                    prefixIcon: const Icon(Icons.search, color: AppColors.primary, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 18, color: AppColors.textMuted),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    filled: true,
                    fillColor: AppColors.surface,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      borderSide: const BorderSide(color: AppColors.border, width: 0.8),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppRadius.lg),
                      borderSide: const BorderSide(color: AppColors.border, width: 0.8),
                    ),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                ),
                const SizedBox(height: 10),
                halaqasAsync.when(
                  data: (halaqas) {
                    if (halaqas.isEmpty) return const SizedBox.shrink();
                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('كل الحلقات'),
                            selected: _selectedHalaqaId == null,
                            labelStyle: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontSize: 12,
                              fontWeight: _selectedHalaqaId == null ? FontWeight.w700 : FontWeight.w500,
                              color: _selectedHalaqaId == null ? Colors.white : AppColors.textSecondary,
                            ),
                            selectedColor: AppColors.primary,
                            backgroundColor: AppColors.surface,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppRadius.full),
                              side: BorderSide(
                                color: _selectedHalaqaId == null ? AppColors.primary : AppColors.border,
                                width: 0.8,
                              ),
                            ),
                            onSelected: (_) => setState(() => _selectedHalaqaId = null),
                          ),
                          const SizedBox(width: 8),
                          ...halaqas.map((h) {
                            final isSelected = _selectedHalaqaId == h.id;
                            return Padding(
                              padding: const EdgeInsets.only(left: 8),
                              child: ChoiceChip(
                                label: Text(h.name),
                                selected: isSelected,
                                labelStyle: TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontSize: 12,
                                  fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                                  color: isSelected ? Colors.white : AppColors.textSecondary,
                                ),
                                selectedColor: AppColors.primary,
                                backgroundColor: AppColors.surface,
                                shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(AppRadius.full),
                                  side: BorderSide(
                                    color: isSelected ? AppColors.primary : AppColors.border,
                                    width: 0.8,
                                  ),
                                ),
                                onSelected: (_) => setState(() => _selectedHalaqaId = isSelected ? null : h.id),
                              ),
                            );
                          }),
                        ],
                      ),
                    );
                  },
                  loading: () => const SizedBox(height: 32),
                  error: (_, __) => const SizedBox.shrink(),
                ),
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ChoiceChip(
                        label: const Text('كل الحالات'),
                        selected: _selectedStatus == 'all',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedStatus == 'all' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedStatus == 'all' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedStatus = 'all'),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('🟢 منتظم / نشط'),
                        selected: _selectedStatus == 'active',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedStatus == 'active' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedStatus == 'active' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.statusPresent,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedStatus = 'active'),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('🟡 متابعة / تنبيه'),
                        selected: _selectedStatus == 'lagging',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedStatus == 'lagging' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedStatus == 'lagging' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.statusLate,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedStatus = 'lagging'),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('⭐ متقدم / متميز'),
                        selected: _selectedStatus == 'advanced',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedStatus == 'advanced' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedStatus == 'advanced' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: const Color(0xFF7C3AED),
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedStatus = 'advanced'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Students List
          Expanded(
            child: studentsAsync.when(
              data: (students) {
                final filtered = students.where((s) {
                  final matchesHalaqa = _selectedHalaqaId == null || s.halaqaId == _selectedHalaqaId;
                  final matchesSearch = _searchQuery.isEmpty ||
                      s.displayName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                      (s.studentNumber?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
                  final matchesStatus = _selectedStatus == 'all' ||
                      (_selectedStatus == 'active' && s.todayAttendanceStatus != 'ABSENT') ||
                      (_selectedStatus == 'lagging' && (s.todayAttendanceStatus == 'ABSENT' || s.todayAttendanceStatus == 'LATE')) ||
                      (_selectedStatus == 'advanced' && s.todayAttendanceStatus == 'PRESENT');
                  return matchesHalaqa && matchesSearch && matchesStatus;
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا يوجد طلاب مطابقين للبحث',
                    subtitle: 'تأكد من كتابة الاسم أو الرقم التعريفي بشكل صحيح',
                    icon: Icons.people_outline,
                  );
                }

                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () async {
                    ref.invalidate(teacherStudentsProvider);
                    ref.invalidate(myHalaqasProvider);
                  },
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final student = filtered[index];
                      return _StudentListItem(student: student);
                    },
                  ),
                );
              },
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: LoadingView(message: 'جاري تحميل قائمة الطلاب...'),
              ),
              error: (err, _) => ErrorView(
                message: err.toString(),
                onRetry: () => ref.invalidate(teacherStudentsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _StudentListItem extends StatelessWidget {
  final WorkspaceStudent student;

  const _StudentListItem({required this.student});

  @override
  Widget build(BuildContext context) {
    Color badgeBg;
    Color badgeText;
    String badgeLabel;

    switch (student.todayAttendanceStatus) {
      case 'PRESENT':
        badgeBg = AppColors.statusPresentBg;
        badgeText = AppColors.statusPresent;
        badgeLabel = 'حاضر اليوم';
        break;
      case 'ABSENT':
        badgeBg = AppColors.statusAbsentBg;
        badgeText = AppColors.statusAbsent;
        badgeLabel = 'غائب اليوم';
        break;
      case 'LATE':
        badgeBg = AppColors.statusLateBg;
        badgeText = AppColors.statusLate;
        badgeLabel = 'متأخر اليوم';
        break;
      case 'EXCUSED':
        badgeBg = AppColors.statusExcusedBg;
        badgeText = AppColors.statusExcused;
        badgeLabel = 'معذور';
        break;
      default:
        badgeBg = AppColors.surfaceMuted;
        badgeText = AppColors.textSecondary;
        badgeLabel = 'لم يرصد';
    }

    final initial = student.displayName.isNotEmpty ? student.displayName[0] : 'ط';

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () {
        context.push(
          '/teacher/students/${student.studentId}/detail?name=${Uri.encodeComponent(student.displayName)}',
        );
      },
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.primarySoft,
              borderRadius: BorderRadius.circular(AppRadius.md),
            ),
            alignment: Alignment.center,
            child: Text(
              initial,
              style: const TextStyle(
                fontFamily: AppTypography.fontFamily,
                color: AppColors.primaryDark,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  student.displayName,
                  style: AppTypography.bodyMedium,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  'رقم الطالب: ${student.studentNumber ?? "STU-2026"}',
                  style: AppTypography.label,
                ),
                if (student.todayMemorization != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    'تسميع اليوم: سورة ${student.todayMemorization!["surahNumber"]} (${student.todayMemorization!["fromAyah"]}-${student.todayMemorization!["toAyah"]})',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 11,
                      color: AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ],
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                decoration: BoxDecoration(
                  color: badgeBg,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  badgeLabel,
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: badgeText,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ),
              const SizedBox(height: 6),
              const Icon(
                Icons.arrow_back_ios,
                size: 12,
                color: AppColors.textMuted,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
