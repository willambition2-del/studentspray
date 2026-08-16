import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../demo_data.dart';
import '../demo_models.dart';
import '../widgets/demo_floating_bar.dart';

class StudentDemoScreen extends StatelessWidget {
  const StudentDemoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final DemoStudentData data = DemoData.student;

    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text('الملتقى القرآني — الطالب (معاينة)'),
        backgroundColor: AppTheme.primaryDark,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Badge(
              label: Text('2'),
              child: Icon(Icons.notifications_outlined),
            ),
            tooltip: 'الإشعارات',
            onPressed: () => _showSnackBar(context, 'شاشة إشعارات الطالب'),
          ),
          IconButton(
            icon: const Badge(
              label: Text('1'),
              child: Icon(Icons.chat_bubble_outline_rounded),
            ),
            tooltip: 'محادثة الحلقة',
            onPressed: () => _showSnackBar(context, 'محادثة حلقة الإمام عاصم'),
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
                  // Greeting & Student Identity Hero Banner
                  _buildStudentHeroBanner(data),

                  const SizedBox(height: 16),

                  // Plan Progress Card
                  _buildPlanProgressCard(data),

                  const SizedBox(height: 20),

                  // Four Core Indicators Grid
                  _buildCoreIndicatorsGrid(data),

                  const SizedBox(height: 20),

                  // Quick Academic Operations Grid
                  _buildQuickNavigationGrid(context),

                  const SizedBox(height: 20),

                  // Latest Achievements & Exam Results
                  _buildLatestAchievementsSection(context, data),

                  const SizedBox(height: 20),

                  // Recent Awards Section
                  _buildAwardsSection(context, data),
                ],
              ),
            ),
          ),
          const DemoFloatingReturnButton(),
        ],
      ),
    );
  }

  Widget _buildStudentHeroBanner(DemoStudentData data) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [AppTheme.primaryDark, AppTheme.primary],
          begin: Alignment.topRight,
          end: Alignment.bottomLeft,
        ),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: AppTheme.primaryDark.withAlpha(50),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppTheme.accentGold,
              shape: BoxShape.circle,
              border: Border.all(color: Colors.white, width: 2),
            ),
            alignment: Alignment.center,
            child: const Text('🎓', style: TextStyle(fontSize: 26)),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أهلاً بك يا ${data.name}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${data.halaqaName} • المعلم: ${data.teacherName}',
                  style: TextStyle(
                    color: Colors.white.withAlpha(210),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: AppTheme.accentGold.withAlpha(40),
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: AppTheme.accentGoldLight.withAlpha(100)),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.stars_rounded, size: 14, color: AppTheme.accentGoldLight),
                const SizedBox(width: 4),
                Text(
                  '${data.totalAwards} أوسمة',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 11,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPlanProgressCard(DemoStudentData data) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Row(
                  children: [
                    Icon(Icons.auto_stories_rounded, size: 20, color: AppTheme.primary),
                    SizedBox(width: 8),
                    Text(
                      'خطة الحفظ والمراجعة الحالية',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryDark,
                      ),
                    ),
                  ],
                ),
                Text(
                  '${data.planProgress}% مكتمل',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: LinearProgressIndicator(
                value: data.planProgress / 100,
                backgroundColor: AppTheme.dividerColor,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                minHeight: 10,
              ),
            ),
            const SizedBox(height: 14),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildPlanItemSnippet('آخر حفظ:', data.lastMemorization, Icons.mic_rounded),
                _buildPlanItemSnippet('آخر مراجعة:', data.lastRevision, Icons.repeat_rounded),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanItemSnippet(String title, String content, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 16, color: AppTheme.accentGold),
        const SizedBox(width: 6),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
            Text(
              content,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCoreIndicatorsGrid(DemoStudentData data) {
    return Row(
      children: [
        Expanded(
          child: _buildIndicatorTile(
            title: 'نسبة الحضور',
            value: '${data.attendanceRate}%',
            icon: Icons.how_to_reg_rounded,
            color: AppTheme.statusPresent,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildIndicatorTile(
            title: 'آخر اختبار',
            value: '${data.lastExamScore}/100',
            icon: Icons.grading_rounded,
            color: const Color(0xFFD97706),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildIndicatorTile(
            title: 'التقييم العام',
            value: 'ممتاز',
            icon: Icons.emoji_events_rounded,
            color: AppTheme.accentGold,
          ),
        ),
      ],
    );
  }

  Widget _buildIndicatorTile({
    required String title,
    required String value,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppTheme.dividerColor),
      ),
      child: Column(
        children: [
          Icon(icon, size: 20, color: color),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: const TextStyle(fontSize: 10, color: AppTheme.textSecondary),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickNavigationGrid(BuildContext context) {
    final navItems = [
      {'title': 'خطة الحفظ', 'icon': Icons.menu_book_rounded, 'color': AppTheme.primary},
      {'title': 'سجل الحضور', 'icon': Icons.calendar_month_rounded, 'color': const Color(0xFF0D9488)},
      {'title': 'التسميع والمراجعة', 'icon': Icons.record_voice_over_rounded, 'color': const Color(0xFF2563EB)},
      {'title': 'الاختبارات والنتائج', 'icon': Icons.quiz_rounded, 'color': const Color(0xFFD97706)},
      {'title': 'الأنشطة والمسابقات', 'icon': Icons.military_tech_rounded, 'color': const Color(0xFFE11D48)},
      {'title': 'الرف العام', 'icon': Icons.local_library_rounded, 'color': const Color(0xFF7C3AED)},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'أقسام ومسارات الطالب:',
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
          itemCount: navItems.length,
          itemBuilder: (context, index) {
            final item = navItems[index];
            final color = item['color'] as Color;
            return Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _showSnackBar(context, 'انتقال إلى: ${item['title']}'),
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
                        child: Icon(item['icon'] as IconData, size: 22, color: color),
                      ),
                      const SizedBox(height: 6),
                      Text(
                        item['title'] as String,
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

  Widget _buildLatestAchievementsSection(BuildContext context, DemoStudentData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الاختبارات والنتائج الأخيرة:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        ...data.exams.map((exam) {
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
                    color: exam.score != null ? AppTheme.primary.withAlpha(20) : AppTheme.dividerColor.withAlpha(80),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    exam.score != null ? '${exam.score}%' : 'قريباً',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 11,
                      color: exam.score != null ? AppTheme.primaryDark : AppTheme.textMuted,
                    ),
                  ),
                ),
                title: Text(
                  exam.title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  'المقرر: ${exam.scope} • التاريخ: ${exam.date}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: exam.status == 'PUBLISHED'
                        ? AppTheme.statusPresent.withAlpha(20)
                        : AppTheme.accentGold.withAlpha(20),
                    borderRadius: BorderRadius.circular(6),
                  ),
                  child: Text(
                    exam.status == 'PUBLISHED' ? 'معتمد' : 'مجدول',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: exam.status == 'PUBLISHED' ? AppTheme.statusPresent : AppTheme.accentGold,
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

  Widget _buildAwardsSection(BuildContext context, DemoStudentData data) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'أوسمة التميز والإنجاز:',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        ...data.awards.map((award) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: ListTile(
                leading: Text(award.icon, style: const TextStyle(fontSize: 28)),
                title: Text(
                  award.title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  '${award.reason} • ${award.date}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
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
