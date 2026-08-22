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

class TeacherExamsScreen extends ConsumerStatefulWidget {
  const TeacherExamsScreen({super.key});

  @override
  ConsumerState<TeacherExamsScreen> createState() => _TeacherExamsScreenState();
}

class _TeacherExamsScreenState extends ConsumerState<TeacherExamsScreen> {
  String _searchQuery = '';
  String _selectedType = 'all';

  @override
  Widget build(BuildContext context) {
    final examsAsync = ref.watch(teacherExamsProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الاختبارات ورصد الدرجات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () => ref.invalidate(teacherExamsProvider),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 10),
            color: AppColors.background,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'ابحث باسم الاختبار أو المنهج...',
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
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
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
                const SizedBox(height: 8),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  child: Row(
                    children: [
                      ChoiceChip(
                        label: const Text('كل الاختبارات'),
                        selected: _selectedType == 'all',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedType == 'all' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedType == 'all' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedType = 'all'),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('اختبارات شهرية'),
                        selected: _selectedType == 'MONTHLY',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedType == 'MONTHLY' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedType == 'MONTHLY' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedType = 'MONTHLY'),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('اختبارات فصلية'),
                        selected: _selectedType == 'TERM',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedType == 'TERM' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedType == 'TERM' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedType = 'TERM'),
                      ),
                      const SizedBox(width: 6),
                      ChoiceChip(
                        label: const Text('اختبارات نهائية'),
                        selected: _selectedType == 'FINAL',
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 11,
                          fontWeight: _selectedType == 'FINAL' ? FontWeight.w700 : FontWeight.w500,
                          color: _selectedType == 'FINAL' ? Colors.white : AppColors.textSecondary,
                        ),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.full)),
                        onSelected: (_) => setState(() => _selectedType = 'FINAL'),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              color: AppColors.primary,
              onRefresh: () async => ref.invalidate(teacherExamsProvider),
              child: examsAsync.when(
                data: (exams) {
                  final filtered = exams.where((e) {
                    final matchesSearch = _searchQuery.isEmpty ||
                        e.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                        (e.curriculum?.toLowerCase().contains(_searchQuery.toLowerCase()) ?? false);
                    final matchesType = _selectedType == 'all' || e.examType == _selectedType;
                    return matchesSearch && matchesType;
                  }).toList();

                  if (filtered.isEmpty) {
                    return const EmptyStateView(
                      title: 'لا توجد اختبارات مطابقة',
                      subtitle: 'تأكد من شروط البحث أو الفلاتر المحددة',
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final exam = filtered[index];
                      return _buildExamCard(context, exam);
                    },
                  );
                },
                loading: () => const LoadingView(message: 'جاري تحميل الاختبارات...'),
                error: (err, _) => ErrorView(
                  message: err.toString(),
                  onRetry: () => ref.invalidate(teacherExamsProvider),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExamCard(BuildContext context, TeacherExamItem exam) {
    return ModernCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  exam.title,
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(AppRadius.full),
                ),
                child: Text(
                  exam.examTypeLabel,
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: AppColors.primaryDark,
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          if (exam.curriculum != null) ...[
            Text(
              'المنهج: ${exam.curriculum}',
              style: AppTypography.secondary,
            ),
            const SizedBox(height: 8),
          ],
          Wrap(
            spacing: 8,
            runSpacing: 6,
            children: [
              _buildInfoBadge('الدرجة العظمى: ${exam.maxScore.toStringAsFixed(0)}', AppColors.textSecondary, AppColors.surfaceMuted),
              _buildInfoBadge('درجة النجاح: ${exam.passScore.toStringAsFixed(0)}', AppColors.statusPresent, AppColors.statusPresentBg),
              if (exam.criteria.isNotEmpty)
                _buildInfoBadge('${exam.criteria.length} معايير تفصيلية', AppColors.info, AppColors.infoSoft),
            ],
          ),
          const SizedBox(height: 14),
          const Divider(height: 1),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                exam.scheduledDate != null
                    ? 'التاريخ: ${exam.scheduledDate!.toIso8601String().substring(0, 10)}'
                    : 'حالة الاختبار: ${exam.status}',
                style: AppTypography.label,
              ),
              InkWell(
                onTap: () {
                  context.push(
                    '/teacher/exams/${exam.id}/grading?title=${Uri.encodeComponent(exam.title)}&maxScore=${exam.maxScore}&passScore=${exam.passScore}',
                  );
                },
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                  decoration: BoxDecoration(
                    color: AppColors.primary,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.fact_check_outlined, size: 16, color: Colors.white),
                      SizedBox(width: 6),
                      Text(
                        'رصد الدرجات',
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoBadge(String text, Color color, Color bgColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        text,
        style: TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: color,
        ),
      ),
    );
  }
}
