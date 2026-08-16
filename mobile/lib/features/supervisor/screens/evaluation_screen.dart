import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../models/supervisor_models.dart';
import '../providers/supervisor_provider.dart';

class EvaluationScreen extends ConsumerStatefulWidget {
  final String visitId;

  const EvaluationScreen({super.key, required this.visitId});

  @override
  ConsumerState<EvaluationScreen> createState() => _EvaluationScreenState();
}

class _EvaluationScreenState extends ConsumerState<EvaluationScreen> {
  final Map<String, double> _criterionScores = {};
  final Map<String, bool> _criterionNotApplicable = {};
  final Map<String, TextEditingController> _criterionNotes = {};
  final _strengthsController = TextEditingController();
  final _improvementsController = TextEditingController();
  final _summaryController = TextEditingController();

  bool _isSavingDraft = false;
  bool _isSubmitting = false;
  EvaluationTemplateModel? _template;
  bool _isInitialized = false;

  @override
  void dispose() {
    _strengthsController.dispose();
    _improvementsController.dispose();
    _summaryController.dispose();
    for (final c in _criterionNotes.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _initFromData(Map<String, dynamic> data) {
    if (_isInitialized) return;
    _isInitialized = true;

    final templateJson = data['activeTemplate'] as Map<String, dynamic>?;
    if (templateJson != null) {
      _template = EvaluationTemplateModel.fromJson(templateJson);
    }

    final visit = data['visit'] as Map<String, dynamic>?;
    final eval = visit?['evaluation'] as Map<String, dynamic>?;

    if (eval != null) {
      _strengthsController.text = eval['strengths'] as String? ?? '';
      _improvementsController.text = eval['improvementAreas'] as String? ?? '';
      _summaryController.text = eval['summary'] as String? ?? '';

      final criteriaList = eval['criteriaEvaluations'] as List?;
      if (criteriaList != null) {
        for (final item in criteriaList) {
          final cId = item['criterionId'] as String;
          _criterionScores[cId] = (item['score'] as num?)?.toDouble() ?? 5.0;
          _criterionNotApplicable[cId] = item['notApplicable'] as bool? ?? false;
          _criterionNotes[cId] = TextEditingController(text: item['notes'] as String? ?? '');
        }
      }
    }

    // Default missing criteria to maxScore
    if (_template != null) {
      for (final axis in _template!.axes) {
        for (final criterion in axis.criteria) {
          if (!_criterionScores.containsKey(criterion.id)) {
            _criterionScores[criterion.id] = criterion.maxScore;
            _criterionNotApplicable[criterion.id] = false;
            _criterionNotes[criterion.id] = TextEditingController();
          }
        }
      }
    }
  }

  double _calculateCurrentTotal() {
    if (_template == null) return 0.0;
    double weightedScoreSum = 0;
    double totalWeight = 0;

    for (final axis in _template!.axes) {
      double axisEarned = 0;
      double axisMax = 0;

      for (final c in axis.criteria) {
        if (_criterionNotApplicable[c.id] == true) continue;
        final score = _criterionScores[c.id] ?? c.maxScore;
        axisEarned += score;
        axisMax += c.maxScore;
      }

      if (axisMax > 0) {
        final axisPercentage = (axisEarned / axisMax) * 100;
        weightedScoreSum += (axisPercentage * axis.weight) / 100;
        totalWeight += axis.weight;
      }
    }

    if (totalWeight == 0) return 0.0;
    return double.parse(((weightedScoreSum / totalWeight) * 100).toStringAsFixed(1));
  }

  List<Map<String, dynamic>> _buildCriteriaPayload() {
    final list = <Map<String, dynamic>>[];
    for (final entry in _criterionScores.entries) {
      list.add({
        'criterionId': entry.key,
        'score': entry.value,
        'notApplicable': _criterionNotApplicable[entry.key] ?? false,
        'notes': _criterionNotes[entry.key]?.text.trim(),
      });
    }
    return list;
  }

  Future<void> _saveDraft() async {
    setState(() => _isSavingDraft = true);
    try {
      final res = await ref.read(supervisorActionsProvider.notifier).saveEvaluationDraft(
            visitId: widget.visitId,
            templateId: _template?.id,
            criteria: _buildCriteriaPayload(),
            strengths: _strengthsController.text.trim(),
            improvementAreas: _improvementsController.text.trim(),
            summary: _summaryController.text.trim(),
          );

      if (!mounted) return;
      final isOffline = res is Map && res['isOffline'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isOffline
              ? 'تم حفظ مسودة التقييم محليًا في الجهاز'
              : 'تم حفظ مسودة التقييم في الخادم بنجاح'),
          backgroundColor: isOffline ? Colors.orange.shade800 : Colors.blue.shade700,
        ),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر حفظ المسودة: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isSavingDraft = false);
    }
  }

