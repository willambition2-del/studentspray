import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../demo_data.dart';
import '../demo_models.dart';
import '../widgets/demo_floating_bar.dart';

class SupervisorDemoScreen extends StatelessWidget {
  const SupervisorDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final DemoSupervisorData data = DemoData.supervisor;

    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text('الملتقى القرآني — المشرف الفني (معاينة)'),
        backgroundColor: AppTheme.primaryDark,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Badge(
              label: Text('3'),
              child: Icon(Icons.notifications_outlined),
            ),
            tooltip: 'الإشعارات',
            onPressed: () => _showSnackBar(context, 'شاشة إشعارات المشرف الفني'),
          ),
          IconButton(
            icon: const Badge(
              label: Text('5'),
              child: Icon(Icons.chat_bubble_outline_rounded),
            ),
            tooltip: 'المحادثات',
            onPressed: () => _showSnackBar(context, 'شاشة محادثات المشرف وكادر المعلمين'),
          ),
        ],
      ),
      body: Stack(
        children: [
          Directionality(
            textDirection: TextDirection.rtl,
            child: SingleChildScrollView(
              padding: const EdgeInsets.only(left: 16, right: 16, top: 16, bottom: 85),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Greeting Card
                  _buildGreetingCard(data),

                  const SizedBox(height: 16),

                  // Metrics Summary
                  _buildMetricsRow(data),

                  const SizedBox(height: 20),

                  // Quick Actions Grid
                  _buildQuickActions(context),

                  const SizedBox(height: 20),

                  // Recent Visits
                  _buildRecentVisitsSection(context, data),

                  const SizedBox(height: 20),

                  // Assigned Teachers
                  _buildTeachersSection(context, data),
                ],
              ),
            ),
          ),
          const DemoFloatingReturnButton(),
        ],
      ),
    );
  }

  Widget _buildGreetingCard(DemoSupervisorData data) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryDark,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 26,
            backgroundColor: AppTheme.accentGold,
            child: Text(
              '🧐',
              style: TextStyle(fontSize: 24),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أهلاً بك، ${data.name}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${data.roleTitle} — ${data.centerName}',
                  style: TextStyle(
                    color: Colors.white.withAlpha(200),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMetricsRow(DemoSupervisorData data) {
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            title: 'الحلقات الميدانية',
            count: '${data.assignedHalaqasCount}',
            subtitle: '8 حلقات مسندة',
            icon: Icons.groups_rounded,
            color: AppTheme.primary,
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard(
            title: 'كادر المعلمين',
            count: '${data.assignedTeachersCount}',
            subtitle: '12 معلماً',
            icon: Icons.person_search_rounded,
            color: const Color(0xFF0D9488),
          ),
        ),
        const SizedBox(width: 10),
        Expanded(
          child: _buildStatCard(
            title: 'زيارات الشهر',
            count: '${data.visitsThisMonth}',
            subtitle: '${data.completedEvaluations} مكتملة',
            icon: Icons.assignment_turned_in_rounded,
            color: AppTheme.accentGold,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String count,
    required String subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.dividerColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 6),
          Text(
            count,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
          ),
          Text(
            subtitle,
            style: const TextStyle(fontSize: 9, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    final actions = [
      {'title': 'الحلقات الميدانية', 'icon': Icons.account_balance_rounded, 'color': AppTheme.primary},
      {'title': 'كادر المعلمين', 'icon': Icons.people_alt_rounded, 'color': AppTheme.primaryLight},
      {'title': 'الزيارات الميدانية', 'icon': Icons.location_on_rounded, 'color': const Color(0xFF0D9488)},
      {'title': 'تقييم المعلمين', 'icon': Icons.rate_review_rounded, 'color': const Color(0xFFD97706)},
      {'title': 'التوصيات والمتابعة', 'icon': Icons.checklist_rounded, 'color': const Color(0xFFE11D48)},
      {'title': 'الرف والشؤون الإدارية', 'icon': Icons.menu_book_rounded, 'color': const Color(0xFF4F46E5)},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'أدوات الإشراف الفني:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 10),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 3,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.05,
          ),
          itemCount: actions.length,
          itemBuilder: (context, index) {
            final act = actions[index];
            final color = act['color'] as Color;
            return Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _showSnackBar(context, 'تم النقر على: ${act['title']}'),
                child: Padding(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: color.withAlpha(20),
                          shape: BoxShape.circle,
                        ),
                        child: Icon(act['icon'] as IconData, size: 22, color: color),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        act['title'] as String,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildRecentVisitsSection(BuildContext context, DemoSupervisorData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'الزيارات الميدانية الأخيرة:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            TextButton(
              onPressed: () => _showSnackBar(context, 'عرض كافة الزيارات الميدانية'),
              child: const Text('عرض الكل'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ...data.recentVisits.map((v) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: ListTile(
                leading: Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '${v.scorePercentage}%',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ),
                title: Text(
                  v.halaqaName,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  'المعلم: ${v.teacherName} • ${v.date}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: v.scorePercentage >= 90
                        ? AppTheme.statusPresent.withAlpha(20)
                        : AppTheme.statusLate.withAlpha(20),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    v.status,
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: v.scorePercentage >= 90 ? AppTheme.statusPresent : AppTheme.statusLate,
                    ),
                  ),
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildTeachersSection(BuildContext context, DemoSupervisorData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'كادر المعلمين التابعين للإشراف:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            Text(
              '${data.teachers.length} معلمين',
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...data.teachers.map((t) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: ListTile(
                leading: const CircleAvatar(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  child: Icon(Icons.person_outline_rounded, size: 20),
                ),
                title: Text(
                  t.name,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${t.halaqaName} • جوال: ${t.phone}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.star_rounded, size: 16, color: AppTheme.accentGold),
                    const SizedBox(width: 4),
                    Text(
                      '${t.performanceRating}%',
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  void _showSnackBar(BuildContext context, String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text, textDirection: TextDirection.rtl),
        duration: const Duration(seconds: 2),
        backgroundColor: AppTheme.primaryDark,
      ),
    );
  }
}
