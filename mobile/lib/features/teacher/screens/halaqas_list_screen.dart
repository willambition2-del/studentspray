import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class HalaqasListScreen extends ConsumerWidget {
  const HalaqasListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final halaqasAsync = ref.watch(myHalaqasProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('جميع الحلقات المكلف بها'),
      ),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: () async => ref.invalidate(myHalaqasProvider),
        child: halaqasAsync.when(
          data: (halaqas) {
            if (halaqas.isEmpty) {
              return const EmptyStateView(
                title: 'لا توجد حلقات مكلف بها',
                subtitle: 'يرجى مراجعة إدارة الفرع للتكليف بحلقات',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: halaqas.length,
              itemBuilder: (context, index) {
                final halaqa = halaqas[index];
                return ModernCard(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  onTap: () => context.push('/teacher/halaqas/${halaqa.id}'),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppColors.primarySoft,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                        ),
                        child: const Icon(
                          Icons.group_outlined,
                          color: AppColors.primary,
                          size: 22,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              halaqa.name,
                              style: AppTypography.bodyMedium,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 2),
                            Text(
                              '${halaqa.branchName} • الرمز: ${halaqa.code} • ${halaqa.studentsCount} طالب',
                              style: AppTypography.secondary,
                            ),
                          ],
                        ),
                      ),
                      const Icon(
                        Icons.arrow_back_ios,
                        size: 14,
                        color: AppColors.textMuted,
                      ),
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const LoadingView(message: 'جاري تحميل الحلقات...'),
          error: (err, _) => ErrorView(
            message: err.toString(),
            onRetry: () => ref.invalidate(myHalaqasProvider),
          ),
        ),
      ),
    );
  }
}
