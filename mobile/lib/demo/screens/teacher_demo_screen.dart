import 'package:flutter/material.dart';
import '../../../core/theme/app_theme.dart';
import '../demo_data.dart';
import '../demo_models.dart';
import '../widgets/demo_floating_bar.dart';

class TeacherDemoScreen extends StatefulWidget {
  const TeacherDemoScreen({super.key});

  @override
  State<TeacherDemoScreen> createState() => _TeacherDemoScreenState();
}

class _TeacherDemoScreenState extends State<TeacherDemoScreen> {
  final DemoTeacherData teacherData = DemoData.teacher;
  late List<DemoTask> tasks;
  late List<DemoStudentListItem> students;

  @override
  void initState() {
    super.initState();
    tasks = List.from(teacherData.tasks);
    students = List.from(teacherData.students);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppTheme.surfaceLight,
      appBar: AppBar(
        title: const Text('الملتقى القرآني — المعلم (معاينة)'),
        backgroundColor: AppTheme.primaryDark,
        elevation: 0,
        actions: [
          IconButton(
            icon: Badge(
              label: Text('${teacherData.notificationsCount}'),
              child: const Icon(Icons.notifications_outlined),
            ),
            tooltip: 'الإشعارات',
            onPressed: () {
              _showInfoSnackBar('شاشة الإشعارات المركزية');
            },
          ),
          IconButton(
            icon: Badge(
              label: Text('${teacherData.unreadMessages}'),
              child: const Icon(Icons.chat_bubble_outline_rounded),
            ),
            tooltip: 'المحادثات',
            onPressed: () {
              _showInfoSnackBar('نظام المحادثات والقنوات');
            },
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
                  // Greeting & Profile Header
                  _buildHeaderCard(),

                  const SizedBox(height: 16),

                  // Halaqa Workspace Card
                  _buildHalaqaWorkspaceCard(),

                  const SizedBox(height: 20),

                  // Quick Action Buttons Grid
                  _buildQuickActionsGrid(),

                  const SizedBox(height: 20),

                  // Tasks Section
                  _buildTasksSection(),

                  const SizedBox(height: 20),

                  // Student Roster Section
                  _buildStudentsRosterSection(),
                ],
              ),
            ),
          ),
          const DemoFloatingReturnButton(),
        ],
      ),
    );
  }

  Widget _buildHeaderCard() {
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
              '👨‍🏫',
              style: TextStyle(fontSize: 24),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'حياك الله، ${teacherData.name}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  teacherData.centerName,
                  style: TextStyle(
                    color: Colors.white.withAlpha(200),
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.white.withAlpha(25),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.calendar_today_rounded, size: 12, color: AppTheme.accentGoldLight),
                SizedBox(width: 4),
                Text(
                  'اليوم',
                  style: TextStyle(color: AppTheme.accentGoldLight, fontSize: 11),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHalaqaWorkspaceCard() {
    final double attendancePercent = (teacherData.presentToday / teacherData.totalStudents) * 100;

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
                Text(
                  teacherData.halaqaName,
                  style: const TextStyle(
                    fontSize: 17,
                    fontWeight: FontWeight.bold,
                    color: AppTheme.primaryDark,
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${teacherData.totalStudents} طالباً',
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                Expanded(
                  child: _buildMetricTile(
                    label: 'حضور اليوم',
                    value: '${teacherData.presentToday} / ${teacherData.totalStudents}',
                    subtext: '${attendancePercent.toStringAsFixed(0)}% نسبة الحضور',
                    icon: Icons.check_circle_outline_rounded,
                    color: AppTheme.statusPresent,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _buildMetricTile(
                    label: 'المستهدف الحالي',
                    value: 'سورة البقرة',
                    subtext: 'الربع الثالث',
                    icon: Icons.menu_book_rounded,
                    color: AppTheme.accentGold,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricTile({
    required String label,
    required String value,
    required String subtext,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withAlpha(15),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(40)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            value,
            style: TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtext,
            style: const TextStyle(fontSize: 10, color: AppTheme.textMuted),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionsGrid() {
    final actions = [
      {'title': 'تسجيل الحضور', 'icon': Icons.how_to_reg_rounded, 'color': AppTheme.primary},
      {'title': 'رصد الحفظ', 'icon': Icons.mic_none_rounded, 'color': AppTheme.primaryLight},
      {'title': 'رصد المراجعة', 'icon': Icons.repeat_rounded, 'color': const Color(0xFF0D9488)},
      {'title': 'متابعة الطلاب', 'icon': Icons.insights_rounded, 'color': const Color(0xFFD97706)},
      {'title': 'الأنشطة والمسابقات', 'icon': Icons.emoji_events_outlined, 'color': const Color(0xFFE11D48)},
      {'title': 'الرف العام', 'icon': Icons.menu_book_rounded, 'color': const Color(0xFF4F46E5)},
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'العمليات السريعة:',
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
                onTap: () {
                  _showInfoSnackBar('تم النقر على: ${act['title']}');
                },
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

  Widget _buildTasksSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'مهام ومتابعات المعلم:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            TextButton(
              onPressed: () => _showInfoSnackBar('عرض كافة المهام والتكليفات'),
              child: const Text('عرض الكل'),
            ),
          ],
        ),
        const SizedBox(height: 4),
        ...tasks.map((task) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: ListTile(
                leading: Checkbox(
                  value: task.isCompleted,
                  activeColor: AppTheme.primary,
                  onChanged: (val) {
                    setState(() {
                      final idx = tasks.indexWhere((t) => t.id == task.id);
                      if (idx != -1) {
                        tasks[idx] = DemoTask(
                          id: task.id,
                          title: task.title,
                          deadline: task.deadline,
                          priority: task.priority,
                          isCompleted: val ?? false,
                        );
                      }
                    });
                  },
                ),
                title: Text(
                  task.title,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    decoration: task.isCompleted ? TextDecoration.lineThrough : null,
                    color: task.isCompleted ? AppTheme.textMuted : AppTheme.textPrimary,
                  ),
                ),
                subtitle: Text(
                  'الموعد: ${task.deadline}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: task.priority == 'HIGH'
                        ? AppTheme.statusAbsent.withAlpha(20)
                        : AppTheme.primary.withAlpha(20),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    task.priority == 'HIGH' ? 'هام' : 'عادي',
                    style: TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: task.priority == 'HIGH' ? AppTheme.statusAbsent : AppTheme.primary,
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

  Widget _buildStudentsRosterSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'سجل طلاب الحلقة:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppTheme.textPrimary,
              ),
            ),
            Text(
              '${students.length} طلاب',
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ...students.map((st) {
          Color statusColor;
          String statusText;
          switch (st.attendanceStatus) {
            case 'PRESENT':
              statusColor = AppTheme.statusPresent;
              statusText = 'حاضر';
              break;
            case 'LATE':
              statusColor = AppTheme.statusLate;
              statusText = 'متأخر';
              break;
            case 'EXCUSED':
              statusColor = AppTheme.statusExcused;
              statusText = 'معذور';
              break;
            default:
              statusColor = AppTheme.statusAbsent;
              statusText = 'غائب';
          }

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Card(
              margin: EdgeInsets.zero,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(14),
                side: const BorderSide(color: AppTheme.dividerColor),
              ),
              child: ListTile(
                leading: CircleAvatar(
                  backgroundColor: AppTheme.primary.withAlpha(25),
                  child: Text(
                    st.name.substring(0, 1),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      color: AppTheme.primaryDark,
                    ),
                  ),
                ),
                title: Text(
                  st.name,
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
                ),
                subtitle: Text(
                  'الحفظ الحالي: ${st.currentSurah}',
                  style: const TextStyle(fontSize: 11, color: AppTheme.textSecondary),
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withAlpha(20),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: statusColor,
                        ),
                      ),
                    ),
                    if (st.score > 0) ...[
                      const SizedBox(height: 3),
                      Text(
                        '${st.score}/100',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: AppTheme.primaryDark,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          );
        }),
      ],
    );
  }

  void _showInfoSnackBar(String text) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(text, textDirection: TextDirection.rtl),
        duration: const Duration(seconds: 2),
        backgroundColor: AppTheme.primaryDark,
      ),
    );
  }
}
