import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../demo_data.dart';
import '../demo_models.dart';
import '../demo_state.dart';
import '../widgets/demo_floating_bar.dart';

class ParentDemoScreen extends ConsumerWidget {
  const ParentDemoScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final parentData = DemoData.parent;
    final selectedChildIndex = ref.watch(selectedDemoChildIndexProvider);
    final selectedChild = parentData.children[selectedChildIndex % parentData.children.length];

    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text('الملتقى القرآني — ولي الأمر (معاينة)'),
        backgroundColor: AppTheme.primaryDark,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Badge(
              label: Text('3'),
              child: Icon(Icons.notifications_outlined),
            ),
            tooltip: 'الإشعارات',
            onPressed: () => _showSnackBar(context, 'إشعارات ولي الأمر'),
          ),
          IconButton(
            icon: const Badge(
              label: Text('2'),
              child: Icon(Icons.chat_bubble_outline_rounded),
            ),
            tooltip: 'محادثات المعلمين',
            onPressed: () => _showSnackBar(context, 'قنوات التواصل مع معلمي الأبناء'),
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
                  // Guardian Greeting Card
                  _buildGuardianHeader(parentData),

                  const SizedBox(height: 16),

                  // Children Tab Switcher
                  _buildChildrenSwitcher(ref, parentData, selectedChildIndex),

                  const SizedBox(height: 16),

                  // Selected Child Overview Card
                  _buildChildHeroCard(selectedChild),

                  const SizedBox(height: 16),

                  // Selected Child Progress Card
                  _buildChildPlanCard(selectedChild),

                  const SizedBox(height: 20),

                  // Selected Child Indicators Row
                  _buildChildIndicators(selectedChild),

                  const SizedBox(height: 20),

                  // Quick Academic Navigation Grid
                  _buildQuickNavGrid(context, selectedChild),

                  const SizedBox(height: 20),

                  // Selected Child Recent Exams
                  _buildChildExamsSection(selectedChild),

                  const SizedBox(height: 20),

                  // Selected Child Awards
                  _buildChildAwardsSection(selectedChild),
                ],
              ),
            ),
          ),
          const DemoFloatingReturnButton(),
        ],
      ),
    );
  }

  Widget _buildGuardianHeader(DemoParentData parentData) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppTheme.primaryDark,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        children: [
          const CircleAvatar(
            radius: 24,
            backgroundColor: AppTheme.accentGold,
            child: Text('👨‍👧‍👦', style: TextStyle(fontSize: 22)),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'أهلاً بك، ${parentData.guardianName}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 15,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'متابعة (${parentData.children.length}) أبناء مسجلين بالملتقى',
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

  Widget _buildChildrenSwitcher(WidgetRef ref, DemoParentData parentData, int selectedIndex) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'اختر الابن للمتابعة:',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          height: 48,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            itemCount: parentData.children.length,
            separatorBuilder: (_, __) => const SizedBox(width: 10),
            itemBuilder: (context, index) {
              final child = parentData.children[index];
              final isSelected = index == selectedIndex;

              return InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () {
                  ref.read(selectedDemoChildIndexProvider.notifier).state = index;
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  decoration: BoxDecoration(
                    color: isSelected ? AppTheme.primary : Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isSelected ? AppTheme.primary : AppTheme.dividerColor,
                      width: 1.5,
                    ),
                    boxShadow: [
                      if (isSelected)
                        BoxShadow(
                          color: AppTheme.primary.withAlpha(50),
                          blurRadius: 6,
                          offset: const Offset(0, 2),
                        ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Icon(
                        Icons.person_rounded,
                        size: 18,
                        color: isSelected ? Colors.white : AppTheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        child.name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: isSelected ? Colors.white : AppTheme.textPrimary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildChildHeroCard(DemoChildData child) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppTheme.dividerColor),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Container(
              width: 50,
              height: 50,
              decoration: BoxDecoration(
                color: AppTheme.primary.withAlpha(20),
                shape: BoxShape.circle,
              ),
              alignment: Alignment.center,
              child: const Text('📖', style: TextStyle(fontSize: 24)),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    child.name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                  const SizedBox(height: 3),
                  Text(
                    '${child.ageGrade} • ${child.halaqaName}',
                    style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    'المعلم: ${child.teacherName}',
                    style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                  ),
                ],
              ),
            ),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
              decoration: BoxDecoration(
                color: AppTheme.accentGold.withAlpha(30),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                children: [
                  const Icon(Icons.military_tech_rounded, size: 18, color: AppTheme.accentGold),
                  const SizedBox(height: 2),
                  Text(
                    '${child.awardsCount} أوسمة',
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildChildPlanCard(DemoChildData child) {
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
                const Text(
                  'مستوى الإنجاز بالخطة',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryDark,
                  ),
                ),
                Text(
                  '${child.planProgress}% منجز',
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 10),
            ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: LinearProgressIndicator(
                value: child.planProgress / 100,
                backgroundColor: AppTheme.dividerColor,
                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                minHeight: 8,
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                _buildSnippet('آخر حفظ:', child.lastMemorization),
                _buildSnippet('آخر مراجعة:', child.lastRevision),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSnippet(String title, String content) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: const TextStyle(fontSize: 10, color: AppTheme.textMuted)),
        Text(
          content,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
        ),
      ],
    );
  }

  Widget _buildChildIndicators(DemoChildData child) {
    return Row(
      children: [
        Expanded(
          child: _buildTile(
            title: 'نسبة الحضور',
            value: '${child.attendanceRate}%',
            icon: Icons.check_circle_outline_rounded,
            color: AppTheme.statusPresent,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildTile(
            title: 'آخر اختبار',
            value: '${child.lastExamScore}/100',
            icon: Icons.grading_rounded,
            color: const Color(0xFFD97706),
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildTile(
            title: 'التقييم الأخير',
            value: child.lastEvaluationRating.split(' ')[0],
            icon: Icons.stars_rounded,
            color: AppTheme.accentGold,
          ),
        ),
      ],
    );
  }

  Widget _buildTile({
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

  Widget _buildQuickNavGrid(BuildContext context, DemoChildData child) {
    final items = [
      {'title': 'خطة الحفظ', 'icon': Icons.menu_book_rounded, 'color': AppTheme.primary},
      {'title': 'سجل الحضور', 'icon': Icons.calendar_month_rounded, 'color': const Color(0xFF0D9488)},
      {'title': 'التسميع والمراجعة', 'icon': Icons.mic_rounded, 'color': const Color(0xFF2563EB)},
      {'title': 'الاختبارات والنتائج', 'icon': Icons.quiz_rounded, 'color': const Color(0xFFD97706)},
      {'title': 'الأنشطة والأوسمة', 'icon': Icons.military_tech_rounded, 'color': const Color(0xFFE11D48)},
      {'title': 'الرف العام', 'icon': Icons.local_library_rounded, 'color': const Color(0xFF7C3AED)},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'أقسام ومسارات متابعة ${child.name}:',
          style: const TextStyle(
            fontSize: 15,
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
          itemCount: items.length,
          itemBuilder: (context, index) {
            final item = items[index];
            final color = item['color'] as Color;
            return Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: InkWell(
                borderRadius: BorderRadius.circular(14),
                onTap: () => _showSnackBar(context, 'انتقال إلى: ${item['title']} لـ ${child.name}'),
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

  Widget _buildChildExamsSection(DemoChildData child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'الاختبارات ونتائج التقييم:',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        ...child.exams.map((exam) {
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
                  width: 42,
                  height: 42,
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    '${exam.score}%',
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ),
                title: Text(
                  exam.title,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  'المقرر: ${exam.scope} • ${exam.date}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                trailing: const Icon(Icons.check_circle_rounded, size: 18, color: AppTheme.statusPresent),
              ),
            ),
          );
        }),
      ],
    );
  }

  Widget _buildChildAwardsSection(DemoChildData child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'أوسمة التميز:',
          style: TextStyle(
            fontSize: 15,
            fontWeight: FontWeight.bold,
            color: AppTheme.textPrimary,
          ),
        ),
        const SizedBox(height: 8),
        ...child.awards.map((award) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: ListTile(
                leading: Text(award.icon, style: const TextStyle(fontSize: 26)),
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
