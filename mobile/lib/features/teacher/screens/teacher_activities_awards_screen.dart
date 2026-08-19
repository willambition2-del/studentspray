import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../../activities_shelf/providers/activities_shelf_provider.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherActivitiesAwardsScreen extends ConsumerStatefulWidget {
  const TeacherActivitiesAwardsScreen({super.key});

  @override
  ConsumerState<TeacherActivitiesAwardsScreen> createState() => _TeacherActivitiesAwardsScreenState();
}

class _TeacherActivitiesAwardsScreenState extends ConsumerState<TeacherActivitiesAwardsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final activitiesAsync = ref.watch(studentActivitiesProvider);
    final competitionsAsync = ref.watch(studentCompetitionsProvider);
    final awardsAsync = ref.watch(teacherAwardsListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الأنشطة والمسابقات والجوائز'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'الأنشطة', icon: Icon(Icons.event_available_rounded, size: 18)),
            Tab(text: 'المسابقات', icon: Icon(Icons.emoji_events_rounded, size: 18)),
            Tab(text: 'أوسمة التميز', icon: Icon(Icons.military_tech_rounded, size: 18)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Tab 1: Activities
          activitiesAsync.when(
            data: (activities) {
              if (activities.isEmpty) {
                return const EmptyStateView(
                  title: 'لا توجد أنشطة معلنة حاليًا',
                  subtitle: 'يتم نشر الأنشطة التربوية والقرآنية من خلال إدارة الملتقى',
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: activities.length,
                itemBuilder: (context, index) {
                  final act = activities[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  act.title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryDark,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: AppTheme.primary.withAlpha(20),
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  act.typeLabel,
                                  style: const TextStyle(
                                    color: AppTheme.primary,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (act.description != null) ...[
                            const SizedBox(height: 6),
                            Text(act.description!, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                'التاريخ: ${act.startsAt.toIso8601String().substring(0, 10)}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                              ),
                              if (act.location != null) ...[
                                const SizedBox(width: 12),
                                Text('الموقع: ${act.location}', style: const TextStyle(fontSize: 12, color: AppTheme.textMuted)),
                              ],
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل الأنشطة...'),
            error: (err, _) => ErrorView(message: err.toString()),
          ),

          // Tab 2: Competitions
          competitionsAsync.when(
            data: (competitions) {
              if (competitions.isEmpty) {
                return const EmptyStateView(
                  title: 'لا توجد مسابقات قرآنية معلنة حاليًا',
                  subtitle: 'يتم الإعلان عن المسابقات والتصفيات المركزية من إدارة الفرع',
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: competitions.length,
                itemBuilder: (context, index) {
                  final comp = competitions[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(
                                child: Text(
                                  comp.title,
                                  style: const TextStyle(
                                    fontSize: 16,
                                    fontWeight: FontWeight.bold,
                                    color: AppTheme.primaryDark,
                                  ),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                  color: Colors.amber.shade100,
                                  borderRadius: BorderRadius.circular(6),
                                ),
                                child: Text(
                                  comp.categoryLabel,
                                  style: TextStyle(
                                    color: Colors.amber.shade900,
                                    fontWeight: FontWeight.bold,
                                    fontSize: 11,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          if (comp.description != null) ...[
                            const SizedBox(height: 6),
                            Text(comp.description!, style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                          ],
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Text(
                                'الدرجة العظمى: ${comp.maxScore.toStringAsFixed(0)}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                              ),
                              const SizedBox(width: 12),
                              Text(
                                'التاريخ: ${comp.startsAt.toIso8601String().substring(0, 10)}',
                                style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل المسابقات...'),
            error: (err, _) => ErrorView(message: err.toString()),
          ),

          // Tab 3: Awards & Badges
          awardsAsync.when(
            data: (awards) {
              if (awards.isEmpty) {
                return const EmptyStateView(
                  title: 'لا توجد أوسمة معرفة في النظام',
                  subtitle: 'يتم تعريف أوسمة التميز من لوحة التحكم',
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: awards.length,
                itemBuilder: (context, index) {
                  final award = awards[index];
                  return Card(
                    margin: const EdgeInsets.only(bottom: 12),
                    child: ListTile(
                      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                      leading: CircleAvatar(
                        radius: 24,
                        backgroundColor: Colors.amber.shade100,
                        child: const Icon(Icons.military_tech_rounded, color: Colors.amber, size: 28),
                      ),
                      title: Text(
                        award.name,
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      subtitle: Text(
                        award.description ?? 'وسام تميز وتفوق للطلاب المتميزين',
                        style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                      ),
                      trailing: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppTheme.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                        ),
                        onPressed: () => _showGrantAwardDialog(context, award),
                        child: const Text('منح لطالب'),
                      ),
                    ),
                  );
                },
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل أوسمة التميز...'),
            error: (err, _) => ErrorView(message: err.toString()),
          ),
        ],
      ),
    );
  }

  void _showGrantAwardDialog(BuildContext context, TeacherAwardOption award) {
    final studentsAsync = ref.read(teacherStudentsProvider);
    final allStudents = studentsAsync.valueOrNull ?? [];

    if (allStudents.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('لا توجد بيانات طلاب متاحة لمنح الوسام')),
      );
      return;
    }

    String selectedStudentId = allStudents.first.studentId;
    final reasonController = TextEditingController(text: 'تميز وتفوق في الحفظ والانضباط');

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text('منح ${award.name}'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: selectedStudentId,
                decoration: const InputDecoration(
                  labelText: 'اختر الطالب المرشح',
                  border: OutlineInputBorder(),
                ),
                items: allStudents
                    .map((s) => DropdownMenuItem(
                          value: s.studentId,
                          child: Text(s.displayName),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) setDialogState(() => selectedStudentId = val);
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: reasonController,
                decoration: const InputDecoration(
                  labelText: 'سبب منح الوسام وكلمة التكريم',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('إلغاء'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary, foregroundColor: Colors.white),
              onPressed: () async {
                try {
                  final ops = ref.read(teacherOperationsProvider);
                  await ops.grantAward(
                    awardId: award.id,
                    studentId: selectedStudentId,
                    reason: reasonController.text.trim(),
                  );
                  if (context.mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('تم منح الوسام للطالب بنجاح')),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('تعذر منح الوسام: $e')),
                    );
                  }
                }
              },
              child: const Text('تأكيد المنح'),
            ),
          ],
        ),
      ),
    );
  }
}
