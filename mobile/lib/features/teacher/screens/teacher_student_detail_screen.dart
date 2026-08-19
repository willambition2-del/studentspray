import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/quran_data.dart';
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
      appBar: AppBar(
        title: Text(widget.studentName),
        bottom: TabBar(
          controller: _tabController,
          isScrollable: true,
          tabs: const [
            Tab(text: 'نظرة عامة والتقدم', icon: Icon(Icons.analytics_outlined, size: 20)),
            Tab(text: 'سجل الحفظ', icon: Icon(Icons.menu_book_rounded, size: 20)),
            Tab(text: 'سجل المراجعة', icon: Icon(Icons.refresh_rounded, size: 20)),
            Tab(text: 'التقييمات التربوية', icon: Icon(Icons.star_half_rounded, size: 20)),
            Tab(text: 'الخطة والدرجات', icon: Icon(Icons.assignment_outlined, size: 20)),
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
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: Row(
          children: [
            Expanded(
              child: ElevatedButton.icon(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () {
                  context.push(
                    '/teacher/students/${widget.studentId}/memorization?name=${Uri.encodeComponent(widget.studentName)}',
                  );
                },
                icon: const Icon(Icons.record_voice_over_rounded, size: 18),
                label: const Text('تسميع حفظ'),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: OutlinedButton.icon(
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                onPressed: () {
                  context.push(
                    '/teacher/students/${widget.studentId}/revision?name=${Uri.encodeComponent(widget.studentName)}',
                  );
                },
                icon: const Icon(Icons.repeat_rounded, size: 18),
                label: const Text('مراجعة'),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              icon: const Icon(Icons.star_outline_rounded, color: AppTheme.primaryDark),
              tooltip: 'إضافة تقييم تربوي',
              onPressed: () {
                _showAddEvaluationModal(context);
              },
            ),
          ],
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

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Profile Info Header Card
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Row(
            children: [
              CircleAvatar(
                radius: 30,
                backgroundColor: AppTheme.primary.withAlpha(20),
                child: const Icon(Icons.person_rounded, color: AppTheme.primary, size: 36),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.studentName,
                      style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'الرقم التعريفي: ${student["studentNumber"] ?? "STU-2026"}',
                      style: const TextStyle(fontSize: 13, color: AppTheme.textMuted),
                    ),
                    if (student['activeHalaqa'] is Map) ...[
                      const SizedBox(height: 2),
                      Text(
                        'الحلقة: ${(student["activeHalaqa"] as Map)["name"]}',
                        style: const TextStyle(fontSize: 13, color: AppTheme.primaryDark, fontWeight: FontWeight.w600),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Metrics Grid
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                title: 'معدل الحضور',
                value: '$attRate%',
                icon: Icons.fact_check_rounded,
                color: attRate >= 80 ? AppTheme.statusPresent : AppTheme.statusAbsent,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricTile(
                title: 'إنجاز الخطة',
                value: '$planPercentage%',
                icon: Icons.track_changes_rounded,
                color: AppTheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricTile(
                title: 'جلسات الحفظ',
                value: '$totalMemos',
                subtitle: 'متوسط: ${avgMemoScore.toStringAsFixed(1)}',
                icon: Icons.auto_stories_rounded,
                color: Colors.teal,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricTile(
                title: 'جلسات المراجعة',
                value: '$totalRevs',
                subtitle: 'متوسط: ${avgRevScore.toStringAsFixed(1)}',
                icon: Icons.refresh_rounded,
                color: Colors.indigo,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // Active Plan Summary Card
        if (activePlan != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppTheme.primary.withAlpha(10),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppTheme.primary.withAlpha(30)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'الخطة التعليمية الحالية',
                      style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                    ),
                    Text(
                      '$planPercentage% منجز',
                      style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primary),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  activePlan['name'] as String? ?? 'خطة الحفظ والمراجعة',
                  style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w600, color: AppTheme.textPrimary),
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: planPercentage / 100,
                  backgroundColor: Colors.grey.shade300,
                  valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                  borderRadius: BorderRadius.circular(4),
                  minHeight: 8,
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
                    Text(
                      'سورة $surahName (${rec["fromAyah"]}-${rec["toAyah"]})',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'درجة: $score',
                        style: const TextStyle(color: AppTheme.primary, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'التاريخ: $date • التقييم: $rating • أخطاء: $mistakes',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
                if (notes != null && notes.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Text('ملاحظات المعلم: $notes', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                  ),
                ],
              ],
            ),
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
                    Text(
                      surahNum != null ? 'مراجعة: سورة $surahName (${rec["fromAyah"] ?? 1}-${rec["toAyah"] ?? 10})' : 'مراجعة حزب/جزء',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Colors.indigo),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.indigo.withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'درجة: $score',
                        style: const TextStyle(color: Colors.indigo, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                Text(
                  'التاريخ: $date • التقييم: $rating',
                  style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
                ),
                if (notes != null && notes.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text('ملاحظات المعلم: $notes', style: const TextStyle(fontSize: 12, color: AppTheme.textSecondary)),
                ],
              ],
            ),
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
                    Text(
                      'تقييم: ${ev.ratingLabel}',
                      style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppTheme.accentGold.withAlpha(30),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        '${ev.overallScore.toStringAsFixed(0)} / 100',
                        style: const TextStyle(fontWeight: FontWeight.bold, color: AppTheme.primaryDark, fontSize: 12),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    _buildEvalPill('السلوك', ev.behaviorScore),
                    const SizedBox(width: 8),
                    _buildEvalPill('الانضباط', ev.discipline),
                    const SizedBox(width: 8),
                    _buildEvalPill('المشاركة', ev.participation),
                  ],
                ),
                if (ev.teacherNotes != null && ev.teacherNotes!.isNotEmpty) ...[
                  const SizedBox(height: 10),
                  Text('توجيه المعلم: ${ev.teacherNotes}', style: const TextStyle(fontSize: 13, color: AppTheme.textSecondary)),
                ],
              ],
            ),
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
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('الخطة المقررة', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark)),
                  const SizedBox(height: 8),
                  Text('اسم الخطة: ${activePlan["name"]}'),
                  const SizedBox(height: 4),
                  Text('النوع: ${activePlan["type"] ?? "حفظ ومراجعة"}'),
                  const SizedBox(height: 4),
                  Text('نسبة الإنجاز: ${activePlan["progressPercentage"] ?? 0}%'),
                ],
              ),
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

  Widget _buildMetricTile({
    required String title,
    required String value,
    String? subtitle,
    required IconData icon,
    required Color color,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withAlpha(20),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: TextStyle(fontSize: 11, color: Colors.grey.shade600)),
                const SizedBox(height: 2),
                Text(value, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.textPrimary)),
                if (subtitle != null) ...[
                  const SizedBox(height: 1),
                  Text(subtitle, style: TextStyle(fontSize: 10, color: color, fontWeight: FontWeight.w600)),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEvalPill(String label, double score) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        '$label: ${score.toStringAsFixed(0)}',
        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: AppTheme.textPrimary),
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
      backgroundColor: Colors.white,
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
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppTheme.primaryDark),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close_rounded),
                    onPressed: () => Navigator.pop(ctx),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text('السلوك والآداب (${behavior.toInt()})'),
              Slider(
                value: behavior,
                min: 50,
                max: 100,
                divisions: 10,
                label: '${behavior.toInt()}',
                onChanged: (val) => setModalState(() => behavior = val),
              ),
              Text('الانضباط والالتزام (${discipline.toInt()})'),
              Slider(
                value: discipline,
                min: 50,
                max: 100,
                divisions: 10,
                label: '${discipline.toInt()}',
                onChanged: (val) => setModalState(() => discipline = val),
              ),
              Text('المشاركة والتفاعل (${participation.toInt()})'),
              Slider(
                value: participation,
                min: 50,
                max: 100,
                divisions: 10,
                label: '${participation.toInt()}',
                onChanged: (val) => setModalState(() => participation = val),
              ),
              TextField(
                controller: notesController,
                decoration: const InputDecoration(
                  labelText: 'توجيهات وملاحظات المعلم',
                  border: OutlineInputBorder(),
                ),
                maxLines: 2,
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
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
                          const SnackBar(content: Text('تم تسجيل التقييم التربوي بنجاح')),
                        );
                      }
                    } catch (e) {
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('تعذر حفظ التقييم: $e')),
                        );
                      }
                    }
                  },
                  child: const Text('حفظ التقييم'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
