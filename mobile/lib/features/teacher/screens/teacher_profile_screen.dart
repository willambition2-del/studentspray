import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../auth/providers/auth_provider.dart';
import '../providers/teacher_provider.dart';

class TeacherProfileScreen extends ConsumerWidget {
  const TeacherProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);
    final user = authState.user;
    final halaqasAsync = ref.watch(myHalaqasProvider);

    final displayName = user?.displayName ?? 'المعلم الفاضل';

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الملف الشخصي والحساب'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Profile Header Card
          ModernCard(
            backgroundColor: AppColors.primaryDark,
            borderColor: Colors.transparent,
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    color: Colors.white.withAlpha(25),
                    borderRadius: BorderRadius.circular(AppRadius.xl),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    displayName.isNotEmpty ? displayName[0] : 'م',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 26,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  displayName,
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: Colors.white,
                    fontSize: 19,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'اسم المستخدم: @${user?.username ?? ""}',
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: AppColors.accentGoldSoft,
                    fontSize: 12.5,
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.white12,
                    borderRadius: BorderRadius.circular(AppRadius.full),
                  ),
                  child: Text(
                    'كادر التحفيظ والترتيل • ${user?.branch?.name ?? "الفرع الرئيسي"}',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      color: Colors.white,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // User Information Details Card
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'البيانات الأساسية والتنظيمية',
                  icon: Icons.person_outline,
                ),
                const SizedBox(height: 8),
                _buildProfileRow(Icons.account_circle_outlined, 'الاسم الكامل', user?.displayName ?? '—'),
                const Divider(height: 16),
                _buildProfileRow(Icons.domain, 'الملتقى القرآني', user?.forum?.name ?? 'ملتقى النور النموذجي'),
                const Divider(height: 16),
                _buildProfileRow(Icons.location_on_outlined, 'الفرع الإداري', user?.branch?.name ?? 'الفرع الرئيسي'),
                const Divider(height: 16),
                _buildProfileRow(Icons.email_outlined, 'البريد الإلكتروني', user?.email ?? 'غير محدد'),
                const Divider(height: 16),
                _buildProfileRow(Icons.phone_outlined, 'رقم الهاتف', user?.phone ?? 'غير محدد'),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Assigned Halaqas Section
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SectionHeader(
                  title: 'الحلقات المكلف بها حاليًا',
                  icon: Icons.account_tree_outlined,
                ),
                const SizedBox(height: 8),
                halaqasAsync.when(
                  data: (halaqas) {
                    if (halaqas.isEmpty) {
                      return const Text(
                        'لا توجد حلقات مسندة',
                        style: AppTypography.secondary,
                      );
                    }
                    return Column(
                      children: halaqas.map((h) {
                        return Padding(
                          padding: const EdgeInsets.symmetric(vertical: 4),
                          child: Row(
                            children: [
                              const Icon(Icons.check_circle, size: 16, color: AppColors.primary),
                              const SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  '${h.name} (${h.studentsCount} طالب)',
                                  style: AppTypography.bodyMedium,
                                ),
                              ),
                              Text(
                                h.branchName,
                                style: AppTypography.label,
                              ),
                            ],
                          ),
                        );
                      }).toList(),
                    );
                  },
                  loading: () => const Text('جاري التحميل...', style: AppTypography.label),
                  error: (err, _) => Text('تعذر التحميل: $err', style: AppTypography.label),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),

          // Actions Card (Change password, Logout)
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SectionHeader(
                  title: 'إعدادات وأمان الحساب',
                  icon: Icons.shield_outlined,
                ),
                const SizedBox(height: 8),
                OutlinedButton.icon(
                  onPressed: () => _showChangePasswordDialog(context, ref),
                  icon: const Icon(Icons.lock_outline, size: 18),
                  label: const Text('تغيير كلمة المرور'),
                ),
                const SizedBox(height: 10),
                ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.errorSoft,
                    foregroundColor: AppColors.error,
                    elevation: 0,
                  ),
                  onPressed: () => _confirmLogout(context, ref),
                  icon: const Icon(Icons.logout, size: 18),
                  label: const Text(
                    'تسجيل الخروج من الحساب',
                    style: TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  Widget _buildProfileRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 18, color: AppColors.primary),
        const SizedBox(width: 10),
        Text(
          label,
          style: AppTypography.secondary,
        ),
        const Spacer(),
        Text(
          value,
          style: AppTypography.bodyMedium,
        ),
      ],
    );
  }

  void _showChangePasswordDialog(BuildContext context, WidgetRef ref) {
    final oldPasswordController = TextEditingController();
    final newPasswordController = TextEditingController();
    final confirmPasswordController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: const Text(
          'تغيير كلمة المرور',
          style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldPasswordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'كلمة المرور الحالية'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'كلمة المرور الجديدة'),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: confirmPasswordController,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'تأكيد كلمة المرور الجديدة'),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () async {
              if (newPasswordController.text != confirmPasswordController.text) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('كلمة المرور وتأكيدها غير متطابقين')),
                );
                return;
              }
              Navigator.pop(ctx);
              try {
                await ref.read(teacherOperationsProvider).changePassword(
                      currentPassword: oldPasswordController.text,
                      newPassword: newPasswordController.text,
                    );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('✓ تم تغيير كلمة المرور بنجاح'),
                      backgroundColor: AppColors.statusPresent,
                    ),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('فشل تغيير كلمة المرور: $e'), backgroundColor: AppColors.statusAbsent),
                  );
                }
              }
            },
            child: const Text('حفظ'),
          ),
        ],
      ),
    );
  }

  void _confirmLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
        title: const Text(
          'تأكيد تسجيل الخروج',
          style: TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold, fontSize: 16),
        ),
        content: const Text(
          'هل أنت متأكد من رغبتك في تسجيل الخروج من التطبيق؟',
          style: AppTypography.body,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('خروج'),
          ),
        ],
      ),
    );
  }
}
