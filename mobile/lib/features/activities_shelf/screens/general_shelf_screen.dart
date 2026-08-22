import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/activities_shelf_provider.dart';

class GeneralShelfScreen extends ConsumerWidget {
  const GeneralShelfScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sectionsAsync = ref.watch(shelfSectionsProvider);
    final itemsAsync = ref.watch(shelfItemsProvider);
    final selectedSectionId = ref.watch(selectedShelfSectionIdProvider);

    final dateFormat = DateFormat('yyyy/MM/dd', 'ar');

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الرف العام والمنشورات'),
        centerTitle: true,
      ),
      body: Column(
        children: [
          // Horizontal Section Selector
          sectionsAsync.when(
            data: (sections) {
              if (sections.isEmpty) return const SizedBox.shrink();
              return Container(
                height: 44,
                margin: const EdgeInsets.symmetric(vertical: 8),
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  children: [
                    Padding(
                      padding: const EdgeInsets.only(left: 8),
                      child: ChoiceChip(
                        label: const Text('الكل'),
                        selected: selectedSectionId == null,
                        labelStyle: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 12.5,
                          fontWeight: selectedSectionId == null ? FontWeight.bold : FontWeight.w500,
                          color: selectedSectionId == null ? Colors.white : AppColors.textPrimary,
                        ),
                        selectedColor: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          side: BorderSide(
                            color: selectedSectionId == null ? AppColors.primary : AppColors.border,
                            width: 0.8,
                          ),
                        ),
                        onSelected: (_) {
                          ref.read(selectedShelfSectionIdProvider.notifier).state = null;
                        },
                      ),
                    ),
                    ...sections.map(
                      (sec) => Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: ChoiceChip(
                          label: Text('${sec.name} (${sec.itemsCount})'),
                          selected: selectedSectionId == sec.id,
                          labelStyle: TextStyle(
                            fontFamily: AppTypography.fontFamily,
                            fontSize: 12.5,
                            fontWeight: selectedSectionId == sec.id ? FontWeight.bold : FontWeight.w500,
                            color: selectedSectionId == sec.id ? Colors.white : AppColors.textPrimary,
                          ),
                          selectedColor: AppColors.primary,
                          backgroundColor: AppColors.surface,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(AppRadius.full),
                            side: BorderSide(
                              color: selectedSectionId == sec.id ? AppColors.primary : AppColors.border,
                              width: 0.8,
                            ),
                          ),
                          onSelected: (_) {
                            ref.read(selectedShelfSectionIdProvider.notifier).state =
                                selectedSectionId == sec.id ? null : sec.id;
                          },
                        ),
                      ),
                    ),
                  ],
                ),
              );
            },
            loading: () => const SizedBox(height: 44),
            error: (_, __) => const SizedBox.shrink(),
          ),

          // Items List
          Expanded(
            child: itemsAsync.when(
              data: (items) {
                if (items.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا توجد منشورات متاحة حالياً',
                    subtitle: 'سيتم نشر المقالات والمصادر الإثرائية هنا قريباً',
                    icon: Icons.menu_book_outlined,
                  );
                }

                return RefreshIndicator(
                  color: AppColors.primary,
                  onRefresh: () => ref.refresh(shelfItemsProvider.future),
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: items.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = items[index];
                      return ModernCard(
                        borderColor: item.isPinned ? AppColors.accentGold : AppColors.border,
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 3,
                                  ),
                                  decoration: BoxDecoration(
                                    color: AppColors.surfaceMuted,
                                    borderRadius: BorderRadius.circular(AppRadius.sm),
                                  ),
                                  child: Text(
                                    item.typeLabel,
                                    style: const TextStyle(
                                      fontFamily: AppTypography.fontFamily,
                                      fontSize: 11,
                                      fontWeight: FontWeight.bold,
                                      color: AppColors.textSecondary,
                                    ),
                                  ),
                                ),
                                if (item.isPinned)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                    decoration: BoxDecoration(
                                      color: AppColors.accentGoldSoft,
                                      borderRadius: BorderRadius.circular(AppRadius.full),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(Icons.push_pin_outlined,
                                            size: 13,
                                            color: AppColors.accentGoldDark),
                                        SizedBox(width: 4),
                                        Text(
                                          'مثبت',
                                          style: TextStyle(
                                            fontFamily: AppTypography.fontFamily,
                                            fontSize: 11,
                                            fontWeight: FontWeight.bold,
                                            color: AppColors.accentGoldDark,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 10),
                            Text(
                              item.title,
                              style: AppTypography.cardTitle,
                            ),
                            const SizedBox(height: 6),
                            Text(
                              item.content,
                              style: AppTypography.body,
                            ),
                            if (item.attachmentName != null) ...[
                              const SizedBox(height: 12),
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEEF2FF),
                                  borderRadius: BorderRadius.circular(AppRadius.md),
                                  border: Border.all(color: const Color(0xFFC7D2FE), width: 0.8),
                                ),
                                child: Row(
                                  children: [
                                    const Icon(Icons.attach_file,
                                        size: 16,
                                        color: Color(0xFF4F46E5)),
                                    const SizedBox(width: 6),
                                    Expanded(
                                      child: Text(
                                        item.attachmentName!,
                                        style: const TextStyle(
                                          fontFamily: AppTypography.fontFamily,
                                          fontSize: 12,
                                          color: Color(0xFF312E81),
                                          fontWeight: FontWeight.w500,
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                            const SizedBox(height: 12),
                            const Divider(height: 1),
                            const SizedBox(height: 8),
                            Row(
                              children: [
                                if (item.authorName != null) ...[
                                  const Icon(Icons.person_outline,
                                      size: 14, color: AppColors.textMuted),
                                  const SizedBox(width: 4),
                                  Text(
                                    item.authorName!,
                                    style: AppTypography.label,
                                  ),
                                ],
                                const Spacer(),
                                const Icon(Icons.access_time,
                                    size: 14, color: AppColors.textMuted),
                                const SizedBox(width: 4),
                                Text(
                                  dateFormat.format(item.publishedAt),
                                  style: AppTypography.label,
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
              loading: () => const Padding(
                padding: EdgeInsets.all(24),
                child: LoadingView(message: 'جاري تحميل المنشورات...'),
              ),
              error: (err, _) => ErrorView(
                message: err.toString(),
                onRetry: () => ref.refresh(shelfItemsProvider.future),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
