import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_shadows.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/utils/quran_data.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherStudentDetailScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String studentName;

  const TeacherStudentDetailScreen({
    super.key,
    required this.studentId,
    required this.studentName,
  });

  @override
  ConsumerState<TeacherStudentDetailScreen> createState() => _TeacherStudentDetailScreenState();
}

class _TeacherStudentDetailScreenState extends ConsumerState<TeacherStudentDetailScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 5, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final historyAsync = ref.watch(studentFullHistoryProvider(widget.studentId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: Text(widget.studentName),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: const TextStyle(
            fontFamily: AppTypography.fontFamily,
            fontWeight: FontWeight.bold,
            fontSize: 13,
          ),
          tabs: const [
            Tab(text: 'نظرة عامة والتقدم', icon: Icon(Icons.analytics_outlined, size: 18)),
            Tab(text: 'سجل الحفظ', icon: Icon(Icons.menu_book_outlined, size: 18)),
            Tab(text: 'سجل المراجعة', icon: Icon(Icons.refresh, size: 18)),
            Tab(text: 'التقييمات التربوية', icon: Icon(Icons.star_outline, size: 18)),
            Tab(text: 'الخطة والدرجات', icon: Icon(Icons.assignment_outlined, size: 18)),
          ],
        ),
      ),
      body: historyAsync.when(
        data: (data) {
          final progress = data['progress'] as Map<String, dynamic>? ?? {};
          final memorization = (data['memorization'] as List? ?? [])
              .map((m) => m as Map<String, dynamic>)
              .toList();
          final revision = (data['revision'] as List? ?? [])
              .map((r) => r as Map<String, dynamic>)
              .toList();
          final evaluations = (data['evaluations'] as List? ?? [])
              .map((e) => TeacherEvaluationItem.fromJson(e as Map<String, dynamic>))
              .toList();

          final studentData = progress['student'] as Map<String, dynamic>? ?? {};
          final metrics = progress['metrics'] as Map<String, dynamic>? ?? {};
          final activePlan = progress['activePlan'] as Map<String, dynamic>?;

          return TabBarView(
            controller: _tabController,
            children: [
              // Tab 0: Overview & Progress
              _buildOverviewTab(studentData, metrics, activePlan),

              // Tab 1: Memorization History
              _buildMemorizationTab(memorization),

              // Tab 2: Revision History
              _buildRevisionTab(revision),

              // Tab 3: Evaluations History
              _buildEvaluationsTab(evaluations),

              // Tab 4: Plan & Exams
              _buildPlanAndExamsTab(activePlan, metrics),
            ],
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل ملف الطالب الكامل...'),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.invalidate(studentFullHistoryProvider(widget.studentId)),
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: const BoxDecoration(
          color: AppColors.surface,
          boxShadow: AppShadows.elevatedCard,
        ),
        child: SafeArea(
          child: Row(
            children: [
              Expanded(
                child: ElevatedButton.icon(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: () {
                    context.push(
                      '/teacher/students/${widget.studentId}/memorization?name=${Uri.encodeComponent(widget.studentName)}',
                    );
                  },
                  icon: const Icon(Icons.record_voice_over_outlined, size: 16),
                  label: const Text('تسميع حفظ', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: OutlinedButton.icon(
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                  onPressed: () {
                    context.push(
                      '/teacher/students/${widget.studentId}/revision?name=${Uri.encodeComponent(widget.studentName)}',
                    );
                  },
                  icon: const Icon(Icons.replay, size: 16),
                  label: const Text('مراجعة', style: TextStyle(fontSize: 13)),
                ),
              ),
              const SizedBox(width: 8),
              InkWell(
                onTap: () => _showAddEvaluationModal(context),
                borderRadius: BorderRadius.circular(AppRadius.md),
                child: Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: AppColors.accentGoldSoft,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: const Icon(Icons.star, color: AppColors.accentGoldDark, size: 22),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildOverviewTab(
    Map<String, dynamic> student,
    Map<String, dynamic> metrics,
    Map<String, dynamic>? activePlan,
  ) {
    final attRate = (metrics['attendanceRate'] as num?)?.toInt() ?? 100;
    final totalMemos = (metrics['totalMemorizationSessions'] as num?)?.toInt() ?? 0;
    final avgMemoScore = (metrics['avgMemorizationScore'] as num?)?.toDouble() ?? 100.0;
    final totalRevs = (metrics['totalRevisionSessions'] as num?)?.toInt() ?? 0;
    final avgRevScore = (metrics['avgRevisionScore'] as num?)?.toDouble() ?? 100.0;
    final planPercentage = (activePlan?['progressPercentage'] as num?)?.toInt() ?? 0;

    final initial = widget.studentName.isNotEmpty ? widget.studentName[0] : 'ط';

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Profile Info Header Card
        ModernCard(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: AppColors.primarySoft,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                alignment: Alignment.center,
                child: Text(
                  initial,
                  style: const TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: AppColors.primaryDark,
                    fontSize: 22,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.studentName,
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'الرقم التعريفي: ${student["studentNumber"] ?? "STU-2026"}',
                      style: AppTypography.label,
                    ),
                    if (student['activeHalaqa'] is Map) ...[
                      const SizedBox(height: 2),
                      Text(
                        'الحلقة: ${(student["activeHalaqa"] as Map)["name"]}',
                        style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 14),

        // Metrics Grid
        Row(
          children: [
            Expanded(
              child: MetricCard(
                title: 'معدل الحضور',
                value: '$attRate%',
                icon: Icons.fact_check_outlined,
                iconColor: attRate >= 80 ? AppColors.statusPresent : AppColors.statusAbsent,
                iconBgColor: attRate >= 80 ? AppColors.statusPresentBg : AppColors.statusAbsentBg,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: MetricCard(
                title: 'إنجاز الخطة',
                value: '$planPercentage%',
                icon: Icons.track_changes,
                iconColor: AppColors.primary,
                iconBgColor: AppColors.primarySoft,
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: MetricCard(
                title: 'جلسات الحفظ',
                value: '$totalMemos',
                subtitle: 'متوسط: ${avgMemoScore.toStringAsFixed(1)}',
                icon: Icons.menu_book_outlined,
                iconColor: AppColors.secondary,
                iconBgColor: AppColors.secondarySoft,
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: MetricCard(
                title: 'جلسات المراجعة',
                value: '$totalRevs',
                subtitle: 'متوسط: ${avgRevScore.toStringAsFixed(1)}',
                icon: Icons.refresh,
                iconColor: const Color(0xFF4F46E5),
                iconBgColor: const Color(0xFFEEF2FF),
              ),
            ),
          ],
        ),
        const SizedBox(height: 14),

        // Active Plan Summary Card
        if (activePlan != null) ...[
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'الخطة التعليمية الحالية',
                      style: TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontWeight: FontWeight.bold,
                        fontSize: 14,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    Text(
                      '$planPercentage% منجز',
                      style: AppTypography.labelBold.copyWith(color: AppColors.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  activePlan['name'] as String? ?? 'خطة الحفظ والمراجعة',
                  style: AppTypography.bodyMedium,
                ),
                const SizedBox(height: 10),
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppRadius.full),
                  child: LinearProgressIndicator(
                    value: (planPercentage / 100).clamp(0.0, 1.0),
                    backgroundColor: AppColors.surfaceMuted,
                    valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primary),
                    minHeight: 6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildMemorizationTab(List<Map<String, dynamic>> records) {
    if (records.isEmpty) {
      return const EmptyStateView(
        title: 'لا توجد سجلات حفظ مسجلة للطالب',
        subtitle: 'يمكنك استخدام زر "تسميع حفظ" بالأسفل لرصد أول جلسة',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: records.length,
      itemBuilder: (context, index) {
        final rec = records[index];
        final surahNum = rec['surahNumber'] as int?;
        final surahName = QuranData.getSurahName(surahNum);
        final score = rec['evaluationScore'] ?? 100;
        final rating = rec['rating'] ?? 'EXCELLENT';
        final mistakes = rec['mistakesCount'] ?? 0;
        final date = rec['date'] as String? ?? '';
        final notes = rec['teacherNotes'] as String?;

        return ModernCard(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'سورة $surahName (${rec["fromAyah"]}-${rec["toAyah"]})',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      'درجة: $score',
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        color: AppColors.primaryDark,
                        fontWeight: FontWeight.bold,
                        fontSize: 11.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'التاريخ: $date • التقييم: $rating • أخطاء: $mistakes',
                style: AppTypography.label,
              ),
              if (notes != null && notes.isNotEmpty) ...[
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceMuted,
                    borderRadius: BorderRadius.circular(AppRadius.sm),
                  ),
                  child: Text('ملاحظات المعلم: $notes', style: AppTypography.secondary),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildRevisionTab(List<Map<String, dynamic>> records) {
    if (records.isEmpty) {
      return const EmptyStateView(
        title: 'لا توجد سجلات مراجعة مسجلة للطالب',
        subtitle: 'يمكنك استخدام زر "مراجعة" بالأسفل لرصد جلسة مراجعة',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: records.length,
      itemBuilder: (context, index) {
        final rec = records[index];
        final surahNum = rec['surahNumber'] as int?;
        final surahName = QuranData.getSurahName(surahNum);
        final score = rec['evaluationScore'] ?? 100;
        final rating = rec['rating'] ?? 'EXCELLENT';
        final date = rec['date'] as String? ?? '';
        final notes = rec['teacherNotes'] as String?;

        return ModernCard(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    surahNum != null ? 'مراجعة: سورة $surahName (${rec["fromAyah"] ?? 1}-${rec["toAyah"] ?? 10})' : 'مراجعة جزء/حزب',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF4F46E5),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEEF2FF),
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                    ),
                    child: Text(
                      'درجة: $score',
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        color: Color(0xFF4F46E5),
                        fontWeight: FontWeight.bold,
                        fontSize: 11.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 6),
              Text(
                'التاريخ: $date • التقييم: $rating',
                style: AppTypography.label,
              ),
              if (notes != null && notes.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('ملاحظات المعلم: $notes', style: AppTypography.secondary),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildEvaluationsTab(List<TeacherEvaluationItem> evaluations) {
    if (evaluations.isEmpty) {
      return const EmptyStateView(
        title: 'لا توجد تقييمات تربوية مسجلة للطالب',
        subtitle: 'يمكنك النقر على زر النجمة بالأسفل لإضافة تقييم سلوكي وتربوي',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: evaluations.length,
      itemBuilder: (context, index) {
        final ev = evaluations[index];
        return ModernCard(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.all(14),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'تقييم: ${ev.ratingLabel}',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 15,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.accentGoldSoft,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                    ),
                    child: Text(
                      '${ev.overallScore.toStringAsFixed(0)} / 100',
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontWeight: FontWeight.bold,
                        color: AppColors.accentGoldDark,
                        fontSize: 11.5,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  _buildEvalPill('السلوك', ev.behaviorScore),
                  const SizedBox(width: 6),
                  _buildEvalPill('الانضباط', ev.discipline),
                  const SizedBox(width: 6),
                  _buildEvalPill('المشاركة', ev.participation),
                ],
              ),
              if (ev.teacherNotes != null && ev.teacherNotes!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text('توجيه المعلم: ${ev.teacherNotes}', style: AppTypography.secondary),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildPlanAndExamsTab(Map<String, dynamic>? activePlan, Map<String, dynamic> metrics) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (activePlan != null) ...[
          ModernCard(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'الخطة المقررة',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                const SizedBox(height: 8),
                Text('اسم الخطة: ${activePlan["name"]}', style: AppTypography.body),
                const SizedBox(height: 4),
                Text('النوع: ${activePlan["type"] ?? "حفظ ومراجعة"}', style: AppTypography.secondary),
                const SizedBox(height: 4),
                Text('نسبة الإنجاز: ${activePlan["progressPercentage"] ?? 0}%', style: AppTypography.labelBold.copyWith(color: AppColors.primary)),
              ],
            ),
          ),
        ] else ...[
          const EmptyStateView(
            title: 'لا توجد خطة مقررة للطالب حالياً',
            subtitle: 'يتم إسناد الخطط من خلال قسم الخطط التعليمية',
          ),
        ],
      ],
    );
  }

  Widget _buildEvalPill(String label, double score) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.surfaceMuted,
        borderRadius: BorderRadius.circular(AppRadius.sm),
      ),
      child: Text(
        '$label: ${score.toStringAsFixed(0)}',
        style: const TextStyle(
          fontFamily: AppTypography.fontFamily,
          fontSize: 11,
          fontWeight: FontWeight.bold,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }

  void _showAddEvaluationModal(BuildContext context) {
    double behavior = 90;
    double discipline = 90;
    double participation = 90;
    String rating = 'VERY_GOOD';
    final notesController = TextEditingController();

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => StatefulBuilder(
        builder: (context, setModalState) => Padding(
          padding: EdgeInsets.only(
            left: 20,
            right: 20,
            top: 20,
            bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'إضافة تقييم تربوي لـ ${widget.studentName}',
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 20),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text('السلوك والآداب (${behavior.toInt()})', style: AppTypography.secondaryMedium),
              Slider(
                value: behavior,
                min: 50,
                max: 100,
                divisions: 10,
                activeColor: AppColors.primary,
                onChanged: (val) => setModalState(() => behavior = val),
              ),
              Text('الانضباط والالتزام (${discipline.toInt()})', style: AppTypography.secondaryMedium),
              Slider(
                value: discipline,
                min: 50,
                max: 100,
                divisions: 10,
                activeColor: AppColors.primary,
                onChanged: (val) => setModalState(() => discipline = val),
              ),
              Text('المشاركة والتفاعل (${participation.toInt()})', style: AppTypography.secondaryMedium),
              Slider(
                value: participation,
                min: 50,
                max: 100,
                divisions: 10,
                activeColor: AppColors.primary,
                onChanged: (val) => setModalState(() => participation = val),
              ),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'توجيهات وملاحظات المعلم',
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 44),
                ),
                onPressed: () async {
                  final overall = (behavior + discipline + participation) / 3;
                  if (overall >= 90) {
                    rating = 'EXCELLENT';
                  } else if (overall >= 80) {
                    rating = 'VERY_GOOD';
                  } else if (overall >= 70) {
                    rating = 'GOOD';
                  } else {
                    rating = 'ACCEPTABLE';
                  }

                  try {
                    final ops = ref.read(teacherOperationsProvider);
                    await ops.submitStudentEvaluation(
                      studentId: widget.studentId,
                      halaqaId: 'halaqa-auto',
                      evaluationDate: DateTime.now().toIso8601String().substring(0, 10),
                      behaviorScore: behavior,
                      discipline: discipline,
                      participation: participation,
                      overallScore: overall,
                      rating: rating,
                      teacherNotes: notesController.text.trim(),
                    );
                    if (context.mounted) {
                      Navigator.pop(ctx);
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('✓ تم تسجيل التقييم التربوي بنجاح'),
                          backgroundColor: AppColors.statusPresent,
                        ),
                      );
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('تعذر حفظ التقييم: $e'),
                          backgroundColor: AppColors.statusAbsent,
                        ),
                      );
                    }
                  }
                },
                child: const Text('حفظ التقييم'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
