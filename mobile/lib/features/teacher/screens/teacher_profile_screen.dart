import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/teacher_provider.dart';

class TeacherProfileScreen extends ConsumerWidget {
  const TeacherProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final halaqasAsync = ref.watch(myHalaqasProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الملف الشخصي والحساب'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                colors: [AppTheme.primaryDark, AppTheme.primary],
                begin: Alignment.topRight,
                end: Alignment.bottomLeft,
              ),
              borderRadius: BorderRadius.circular(20),
            ),
            child: Column(
              children: [
                CircleAvatar(
                  radius: 36,
                  backgroundColor: AppTheme.accentGold.withAlpha(40),
                  child: const Icon(
                    Icons.person_rounded,
                    color: AppTheme.accentGold,
                    size: 42,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.displayName ?? 'المعلم الفاضل',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'اسم المستخدم: @${user?.username ?? ""}',
                  style: const TextStyle(
                    color: AppTheme.accentGoldLight,
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white12,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    'كادر التحفيظ والترتيل • ${user?.branch?.name ?? "الفرع الرئيسي"}',
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 20),

          // User Information Details Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'البيانات الأساسية والتنظيمية',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  const SizedBox(height: 12),
                  _buildProfileRow(Icons.account_circle_outlined, 'الاسم الكامل', user?.displayName ?? '—'),
                  const Divider(height: 16),
                  _buildProfileRow(Icons.domain_rounded, 'الملتقى القرآني', user?.forum?.name ?? 'ملتقى النور النموذجي'),
                  const Divider(height: 16),
                  _buildProfileRow(Icons.location_on_outlined, 'الفرع الإداري', user?.branch?.name ?? 'الفرع الرئيسي'),
                  const Divider(height: 16),
                  _buildProfileRow(Icons.email_outlined, 'البريد الإلكتروني', user?.email ?? 'غير محدد'),
                  const Divider(height: 16),
                  _buildProfileRow(Icons.phone_outlined, 'رقم الهاتف', user?.phone ?? 'غير محدد'),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Assigned Halaqas Card
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'الحلقات المسندة للمعلم',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  const SizedBox(height: 12),
                  halaqasAsync.when(
                    data: (halaqas) {
                      if (halaqas.isEmpty) {
                        return const Text('لا توجد حلقات مسندة حاليًا', style: TextStyle(color: AppTheme.textMuted));
                      }
                      return Column(
                        children: halaqas
                            .map((h) => Padding(
                                  padding: const EdgeInsets.only(bottom: 8),
                                  child: Row(
                                    children: [
                                      const Icon(Icons.groups_rounded, size: 18, color: AppTheme.primary),
                                      const SizedBox(width: 8),
                                      Expanded(child: Text(h.name, style: const TextStyle(fontWeight: FontWeight.w600))),
                                      Text('${h.studentsCount} طالب', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                                    ],
                                  ),
                                ))
                            .toList(),
                      );
                    },
                    loading: () => const SizedBox(height: 20, child: CircularProgressIndicator(strokeWidth: 2)),
                    error: (_, __) => const Text('تعذر تحميل الحلقات', style: TextStyle(color: AppTheme.statusAbsent)),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Actions
          ElevatedButton.icon(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
            ),
            onPressed: () => _showChangePasswordDialog(context, ref),
            icon: const Icon(Icons.lock_reset_rounded),
            label: const Text('تغيير كلمة المرور'),
          ),
          const SizedBox(height: 10),
          OutlinedButton.icon(
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              foregroundColor: AppTheme.statusAbsent,
              side: const BorderSide(color: AppTheme.statusAbsent),
            ),
            onPressed: () async {
              final confirmed = await showDialog<bool>(
                context: context,
                builder: (ctx) => AlertDialog(
                  title: const Text('تسجيل الخروج'),
                  content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
                  actions: [
                    TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(backgroundColor: AppTheme.statusAbsent),
                      onPressed: () => Navigator.pop(ctx, true),
                      child: const Text('تسجيل الخروج'),
                    ),
                  ],
                ),
              );

              if (confirmed == true) {
                await ref.read(authProvider.notifier).logout();
              }
            },
            icon: const Icon(Icons.logout_rounded),
            label: const Text('تسجيل الخروج من الحساب'),
          ),
        ],
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppTheme.primary),
        const SizedBox(width: 12),
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
        const Spacer(),
        Text(value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
      ],
    );
  }

  void _showChangePasswordDialog(BuildContext context, WidgetRef ref) {
    final currentPassController = TextEditingController();
    final newPassController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('تغيير كلمة المرور'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentPassController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'كلمة المرور الحالية', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPassController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'كلمة المرور الجديدة', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('إلغاء')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
            onPressed: () async {
              final currentPass = currentPassController.text.trim();
              final newPass = newPassController.text.trim();
              if (currentPass.isEmpty || newPass.isEmpty) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('يرجى ملء جميع الحقول')));
                return;
              }

              try {
                final ops = ref.read(teacherOperationsProvider);
                await ops.changePassword(currentPassword: currentPass, newPassword: newPass);
                if (context.mounted) {
                  Navigator.pop(ctx);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم تغيير كلمة المرور بنجاح')));
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('تعذر تغيير كلمة المرور: $e')));
                }
              }
            },
            child: const Text('حفظ التغيير'),
          ),
        ],
      ),
    );
  }
}
