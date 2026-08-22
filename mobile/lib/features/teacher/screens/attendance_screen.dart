import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_shadows.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';
import '../../../core/utils/file_export_util.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  final String halaqaId;

  const AttendanceScreen({super.key, required this.halaqaId});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  final Map<String, String> _statuses = {};
  final Map<String, TextEditingController> _noteControllers = {};
  final Map<String, TimeOfDay> _arrivalTimes = {};
  final TextEditingController _sessionNotesController = TextEditingController();

  bool _isSaving = false;
  String? _bannerMessage;
  bool _isError = false;

  @override
  void dispose() {
    _sessionNotesController.dispose();
    for (final c in _noteControllers.values) {
      c.dispose();
    }
    super.dispose();
  }

  void _markAll(String status, List students) {
    setState(() {
      for (final s in students) {
        _statuses[s.studentId] = status;
        if (status == 'PRESENT' || status == 'LATE') {
          _arrivalTimes[s.studentId] ??= TimeOfDay.now();
        }
      }
    });
  }

  Future<void> _saveAttendance(String sessionDate) async {
    setState(() {
      _isSaving = true;
      _bannerMessage = null;
    });

    try {
      final baseDate = DateTime.tryParse(sessionDate) ?? DateTime.now();
      final records = _statuses.entries.map((e) {
        final notes = _noteControllers[e.key]?.text;
        final time = _arrivalTimes[e.key];
        DateTime? arrivalDateTime;
        if (time != null && (e.value == 'PRESENT' || e.value == 'LATE')) {
          arrivalDateTime = DateTime(baseDate.year, baseDate.month, baseDate.day, time.hour, time.minute);
        }

        return {
          'studentId': e.key,
          'status': e.value,
          if (arrivalDateTime != null) 'arrivalTime': arrivalDateTime.toIso8601String(),
          if (notes != null && notes.isNotEmpty) 'notes': notes,
        };
      }).toList();

      final result = await ref.read(teacherOperationsProvider).recordAttendance(
            halaqaId: widget.halaqaId,
            sessionDate: sessionDate,
            records: records,
            notes: _sessionNotesController.text.isNotEmpty
                ? _sessionNotesController.text
                : null,
          );

      if (mounted) {
        setState(() {
          _isError = false;
          _bannerMessage = result['isOffline'] == true
              ? 'تم الحفظ محليًا — بانتظار عودة الاتصال للمزامنة'
              : '✓ تم تسجيل الحفظ والحضور بنجاح في السيرفر';
        });

        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(_bannerMessage!),
            backgroundColor: result['isOffline'] == true
                ? AppColors.statusLate
                : AppColors.statusPresent,
          ),
        );
      }
    } on AppException catch (e) {
      if (mounted) {
        setState(() {
          _isError = true;
          _bannerMessage = e.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _isError = true;
          _bannerMessage = 'حدث خطأ أثناء حفظ الحضور، يرجى المحاولة لاحقًا';
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
    final workspaceAsync = ref.watch(halaqaWorkspaceProvider(widget.halaqaId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('تسجيل الحضور اليومي'),
        actions: [
          IconButton(
            icon: const Icon(Icons.print_outlined),
            tooltip: 'تصدير كشف التحضير',
            onPressed: () {
              final ws = workspaceAsync.valueOrNull;
              final students = ws?.students ?? [];
              showModalBottomSheet(
                context: context,
                backgroundColor: AppColors.surface,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xl)),
                ),
                builder: (ctx) => Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'كشف التحضير والانضباط الرسمي',
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'إجمالي الطلاب في الحلقة: ${students.length} طالب • التاريخ: ${ws?.todayDate ?? "اليوم"}',
                        style: AppTypography.secondary,
                      ),
                      const SizedBox(height: 16),
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceMuted,
                          borderRadius: BorderRadius.circular(AppRadius.md),
                          border: Border.all(color: AppColors.border, width: 0.8),
                        ),
                        child: Text(
                          'تم رصد: ${_statuses.values.where((v) => v == "PRESENT").length} حاضر • '
                          '${_statuses.values.where((v) => v == "ABSENT").length} غائب • '
                          '${_statuses.values.where((v) => v == "LATE").length} متأخر',
                          style: const TextStyle(
                            fontFamily: AppTypography.fontFamily,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            color: AppColors.primaryDark,
                          ),
                        ),
                      ),
                      const SizedBox(height: 20),
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.md)),
                          ),
                          icon: const Icon(Icons.download, color: Colors.white),
                          label: const Text(
                            'تصدير الكشف بصيغة CSV / ملف رسمي',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                          onPressed: () async {
                            Navigator.pop(ctx);
                            try {
                              final res = await FileExportUtil.exportAttendanceSheetCsv(
                                halaqaName: ws?.halaqa.name ?? 'الحلقة القرآنية',
                                sessionDate: ws?.todayDate ?? 'اليوم',
                                students: students,
                                statuses: _statuses,
                              );
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text('✓ تم حفظ كشف الحضور: ${res.fileName} (${res.formattedSize})'),
                                    backgroundColor: AppColors.statusPresent,
                                    duration: const Duration(seconds: 4),
                                  ),
                                );
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('تعذر تصدير الكشف: $e'), backgroundColor: Colors.red),
                                );
                              }
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'تحديث',
            onPressed: () => ref.invalidate(halaqaWorkspaceProvider(widget.halaqaId)),
          ),
        ],
      ),
      body: workspaceAsync.when(
        data: (workspace) {
          final students = workspace.students;
          final sessionDate = workspace.todayDate;

          // Initialize local state for each student once
          for (final s in students) {
            if (!_statuses.containsKey(s.studentId)) {
              _statuses[s.studentId] = s.todayAttendanceStatus ?? 'PRESENT';
              _noteControllers[s.studentId] = TextEditingController();
              if (s.todayArrivalTime != null) {
                final dt = DateTime.tryParse(s.todayArrivalTime!);
                if (dt != null) {
                  _arrivalTimes[s.studentId] = TimeOfDay(hour: dt.hour, minute: dt.minute);
                }
              } else if (_statuses[s.studentId] == 'PRESENT' || _statuses[s.studentId] == 'LATE') {
                _arrivalTimes[s.studentId] = TimeOfDay.now();
              }
            }
          }

          return Column(
            children: [
              // Banner feedback if present
              if (_bannerMessage != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                  color: _isError
                      ? AppColors.errorSoft
                      : AppColors.successSoft,
                  child: Row(
                    children: [
                      Icon(
                        _isError
                            ? Icons.error_outline
                            : Icons.check_circle,
                        color: _isError
                            ? AppColors.error
                            : AppColors.success,
                        size: 18,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _bannerMessage!,
                          style: TextStyle(
                            fontFamily: AppTypography.fontFamily,
                            color: _isError
                                ? AppColors.error
                                : AppColors.success,
                            fontWeight: FontWeight.bold,
                            fontSize: 12.5,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Controls header (Session date & Quick all present / absent actions)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: const BoxDecoration(
                  color: AppColors.background,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        const Icon(Icons.calendar_today_outlined, size: 16, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Text(
                          'جلسة اليوم: $sessionDate',
                          style: AppTypography.bodyMedium.copyWith(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    Row(
                      children: [
                        InkWell(
                          onTap: () => _markAll('PRESENT', students),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.statusPresentBg,
                              borderRadius: BorderRadius.circular(AppRadius.full),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.done_all, size: 14, color: AppColors.statusPresent),
                                SizedBox(width: 3),
                                Text(
                                  'تحضير الكل',
                                  style: TextStyle(
                                    fontFamily: AppTypography.fontFamily,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.statusPresent,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 6),
                        InkWell(
                          onTap: () => _markAll('ABSENT', students),
                          borderRadius: BorderRadius.circular(AppRadius.full),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                            decoration: BoxDecoration(
                              color: AppColors.statusAbsentBg,
                              borderRadius: BorderRadius.circular(AppRadius.full),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.close, size: 14, color: AppColors.statusAbsent),
                                SizedBox(width: 3),
                                Text(
                                  'تغييب الكل',
                                  style: TextStyle(
                                    fontFamily: AppTypography.fontFamily,
                                    fontSize: 11,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.statusAbsent,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Students list with modern selector chips
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.fromLTRB(16, 4, 16, 16),
                  itemCount: students.length,
                  itemBuilder: (context, index) {
                    final student = students[index];
                    final currentStatus = _statuses[student.studentId] ?? 'PRESENT';
                    final initial = student.displayName.isNotEmpty ? student.displayName[0] : 'ط';

                    return ModernCard(
                      margin: const EdgeInsets.only(bottom: 8),
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                width: 36,
                                height: 36,
                                decoration: BoxDecoration(
                                  color: AppColors.primarySoft,
                                  borderRadius: BorderRadius.circular(AppRadius.md),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  initial,
                                  style: const TextStyle(
                                    fontFamily: AppTypography.fontFamily,
                                    color: AppColors.primaryDark,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  student.displayName,
                                  style: AppTypography.bodyMedium,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          // Status selector row
                          Row(
                            children: [
                              _buildStatusOption(
                                student.studentId,
                                'PRESENT',
                                'حاضر',
                                AppColors.statusPresent,
                                AppColors.statusPresentBg,
                                currentStatus == 'PRESENT',
                              ),
                              const SizedBox(width: 6),
                              _buildStatusOption(
                                student.studentId,
                                'LATE',
                                'متأخر',
                                AppColors.statusLate,
                                AppColors.statusLateBg,
                                currentStatus == 'LATE',
                              ),
                              const SizedBox(width: 6),
                              _buildStatusOption(
                                student.studentId,
                                'ABSENT',
                                'غائب',
                                AppColors.statusAbsent,
                                AppColors.statusAbsentBg,
                                currentStatus == 'ABSENT',
                              ),
                              const SizedBox(width: 6),
                              _buildStatusOption(
                                student.studentId,
                                'EXCUSED',
                                'معذور',
                                AppColors.statusExcused,
                                AppColors.statusExcusedBg,
                                currentStatus == 'EXCUSED',
                              ),
                            ],
                          ),
                          if (currentStatus == 'PRESENT' || currentStatus == 'LATE') ...[
                            const SizedBox(height: 8),
                            InkWell(
                              onTap: () async {
                                final initial = _arrivalTimes[student.studentId] ?? TimeOfDay.now();
                                final picked = await showTimePicker(
                                  context: context,
                                  initialTime: initial,
                                );
                                if (picked != null) {
                                  setState(() => _arrivalTimes[student.studentId] = picked);
                                }
                              },
                              borderRadius: BorderRadius.circular(6),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceMuted,
                                  borderRadius: BorderRadius.circular(6),
                                  border: Border.all(color: AppColors.border, width: 0.5),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    const Icon(Icons.access_time, size: 14, color: AppColors.primary),
                                    const SizedBox(width: 4),
                                    Text(
                                      'وقت الوصول: ${_arrivalTimes[student.studentId]?.format(context) ?? "الآن"}',
                                      style: const TextStyle(
                                        fontFamily: AppTypography.fontFamily,
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textSecondary,
                                      ),
                                    ),
                                    const SizedBox(width: 4),
                                    const Icon(Icons.edit, size: 12, color: AppColors.textSecondary),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    );
                  },
                ),
              ),

              // Bottom Save Bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: const BoxDecoration(
                  color: AppColors.surface,
                  boxShadow: AppShadows.elevatedCard,
                ),
                child: SafeArea(
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : () => _saveAttendance(sessionDate),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      minimumSize: const Size(double.infinity, 48),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(AppRadius.md),
                      ),
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
                            'حفظ حضور الجلسة',
                            style: TextStyle(
                              fontFamily: AppTypography.fontFamily,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ),
            ],
          );
        },
        loading: () => const LoadingView(message: 'جاري تجهيز قائمة الطلاب...'),
        error: (err, _) => ErrorView(
          message: err.toString(),
          onRetry: () => ref.invalidate(halaqaWorkspaceProvider(widget.halaqaId)),
        ),
      ),
    );
  }

  Widget _buildStatusOption(
    String studentId,
    String statusValue,
    String label,
    Color activeColor,
    Color softBgColor,
    bool isSelected,
  ) {
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _statuses[studentId] = statusValue;
          });
        },
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? activeColor : softBgColor,
            borderRadius: BorderRadius.circular(AppRadius.md),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontFamily: AppTypography.fontFamily,
              color: isSelected ? Colors.white : activeColor,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          ),
        ),
      ),
    );
  }
}