  Future<void> _submitFinal() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('اعتماد التقييم النهائي'),
        content: Text(
          'الدرجة المحسوبة الإجمالية: ${_calculateCurrentTotal()}%\nهل أنت متأكد من اعتماد التقييم وإنهاء الزيارة؟',
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('مراجعة')),
          FilledButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('تأكيد الاعتماد')),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isSubmitting = true);
    try {
      final res = await ref.read(supervisorActionsProvider.notifier).submitEvaluation(
            visitId: widget.visitId,
            templateId: _template?.id,
            criteria: _buildCriteriaPayload(),
            strengths: _strengthsController.text.trim(),
            improvementAreas: _improvementsController.text.trim(),
            summary: _summaryController.text.trim(),
          );

      if (!mounted) return;
      final isOffline = res is Map && res['isOffline'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isOffline
              ? 'تم حفظ التقييم المعتمد محليًا (سيتم المزامنة تلقائيًا)'
              : 'تم اعتماد التقييم وإنهاء الزيارة الميدانية بنجاح'),
          backgroundColor: Colors.green,
        ),
      );
      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر اعتماد التقييم: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final workspaceAsync = ref.watch(supervisorVisitWorkspaceProvider(widget.visitId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('استمارة التقييم المعيارية'),
        actions: [
          IconButton(
            icon: _isSavingDraft
                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.save_outlined),
            tooltip: 'حفظ كمسودة',
            onPressed: _isSavingDraft || _isSubmitting ? null : _saveDraft,
          ),
        ],
      ),
      body: workspaceAsync.when(
        data: (data) {
          _initFromData(data);
          final template = _template;
          if (template == null) {
            return const Center(child: Text('لم يتم العثور على نموذج استمارة نشط'));
          }

          final currentScore = _calculateCurrentTotal();

          return Column(
            children: [
              // Sticky Total Score Banner
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: Theme.of(context).colorScheme.primaryContainer,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('الدرجة الإجمالية المحسوبة', style: TextStyle(fontSize: 12)),
                        Text(
                          '$currentScore%',
                          style: TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                      ],
                    ),
                    FilledButton.icon(
                      onPressed: _isSubmitting ? null : _submitFinal,
                      icon: _isSubmitting
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                            )
                          : const Icon(Icons.check_circle_outline),
                      label: const Text('اعتماد نهائي'),
                    ),
                  ],
                ),
              ),

              // Axes and Criteria List
              Expanded(
                child: ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    ...template.axes.map((axis) => _buildAxisCard(axis)),
                    const SizedBox(height: 16),

                    // Qualitative Section
                    Card(
                      elevation: 2,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'التقييم النوعي والتوجيهات',
                              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _strengthsController,
                              decoration: const InputDecoration(
                                labelText: 'أبرز نقاط القوة والإشادة',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.thumb_up_outlined, color: Colors.green),
                              ),
                              maxLines: 2,
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _improvementsController,
                              decoration: const InputDecoration(
                                labelText: 'مجالات التطوير وفرص التحسين',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.trending_up, color: Colors.orange),
                              ),
                              maxLines: 2,
                            ),
                            const SizedBox(height: 12),
                            TextField(
                              controller: _summaryController,
                              decoration: const InputDecoration(
                                labelText: 'الخلاصة والتوجيه العام للمعلم',
                                border: OutlineInputBorder(),
                                prefixIcon: Icon(Icons.article_outlined),
                              ),
                              maxLines: 3,
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                  ],
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('حدث خطأ: $err')),
      ),
    );
  }

  Widget _buildAxisCard(EvaluationAxisModel axis) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
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
                    axis.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                  ),
                ),
                Chip(
                  label: Text('الوزن: ${axis.weight.toInt()}%'),
                  backgroundColor: Colors.blue.shade50,
                ),
              ],
            ),
            if (axis.description != null) ...[
              const SizedBox(height: 4),
              Text(axis.description!, style: TextStyle(color: Colors.grey.shade600, fontSize: 12)),
            ],
            const Divider(height: 24),
            ...axis.criteria.map((criterion) => _buildCriterionRow(criterion)),
          ],
        ),
      ),
    );
  }

  Widget _buildCriterionRow(EvaluationCriterionModel criterion) {
    final isNA = _criterionNotApplicable[criterion.id] ?? false;
    final currentVal = _criterionScores[criterion.id] ?? criterion.maxScore;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  criterion.name,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    decoration: isNA ? TextDecoration.lineThrough : null,
                    color: isNA ? Colors.grey : null,
                  ),
                ),
              ),
              Text(
                isNA ? 'غير منطبق' : '$currentVal / ${criterion.maxScore.toInt()}',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: isNA ? Colors.grey : Theme.of(context).colorScheme.primary,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),

          // Rating Controls
          if (!isNA)
            Row(
              children: [
                for (int i = 1; i <= criterion.maxScore.toInt(); i++)
                  Padding(
                    padding: const EdgeInsets.only(left: 6),
                    child: ChoiceChip(
                      label: Text('$i'),
                      selected: currentVal.toInt() == i,
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _criterionScores[criterion.id] = i.toDouble();
                          });
                        }
                      },
                    ),
                  ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _criterionNotApplicable[criterion.id] = true;
                    });
                  },
                  child: const Text('غير منطبق', style: TextStyle(fontSize: 12, color: Colors.grey)),
                ),
              ],
            )
          else
            Row(
              children: [
                const Text('تم استبعاد المعيار من الحساب', style: TextStyle(color: Colors.grey, fontSize: 12)),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    setState(() {
                      _criterionNotApplicable[criterion.id] = false;
                      _criterionScores[criterion.id] = criterion.maxScore;
                    });
                  },
                  child: const Text('تفعيل المعيار'),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
