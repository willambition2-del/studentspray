import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../auth/providers/auth_provider.dart';

class UnsupportedRoleScreen extends ConsumerWidget {
  const UnsupportedRoleScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final roleName = user?.primaryRoleTitle ?? 'مستخدم';

    return Scaffold(
      appBar: AppBar(
        title: const Text('الملتقى القرآني'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            tooltip: 'تسجيل الخروج',
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.all(28),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppTheme.accentGold.withAlpha(25),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(
                    Icons.dashboard_customize_outlined,
                    size: 56,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(height: 24),
                Text(
                  'أهلاً بك، $roleName',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryDark,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'بوابة الجوال المخصصة لدور ($roleName) قيد التطوير وستتاح في المراحل القادمة بإذن الله.\n\nبإمكانك استخدام لوحة التحكم على الويب للاستفادة من كافة الصلاحيات والخدمات.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 14,
                    color: AppTheme.textSecondary,
                    height: 1.6,
                  ),
                ),
                const SizedBox(height: 32),
                OutlinedButton.icon(
                  onPressed: () => ref.read(authProvider.notifier).logout(),
                  icon: const Icon(Icons.logout),
                  label: const Text('تسجيل الخروج والتبديل لحساب آخر'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
