import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/utils/quran_data.dart';
import '../providers/teacher_provider.dart';

class MemorizationScreen extends ConsumerStatefulWidget {
  final String studentId;
  final String halaqaId;
  final String studentName;

  const MemorizationScreen({
    super.key,
    required this.studentId,
    required this.halaqaId,
    required this.studentName,
  });

  @override
  ConsumerState<MemorizationScreen> createState() => _MemorizationScreenState();
}

class _MemorizationScreenState extends ConsumerState<MemorizationScreen> {
  final _formKey = GlobalKey<FormState>();

  int _selectedSurah = 78; // Default An-Naba
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
    _toAyahController = TextEditingController(text: '20');
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

    final fromAyah = int.tryParse(_fromAyahController.text) ?? 1;
    final toAyah = int.tryParse(_toAyahController.text) ?? 1;
    final score = double.tryParse(_scoreController.text) ?? 100;

    if (fromAyah > toAyah) {
      setState(() {
        _errorMessage = 'الآية الأولى يجب أن تكون أصغر من أو تساوي الآية الأخيرة';
      });
      return;
    }

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final now = DateTime.now().toIso8601String().split('T')[0];
      final result = await ref.read(teacherOperationsProvider).recordMemorization(
            halaqaId: widget.halaqaId,
            studentId: widget.studentId,
            date: now,
            surahNumber: _selectedSurah,
            fromAyah: fromAyah,
            toAyah: toAyah,
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
                  : '✓ تم تسجيل حفظ الطالب بنجاح',
            ),
            backgroundColor:
                isOffline ? AppTheme.statusLate : AppTheme.statusPresent,
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
          _errorMessage = 'حدث خطأ أثناء تسجيل الحفظ';
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
      appBar: AppBar(
        title: const Text('تسجيل تسميع جديد'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Student Header
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppTheme.primaryDark,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.person_rounded, color: AppTheme.accentGold, size: 28),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'تسميع حفظ للطالب:',
                            style: TextStyle(color: AppTheme.accentGoldLight, fontSize: 12),
                          ),
                          Text(
                            widget.studentName,
                            style: const TextStyle(
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
              const SizedBox(height: 20),

              // Error alert
              if (_errorMessage != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFEBEE),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(
                    _errorMessage!,
                    style: const TextStyle(
                      color: AppTheme.statusAbsent,
                      fontWeight: FontWeight.bold,
                      fontSize: 13,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],

              // Surah Selector
              DropdownButtonFormField<int>(
                initialValue: _selectedSurah,
                decoration: const InputDecoration(
                  labelText: 'السورة القرآنية',
                  prefixIcon: Icon(Icons.menu_book_rounded),
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
              const SizedBox(height: 16),

              // Ayah range
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _fromAyahController,
                      keyboardType: TextInputType.number,
                      decoration: const InputDecoration(
                        labelText: 'من الآية',
                        prefixIcon: Icon(Icons.arrow_forward_rounded),
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
                        prefixIcon: Icon(Icons.arrow_back_rounded),
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
              const SizedBox(height: 16),

              // Evaluation Score & Mistakes
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _scoreController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      decoration: const InputDecoration(
                        labelText: 'الدرجة (من 100)',
                        prefixIcon: Icon(Icons.grade_rounded),
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
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppTheme.dividerColor),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'عدد الأخطاء',
                            style: TextStyle(fontSize: 12, color: AppTheme.textSecondary),
                          ),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              IconButton(
                                icon: const Icon(Icons.remove_circle_outline, size: 20),
                                onPressed: _mistakesCount > 0
                                    ? () => setState(() => _mistakesCount--)
                                    : null,
                              ),
                              Text(
                                '$_mistakesCount',
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.add_circle_outline, size: 20),
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
              const SizedBox(height: 16),

              // Rating Selection
              const Text(
                'التقدير العام:',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: AppTheme.textPrimary,
                ),
              ),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  _buildRatingChip('EXCELLENT', 'ممتاز', AppTheme.statusPresent),
                  _buildRatingChip('VERY_GOOD', 'جيد جداً', AppTheme.primary),
                  _buildRatingChip('GOOD', 'جيد', AppTheme.statusExcused),
                  _buildRatingChip('ACCEPTABLE', 'مقبول', AppTheme.statusLate),
                  _buildRatingChip('NEEDS_REVIEW', 'يحتاج مراجعة', AppTheme.statusAbsent),
                ],
              ),
              const SizedBox(height: 16),

              // Teacher Notes
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'ملاحظات وتوجيهات المعلم (اختياري)',
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 28),

              // Save Button
              ElevatedButton(
                onPressed: _isSaving ? null : _handleSave,
                child: _isSaving
                    ? const SizedBox(
                        height: 22,
                        width: 22,
                        child: CircularProgressIndicator(
                          color: Colors.white,
                          strokeWidth: 2,
                        ),
                      )
                    : const Text('حفظ وتسجيل الحفظ'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildRatingChip(String code, String label, Color color) {
    final isSelected = _rating == code;
    return ChoiceChip(
      label: Text(label),
      selected: isSelected,
      selectedColor: color,
      labelStyle: TextStyle(
        color: isSelected ? Colors.white : AppTheme.textPrimary,
        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
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
