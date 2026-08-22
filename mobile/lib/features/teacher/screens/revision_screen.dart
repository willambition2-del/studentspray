import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/utils/quran_data.dart';
import '../../../core/widgets/modern_card.dart';
import '../providers/teacher_provider.dart';

class RevisionScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String halaqaId;
  final String studentName;

  const RevisionScreen({
    super.key,
    required this.studentId,
    required this.halaqaId,
    required this.studentName,
  });

  @override
  ConsumerState<RevisionScreen> createState() => _RevisionScreenState();
}

class _RevisionScreenState extends ConsumerState<RevisionScreen> {
  final _formKey = GlobalKey<FormState>();

  int _revisionMode = 0; // 0 = By Surah, 1 = By Juz
  int _selectedSurah = 1;
  int _selectedJuz = 30;

  late final TextEditingController _fromAyahController;
  late final TextEditingController _toAyahController;
  late final TextEditingController _scoreController;
  late final TextEditingController _notesController;

  String _rating = 'EXCELLENT';
  int _mistakesCount = 0;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fromAyahController = TextEditingController(text: '1');
    _toAyahController = TextEditingController(text: '7');
    _scoreController = TextEditingController(text: '100');
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _fromAyahController.dispose();
    _toAyahController.dispose();
    _scoreController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final score = double.tryParse(_scoreController.text) ?? 100;

    int? surahNum;
    int? fromAyah;
    int? toAyah;
    int? juzNum;

