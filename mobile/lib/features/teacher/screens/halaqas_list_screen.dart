import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class HalaqasListScreen extends ConsumerWidget {
  const HalaqasListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final halaqasAsync = ref.watch(myHalaqasProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('جميع الحلقات المكلف بها'),
      ),
      body: RefreshIndicator(
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
              padding: const EdgeInsets.symmetric(vertical: 12),
              itemCount: halaqas.length,
              itemBuilder: (context, index) {
                final halaqa = halaqas[index];
                return Card(
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 12,
                    ),
                    leading: CircleAvatar(
                      backgroundColor: AppTheme.primary.withAlpha(25),
                      child: const Icon(
                        Icons.school_rounded,
                        color: AppTheme.primary,
                      ),
                    ),
                    title: Text(
                      halaqa.name,
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    subtitle: Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text(
                        '${halaqa.branchName} • الرمز: ${halaqa.code} • ${halaqa.studentsCount} طالب',
                        style: const TextStyle(color: AppTheme.textSecondary),
                      ),
                    ),
                    trailing: const Icon(
                      Icons.chevron_left_rounded,
                      color: AppTheme.primary,
                    ),
                    onTap: () => context.push('/teacher/halaqas/${halaqa.id}'),
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
