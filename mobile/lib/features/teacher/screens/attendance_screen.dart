import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/errors/app_exception.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/teacher_provider.dart';

class AttendanceScreen extends ConsumerStatefulWidget {
  final String halaqaId;

  const AttendanceScreen({super.key, required this.halaqaId});

  @override
  ConsumerState<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends ConsumerState<AttendanceScreen> {
  final Map<String, String> _statuses = {};
  final Map<String, TextEditingController> _noteControllers = {};
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
      }
    });
  }

  Future<void> _saveAttendance(String sessionDate) async {
    setState(() {
      _isSaving = true;
      _bannerMessage = null;
    });

    try {
      final records = _statuses.entries.map((e) {
        final notes = _noteControllers[e.key]?.text;
        return {
          'studentId': e.key,
          'status': e.value,
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
                ? AppTheme.statusLate
                : AppTheme.statusPresent,
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
      appBar: AppBar(
        title: const Text('تسجيل حضور الحلقة'),
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
            }
          }

          return Column(
            children: [
              // Banner feedback if present
              if (_bannerMessage != null)
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  color: _isError
                      ? AppTheme.statusAbsent.withAlpha(25)
                      : AppTheme.statusPresent.withAlpha(25),
                  child: Row(
                    children: [
                      Icon(
                        _isError
                            ? Icons.error_outline_rounded
                            : Icons.check_circle_rounded,
                        color: _isError
                            ? AppTheme.statusAbsent
                            : AppTheme.statusPresent,
                        size: 20,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          _bannerMessage!,
                          style: TextStyle(
                            color: _isError
                                ? AppTheme.statusAbsent
                                : AppTheme.statusPresent,
                            fontWeight: FontWeight.bold,
                            fontSize: 13,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),

              // Controls header (Session date & Quick all present action)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                color: Colors.white,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'جلسة اليوم: $sessionDate',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppTheme.primaryDark,
                        fontSize: 14,
                      ),
                    ),
                    OutlinedButton.icon(
                      onPressed: () => _markAll('PRESENT', students),
                      icon: const Icon(Icons.done_all_rounded, size: 16),
                      label: const Text('الجميع حاضر', style: TextStyle(fontSize: 13)),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        minimumSize: const Size(0, 36),
                      ),
                    ),
                  ],
                ),
              ),
              const Divider(height: 1, color: AppTheme.dividerColor),

              // Students list with selector chips
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  itemCount: students.length,
                  itemBuilder: (context, index) {
                    final student = students[index];
                    final currentStatus = _statuses[student.studentId] ?? 'PRESENT';

                    return Card(
                      margin: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 6,
                      ),
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              student.displayName,
                              style: const TextStyle(
                                fontSize: 15,
                                fontWeight: FontWeight.bold,
                                color: AppTheme.textPrimary,
                              ),
                            ),
                            const SizedBox(height: 10),
                            // Status selector row
                            Row(
                              children: [
                                _buildStatusOption(
                                  student.studentId,
                                  'PRESENT',
                                  'حاضر',
                                  AppTheme.statusPresent,
                                  currentStatus == 'PRESENT',
                                ),
                                const SizedBox(width: 6),
                                _buildStatusOption(
                                  student.studentId,
                                  'LATE',
                                  'متأخر',
                                  AppTheme.statusLate,
                                  currentStatus == 'LATE',
                                ),
                                const SizedBox(width: 6),
                                _buildStatusOption(
                                  student.studentId,
                                  'ABSENT',
                                  'غائب',
                                  AppTheme.statusAbsent,
                                  currentStatus == 'ABSENT',
                                ),
                                const SizedBox(width: 6),
                                _buildStatusOption(
                                  student.studentId,
                                  'EXCUSED',
                                  'معذور',
                                  AppTheme.statusExcused,
                                  currentStatus == 'EXCUSED',
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              ),

              // Bottom Save Bar
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(12),
                      blurRadius: 8,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: SafeArea(
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : () => _saveAttendance(sessionDate),
                    child: _isSaving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              color: Colors.white,
                              strokeWidth: 2,
                            ),
                          )
                        : const Text('حفظ حضور الجلسة'),
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
    bool isSelected,
  ) {
    return Expanded(
      child: InkWell(
        onTap: () {
          setState(() {
            _statuses[studentId] = statusValue;
          });
        },
        borderRadius: BorderRadius.circular(8),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 8),
          decoration: BoxDecoration(
            color: isSelected ? activeColor : activeColor.withAlpha(15),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(
              color: isSelected ? activeColor : activeColor.withAlpha(60),
              width: 1.2,
            ),
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
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