    if (_revisionMode == 0) {
      surahNum = _selectedSurah;
      fromAyah = int.tryParse(_fromAyahController.text) ?? 1;
      toAyah = int.tryParse(_toAyahController.text) ?? 1;
      if (fromAyah > toAyah) {
        setState(() {
          _errorMessage = 'الآية الأولى يجب أن تكون أصغر من أو تساوي الآية الأخيرة';
        });
        return;
      }
    } else {
      juzNum = _selectedJuz;
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final now = DateTime.now().toIso8601String().split('T')[0];
      final result = await ref.read(teacherOperationsProvider).recordRevision(
            halaqaId: widget.halaqaId,
            studentId: widget.studentId,
            date: now,
            surahNumber: surahNum,
            fromAyah: fromAyah,
            toAyah: toAyah,
            juzNumber: juzNum,
            evaluationScore: score,
            rating: _rating,
            mistakesCount: _mistakesCount,
            teacherNotes: _notesController.text.isNotEmpty
                ? _notesController.text
                : null,
          );

      if (mounted) {
        final isOffline = result['isOffline'] == true;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isOffline
                  ? 'تم الحفظ محليًا — بانتظار عودة الاتصال'
                  : '✓ تم تسجيل مراجعة وتثبيت الطالب بنجاح',
            ),
            backgroundColor:
                isOffline ? AppColors.statusLate : AppColors.statusPresent,
          ),
        );
        context.pop();
      }
    } on AppException catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _errorMessage = 'حدث خطأ أثناء تسجيل المراجعة';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSaving = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final surahInfo = QuranData.getByNumber(_selectedSurah);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('تسجيل مراجعة وتثبيت'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Student Header
              ModernCard(
                backgroundColor: AppColors.primaryDark,
                borderColor: Colors.transparent,
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(25),
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        widget.studentName.isNotEmpty ? widget.studentName[0] : 'ط',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'مراجعة وتثبيت للطالب:',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              color: AppColors.accentGoldSoft,
                              fontSize: 12,
                            ),
                          ),
                          Text(
                            widget.studentName,
                            style: const TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Error alert
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.errorSoft,
                    borderRadius: BorderRadius.circular(AppRadius.md),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      color: AppColors.error,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Mode Switcher (By Surah vs By Juz)
              ModernCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'نطاق المراجعة',
                      style: TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _revisionMode = 0),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _revisionMode == 0 ? AppColors.primary : AppColors.surfaceMuted,
                                borderRadius: BorderRadius.circular(AppRadius.md),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'مراجعة بالسور والآيات',
                                style: TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  color: _revisionMode == 0 ? Colors.white : AppColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: InkWell(
                            onTap: () => setState(() => _revisionMode = 1),
                            borderRadius: BorderRadius.circular(AppRadius.md),
                            child: Container(
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _revisionMode == 1 ? AppColors.primary : AppColors.surfaceMuted,
                                borderRadius: BorderRadius.circular(AppRadius.md),
                              ),
                              alignment: Alignment.center,
                              child: Text(
                                'مراجعة بالأجزاء',
                                style: TextStyle(
                                  fontFamily: AppTypography.fontFamily,
                                  color: _revisionMode == 1 ? Colors.white : AppColors.textSecondary,
                                  fontWeight: FontWeight.bold,
                                  fontSize: 13,
                                ),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    if (_revisionMode == 0) ...[
                      DropdownButtonFormField<int>(
                        initialValue: _selectedSurah,
                        decoration: const InputDecoration(
                          labelText: 'السورة القرآنية',
                          prefixIcon: Icon(Icons.menu_book_outlined, size: 20),
                        ),
                        items: QuranData.surahs.map((s) {
                          return DropdownMenuItem<int>(
                            value: s.number,
                            child: Text('سورة ${s.name} (${s.ayahCount} آية)'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedSurah = val;
                              _fromAyahController.text = '1';
                              _toAyahController.text =
                                  QuranData.getByNumber(val).ayahCount.toString();
                            });
                          }
                        },
                      ),
                      const SizedBox(height: 14),
                      Row(
                        children: [
                          Expanded(
                            child: TextFormField(
                              controller: _fromAyahController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'من الآية',
                                prefixIcon: Icon(Icons.arrow_forward, size: 18),
                              ),
                              validator: (val) {
                                final num = int.tryParse(val ?? '');
                                if (num == null || num < 1 || num > surahInfo.ayahCount) {
                                  return 'بين 1 و ${surahInfo.ayahCount}';
                                }
                                return null;
                              },
                            ),
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: TextFormField(
                              controller: _toAyahController,
                              keyboardType: TextInputType.number,
                              decoration: const InputDecoration(
                                labelText: 'إلى الآية',
                                prefixIcon: Icon(Icons.arrow_back, size: 18),
                              ),
                              validator: (val) {
                                final num = int.tryParse(val ?? '');
                                if (num == null || num < 1 || num > surahInfo.ayahCount) {
                                  return 'بين 1 و ${surahInfo.ayahCount}';
                                }
                                return null;
                              },
                            ),
                          ),
                        ],
                      ),
                    ] else ...[
                      DropdownButtonFormField<int>(
                        initialValue: _selectedJuz,
                        decoration: const InputDecoration(
                          labelText: 'رقم الجزء',
                          prefixIcon: Icon(Icons.bookmark_border, size: 20),
                        ),
                        items: List.generate(30, (i) => i + 1).map((j) {
                          return DropdownMenuItem<int>(
                            value: j,
                            child: Text('الجزء $j'),
                          );
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) {
                            setState(() {
                              _selectedJuz = val;
                            });
                          }
                        },
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Evaluation & Mistakes
              ModernCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'التقييم والأداء',
                      style: TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        Expanded(
                          child: TextFormField(
                            controller: _scoreController,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            decoration: const InputDecoration(
                              labelText: 'الدرجة (من 100)',
                              prefixIcon: Icon(Icons.star_outline, size: 20),
                            ),
                            validator: (val) {
                              final num = double.tryParse(val ?? '');
                              if (num == null || num < 0 || num > 100) {
                                return 'بين 0 و 100';
                              }
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.surface,
                              borderRadius: BorderRadius.circular(AppRadius.md),
                              border: Border.all(color: AppColors.border),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text(
                                  'عدد الأخطاء',
                                  style: AppTypography.label,
                                ),
                                Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    IconButton(
                                      icon: const Icon(Icons.remove_circle_outline, size: 20),
                                      color: AppColors.textSecondary,
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: _mistakesCount > 0
                                          ? () => setState(() => _mistakesCount--)
                                          : null,
                                    ),
                                    Text(
                                      '$_mistakesCount',
                                      style: const TextStyle(
                                        fontFamily: AppTypography.fontFamily,
                                        fontSize: 16,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.add_circle_outline, size: 20),
                                      color: AppColors.primary,
                                      padding: EdgeInsets.zero,
                                      constraints: const BoxConstraints(),
                                      onPressed: () => setState(() => _mistakesCount++),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Rating Selection
                    const Text(
                      'التقدير العام:',
                      style: AppTypography.secondaryMedium,
                    ),
                    const SizedBox(height: 8),
                    Wrap(
                      spacing: 8,
                      runSpacing: 8,
                      children: [
                        _buildRatingChip('EXCELLENT', 'ممتاز', AppColors.statusPresent, AppColors.statusPresentBg),
                        _buildRatingChip('VERY_GOOD', 'جيد جداً', AppColors.primary, AppColors.primarySoft),
                        _buildRatingChip('GOOD', 'جيد', AppColors.statusExcused, AppColors.statusExcusedBg),
                        _buildRatingChip('ACCEPTABLE', 'مقبول', AppColors.statusLate, AppColors.statusLateBg),
                        _buildRatingChip('NEEDS_REVIEW', 'يحتاج مراجعة', AppColors.statusAbsent, AppColors.statusAbsentBg),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              // Teacher Notes
              ModernCard(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'توجيهات المعلم',
                      style: TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    const SizedBox(height: 10),
                    TextFormField(
                      controller: _notesController,
                      maxLines: 3,
                      decoration: const InputDecoration(
                        hintText: 'اكتب ملاحظات وتوجيهات للطالب وولي أمره...',
                        alignLabelWithHint: true,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Save Button
              ElevatedButton(
                onPressed: _isSaving ? null : _handleSave,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(double.infinity, 48),
                ),
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text(
                        'حفظ وتسجيل المراجعة',
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRatingChip(String code, String label, Color color, Color softBg) {
    final isSelected = _rating == code;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: color,
      backgroundColor: softBg,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.full),
        side: BorderSide(color: isSelected ? color : AppColors.border, width: 0.8),
      ),
      labelStyle: TextStyle(
        fontFamily: AppTypography.fontFamily,
        color: isSelected ? Colors.white : color,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
        fontSize: 12,
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _rating = code;
          });
        }
      },
    );
  }
}
