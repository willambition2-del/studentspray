import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentPlanScreen extends ConsumerStatefulWidget {
  const StudentPlanScreen({super.key});

  @override
  ConsumerState<StudentPlanScreen> createState() => _StudentPlanScreenState();
}

class _StudentPlanScreenState extends ConsumerState<StudentPlanScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedFilterIndex = 0; // 0: All, 1: Pending, 2: Completed

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
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الخطة التعليمية'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold),
          tabs: const [
            Tab(text: 'الخطة الحالية'),
            Tab(text: 'سجل الخطط السابقة'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildCurrentPlanTab(),
          _buildPlanHistoryTab(),
        ],
      ),
    );
  }

  Widget _buildCurrentPlanTab() {
    final planAsync = ref.watch(studentPlanProvider);

    return planAsync.when(
      data: (plans) {
        if (plans.isEmpty) {
          return const EmptyStateView(
            title: 'لا توجد خطة تعليمية نشطة',
            subtitle: 'سيتم تعيين خطتك التعليمية من قبل معلم الحلقة قريباً',
            icon: Icons.assignment_outlined,
          );
        }

        final plan = plans.first;
        final allItems = plan.items;
        final pendingItems = allItems.where((i) => i['status'] != 'COMPLETED').toList();
        final completedItems = allItems.where((i) => i['status'] == 'COMPLETED').toList();

        final displayedItems = _selectedFilterIndex == 1
            ? pendingItems
            : _selectedFilterIndex == 2
                ? completedItems
                : allItems;

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.refresh(studentPlanProvider.future),
          child: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Header Plan Card
              ModernCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            plan.name,
                            style: AppTypography.cardTitle,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(AppRadius.full),
                          ),
                          child: Text(
                            plan.type == 'HIFZ' ? 'حفظ جديد' : 'مراجعة',
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
                    const SizedBox(height: 12),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      child: LinearProgressIndicator(
                        value: (plan.progressPercentage / 100).clamp(0.0, 1.0),
                        backgroundColor: AppColors.surfaceMuted,
                        color: AppColors.primary,
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'المنجز: ${plan.completedItems} من ${plan.totalItems} مستهدف',
                          style: AppTypography.label,
                        ),
                        Text(
                          '${plan.progressPercentage.toStringAsFixed(1)}%',
                          style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Filter Chips
              Row(
                children: [
                  _buildFilterChip('الكل (${allItems.length})', 0),
                  const SizedBox(width: 8),
                  _buildFilterChip('المستهدفات (${pendingItems.length})', 1),
                  const SizedBox(width: 8),
                  _buildFilterChip('المنجز (${completedItems.length})', 2),
                ],
              ),
              const SizedBox(height: 14),

              // Items List
              if (displayedItems.isEmpty)
                const EmptyStateView(
                  title: 'لا توجد عناصر في هذا القسم',
                  subtitle: 'تواصل مع معلمك لإضافة مستهدفات الخطة التعليمية',
                  icon: Icons.check_circle_outline,
                )
              else
                ...displayedItems.map((item) {
                  final isDone = item['status'] == 'COMPLETED';
                  return _buildPlanItemCard(item, isDone);
                }),
            ],
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل الخطة التعليمية...'),
      error: (err, stack) => ErrorView(
        message: 'تعذر تحميل الخطة التعليمية',
        onRetry: () => ref.refresh(studentPlanProvider),
      ),
    );
  }

  Widget _buildPlanHistoryTab() {
    final historyAsync = ref.watch(studentPlanHistoryProvider);

    return historyAsync.when(
      data: (plans) {
        if (plans.isEmpty) {
          return const EmptyStateView(
            title: 'لا يوجد سجل خطط سابقة',
            subtitle: 'سيتم أرشفة الخطط المكتملة والسابقة تلقائياً عند انتهاء فترتها الزمنية',
            icon: Icons.history_edu_outlined,
          );
        }

        return RefreshIndicator(
          color: AppColors.primary,
          onRefresh: () async => ref.refresh(studentPlanHistoryProvider.future),
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: plans.length,
            itemBuilder: (context, index) {
              final p = plans[index] as Map<String, dynamic>;
              final name = p['name'] as String? ?? 'خطة تعليمية';
              final type = p['type'] as String? ?? 'مقرر';
              final status = p['status'] as String? ?? 'COMPLETED';
              final pct = (p['progressPercentage'] as num?)?.toDouble() ?? 100.0;
              final totalItems = (p['totalItems'] as num?)?.toInt() ?? 0;
              final completedItems = (p['completedItems'] as num?)?.toInt() ?? 0;
              final halaqaName = p['halaqaName'] as String? ?? 'الحلقة القرآنية';

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
                            name,
                            style: AppTypography.cardTitle,
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: status == 'ACTIVE' ? AppColors.statusPresentBg : AppColors.surfaceMuted,
                            borderRadius: BorderRadius.circular(AppRadius.full),
                          ),
                          child: Text(
                            status == 'ACTIVE' ? 'نشطة حالياً' : 'مكتملة ومؤرشفة',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: status == 'ACTIVE' ? AppColors.statusPresent : AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      'الحلقة: $halaqaName — النوع: $type',
                      style: AppTypography.secondary,
                    ),
                    const SizedBox(height: 10),
                    ClipRRect(
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      child: LinearProgressIndicator(
                        value: (pct / 100).clamp(0.0, 1.0),
                        backgroundColor: AppColors.surfaceMuted,
                        color: AppColors.primary,
                        minHeight: 6,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'الإنجاز: $completedItems من $totalItems مستهدف',
                          style: AppTypography.label,
                        ),
                        Text(
                          '${pct.toStringAsFixed(0)}%',
                          style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        );
      },
      loading: () => const LoadingView(message: 'جاري تحميل سجل الخطط السابقة...'),
      error: (err, _) => ErrorView(
        message: 'تعذر تحميل سجل الخطط',
        onRetry: () => ref.refresh(studentPlanHistoryProvider),
      ),
    );
  }

  Widget _buildFilterChip(String label, int index) {
    final isSelected = _selectedFilterIndex == index;
    return Expanded(
      child: InkWell(
        onTap: () => setState(() => _selectedFilterIndex = index),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primary : AppColors.surface,
            borderRadius: BorderRadius.circular(AppRadius.md),
            border: Border.all(color: isSelected ? AppColors.primary : AppColors.border, width: 0.8),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontFamily: AppTypography.fontFamily,
              fontWeight: FontWeight.bold,
              fontSize: 11,
              color: isSelected ? Colors.white : AppColors.textSecondary,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPlanItemCard(Map<String, dynamic> item, bool isCompleted) {
    final surahNumber = item['surahNumber'];
    final fromAyah = item['fromAyah'];
    final toAyah = item['toAyah'];

    return ModernCard(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(12),
      child: Row(
        children: [
          Icon(
            isCompleted ? Icons.check_circle : Icons.radio_button_unchecked,
            color: isCompleted ? AppColors.statusPresent : AppColors.textMuted,
            size: 20,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  surahNumber != null ? 'سورة رقم $surahNumber (الآيات $fromAyah - $toAyah)' : 'مقرر تعليمي',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontWeight: FontWeight.bold,
                    fontSize: 14,
                    color: isCompleted ? AppColors.textSecondary : AppColors.textPrimary,
                    decoration: isCompleted ? TextDecoration.lineThrough : null,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  item['notes'] as String? ?? (isCompleted ? 'تم الإنجاز بنجاح' : 'مستهدف قادم'),
                  style: AppTypography.label,
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: isCompleted ? AppColors.statusPresentBg : AppColors.surfaceMuted,
              borderRadius: BorderRadius.circular(AppRadius.full),
            ),
            child: Text(
              isCompleted ? 'تم الإنجاز' : 'مستهدف',
              style: TextStyle(
                fontFamily: AppTypography.fontFamily,
                fontSize: 11,
                color: isCompleted ? AppColors.statusPresent : AppColors.textSecondary,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
