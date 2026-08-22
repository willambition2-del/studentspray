import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
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
    final activitiesAsync = ref.watch(generalActivitiesProvider);
    final competitionsAsync = ref.watch(generalCompetitionsProvider);
    final awardsAsync = ref.watch(teacherAwardsListProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('الأنشطة والمسابقات والجوائز'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          unselectedLabelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontWeight: FontWeight.w500,
            fontSize: 13,
          ),
          tabs: const [
            Tab(text: 'الأنشطة', icon: Icon(Icons.event_available_outlined, size: 18)),
            Tab(text: 'المسابقات', icon: Icon(Icons.emoji_events_outlined, size: 18)),
            Tab(text: 'أوسمة التميز', icon: Icon(Icons.emoji_events_outlined, size: 18)),
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
                  icon: Icons.event_busy_outlined,
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: activities.length,
                itemBuilder: (context, index) {
                  final act = activities[index];
                  return ModernCard(
                    margin: const EdgeInsets.only(bottom: 12),
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
                                  fontFamily: AppTypography.fontFamily,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.primarySoft,
                                borderRadius: BorderRadius.circular(AppRadius.full),
                              ),
                              child: Text(
                                act.typeLabel,
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  color: AppColors.primaryDark,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (act.description != null) ...[
                          const SizedBox(height: 6),
                          Text(
                            act.description!,
                            style: AppTypography.secondary,
                          ),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            const Icon(Icons.calendar_today_outlined, size: 14, color: AppColors.textMuted),
                            const SizedBox(width: 4),
                            Text(
                              'التاريخ: ${act.startsAt.toIso8601String().substring(0, 10)}',
                              style: AppTypography.label,
                            ),
                            if (act.location != null) ...[
                              const SizedBox(width: 12),
                              const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textMuted),
                              const SizedBox(width: 4),
                              Text(act.location!, style: AppTypography.label),
                            ],
                          ],
                        ),
                      ],
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
                  icon: Icons.emoji_events_outlined,
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: competitions.length,
                itemBuilder: (context, index) {
                  final comp = competitions[index];
                  return ModernCard(
                    margin: const EdgeInsets.only(bottom: 12),
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
                                  fontFamily: AppTypography.fontFamily,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.accentGoldSoft,
                                borderRadius: BorderRadius.circular(AppRadius.full),
                              ),
                              child: Text(
                                comp.categoryLabel,
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  color: AppColors.accentGoldDark,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 11,
                                ),
                              ),
                            ),
                          ],
                        ),
                        if (comp.description != null) ...[
                          const SizedBox(height: 6),
                          Text(comp.description!, style: AppTypography.secondary),
                        ],
                        const SizedBox(height: 10),
                        Row(
                          children: [
                            Text(
                              'الدرجة العظمى: ${comp.maxScore.toStringAsFixed(0)}',
                              style: AppTypography.labelBold.copyWith(color: AppColors.accentGoldDark),
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'التاريخ: ${comp.startsAt.toIso8601String().substring(0, 10)}',
                              style: AppTypography.label,
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل المسابقات...'),
            error: (err, _) => ErrorView(message: err.toString()),
          ),

          // Tab 3: Awards
          awardsAsync.when(
            data: (awards) {
              if (awards.isEmpty) {
                return const EmptyStateView(
                  title: 'لا توجد أوسمة تميز معرفة',
                  subtitle: 'يتم اعتماد الأوسمة والجوائز التشجيعية من إدارة الملتقى',
                  icon: Icons.military_tech_outlined,
                );
              }
              return ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: awards.length,
                itemBuilder: (context, index) {
                  final award = awards[index];
                  return ModernCard(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: AppColors.accentGoldSoft,
                            borderRadius: BorderRadius.circular(AppRadius.md),
                          ),
                          child: const Icon(
                            Icons.emoji_events_outlined,
                            color: AppColors.accentGoldDark,
                            size: 26,
                          ),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                award.name,
                                style: const TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: AppColors.textPrimary,
                                ),
                              ),
                              if (award.description != null) ...[
                                const SizedBox(height: 2),
                                Text(
                                  award.description!,
                                  style: AppTypography.secondary,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                              const SizedBox(height: 4),
                              Text(
                                'النقاط التحفيزية: +${award.points}',
                                style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                              ),
                            ],
                          ),
                        ),
                        ElevatedButton(
                          onPressed: () => _showGrantAwardDialog(context, ref, award),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            minimumSize: const Size(0, 36),
                          ),
                          child: const Text('منح لطالب', style: TextStyle(fontSize: 12)),
                        ),
                      ],
                    ),
                  );
                },
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل الأوسمة...'),
            error: (err, _) => ErrorView(message: err.toString()),
          ),
        ],
      ),
    );
  }

  void _showGrantAwardDialog(BuildContext context, WidgetRef ref, TeacherAwardOption award) {
    final studentsAsync = ref.read(teacherStudentsProvider);
    final allStudents = studentsAsync.valueOrNull ?? [];

    if (allStudents.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('لا توجد بيانات طلاب متاحة حالياً')),
      );
      return;
    }

    String selectedStudentId = allStudents.first.studentId;
    final notesController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.lg)),
          title: Text(
            'منح وسام: ${award.name}',
            style: const TextStyle(fontFamily: AppTypography.fontFamily, fontWeight: FontWeight.bold, fontSize: 16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              DropdownButtonFormField<String>(
                initialValue: selectedStudentId,
                decoration: const InputDecoration(labelText: 'اختر الطالب المكرم'),
                items: allStudents
                    .map((s) => DropdownMenuItem(
                          value: s.studentId,
                          child: Text(s.displayName),
                        ))
                    .toList(),
                onChanged: (val) {
                  if (val != null) {
                    setModalState(() => selectedStudentId = val);
                  }
                },
              ),
              const SizedBox(height: 12),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(hintText: 'سبب التكريم والمنح...'),
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
                Navigator.pop(ctx);
                try {
                  await ref.read(teacherOperationsProvider).grantAward(
                        studentId: selectedStudentId,
                        awardId: award.id,
                        reason: notesController.text.isNotEmpty ? notesController.text : 'تكريم وتميز قرآني',
                      );
                  ref.invalidate(teacherAwardsListProvider);
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('✓ تم منح الوسام للطالب بنجاح'),
                        backgroundColor: AppColors.statusPresent,
                      ),
                    );
                  }
                } catch (e) {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('فشل منح الوسام: $e'), backgroundColor: AppColors.statusAbsent),
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
