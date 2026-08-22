import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/supervisor_provider.dart';

class CreateVisitScreen extends ConsumerStatefulWidget {
  final String? initialHalaqaId;
  final String? initialTeacherId;

  const CreateVisitScreen({
    super.key,
    this.initialHalaqaId,
    this.initialTeacherId,
  });

  @override
  ConsumerState<CreateVisitScreen> createState() => _CreateVisitScreenState();
}

class _CreateVisitScreenState extends ConsumerState<CreateVisitScreen> {
  final _formKey = GlobalKey<FormState>();
  String? _selectedHalaqaId;
  String? _selectedTeacherId;
  String _visitType = 'ROUTINE';
  DateTime _scheduledDate = DateTime.now();
  TimeOfDay _scheduledTime = const TimeOfDay(hour: 16, minute: 30);
  final _reasonController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _selectedHalaqaId = widget.initialHalaqaId;
    _selectedTeacherId = widget.initialTeacherId;
  }

  @override
  void dispose() {
    _reasonController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedHalaqaId == null || _selectedTeacherId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('يرجى اختيار الحلقة والمعلم')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final scheduledDateTime = DateTime(
        _scheduledDate.year,
        _scheduledDate.month,
        _scheduledDate.day,
        _scheduledTime.hour,
        _scheduledTime.minute,
      );

      final res = await ref.read(supervisorActionsProvider.notifier).createVisit(
            halaqaId: _selectedHalaqaId!,
            teacherId: _selectedTeacherId!,
            visitType: _visitType,
            scheduledDate: scheduledDateTime.toIso8601String(),
            reason: _reasonController.text.trim().isNotEmpty
                ? _reasonController.text.trim()
                : null,
            generalNotes: _notesController.text.trim().isNotEmpty
                ? _notesController.text.trim()
                : null,
          );

      if (!mounted) return;

      final isOffline = res is Map && res['isOffline'] == true;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(isOffline
              ? 'تم حفظ الزيارة محليًا دون اتصال'
              : 'تم إنشاء وجدولة الزيارة بنجاح'),
          backgroundColor: isOffline ? Colors.orange.shade800 : Colors.green,
        ),
      );

      context.pop();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تعذر إنشاء الزيارة: $e'), backgroundColor: Colors.red),
      );
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final halaqasAsync = ref.watch(supervisorHalaqasProvider);
    final teachersAsync = ref.watch(supervisorTeachersProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('جدولة زيارة ميدانية جديدة'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Halaqa Selector
            halaqasAsync.when(
              data: (halaqas) => DropdownButtonFormField<String>(
                initialValue: _selectedHalaqaId,
                decoration: const InputDecoration(
                  labelText: 'الحلقة المستهدفة *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.groups),
                ),
                items: halaqas
                    .map((h) => DropdownMenuItem(
                          value: h.id,
                          child: Text('${h.name} (${h.code})'),
                        ))
                    .toList(),
                onChanged: (val) {
                  setState(() {
                    _selectedHalaqaId = val;
                    final selectedHalaqa = halaqas.firstWhere((h) => h.id == val);
                    if (selectedHalaqa.teachers.isNotEmpty) {
                      _selectedTeacherId = selectedHalaqa.teachers.first['id'] as String?;
                    }
                  });
                },
                validator: (v) => v == null ? 'يرجى اختيار الحلقة' : null,
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Text('خطأ في تحميل الحلقات: $err'),
            ),
            const SizedBox(height: 16),

            // Teacher Selector
            teachersAsync.when(
              data: (teachers) => DropdownButtonFormField<String>(
                initialValue: _selectedTeacherId,
                decoration: const InputDecoration(
                  labelText: 'المعلم المستهدف *',
                  border: OutlineInputBorder(),
                  prefixIcon: Icon(Icons.person),
                ),
                items: teachers
                    .map((t) => DropdownMenuItem(
                          value: t.id,
                          child: Text(t.displayName),
                        ))
                    .toList(),
                onChanged: (val) => setState(() => _selectedTeacherId = val),
                validator: (v) => v == null ? 'يرجى اختيار المعلم' : null,
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (err, _) => Text('خطأ في تحميل المعلمين: $err'),
            ),
            const SizedBox(height: 16),

            // Visit Type Selector
            DropdownButtonFormField<String>(
              initialValue: _visitType,
              decoration: const InputDecoration(
                labelText: 'نوع الزيارة',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.category),
              ),
              items: const [
                DropdownMenuItem(value: 'ROUTINE', child: Text('زيارة دورية اعتيادية')),
                DropdownMenuItem(value: 'FOLLOW_UP', child: Text('زيارة متابعة توصيات')),
                DropdownMenuItem(value: 'DIAGNOSTIC', child: Text('زيارة تشخيصية')),
                DropdownMenuItem(value: 'EMERGENCY', child: Text('زيارة طارئة')),
                DropdownMenuItem(value: 'COMPREHENSIVE', child: Text('تقييم شامل')),
              ],
              onChanged: (val) => setState(() => _visitType = val ?? 'ROUTINE'),
            ),
            const SizedBox(height: 16),

            // Scheduled Date & Time Picker
            Row(
              children: [
                Expanded(
                  flex: 3,
                  child: ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                      side: BorderSide(color: Colors.grey.shade400),
                    ),
                    leading: const Icon(Icons.calendar_today),
                    title: const Text('التاريخ'),
                    subtitle: Text(
                      '${_scheduledDate.year}-${_scheduledDate.month.toString().padLeft(2, "0")}-${_scheduledDate.day.toString().padLeft(2, "0")}',
                    ),
                    onTap: () async {
                      final picked = await showDatePicker(
                        context: context,
                        initialDate: _scheduledDate,
                        firstDate: DateTime.now().subtract(const Duration(days: 30)),
                        lastDate: DateTime.now().add(const Duration(days: 90)),
                      );
                      if (picked != null) {
                        setState(() => _scheduledDate = picked);
                      }
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  flex: 2,
                  child: ListTile(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(4),
                      side: BorderSide(color: Colors.grey.shade400),
                    ),
                    leading: const Icon(Icons.access_time),
                    title: const Text('الوقت'),
                    subtitle: Text('${_scheduledTime.hour.toString().padLeft(2, "0")}:${_scheduledTime.minute.toString().padLeft(2, "0")}'),
                    onTap: () async {
                      final picked = await showTimePicker(
                        context: context,
                        initialTime: _scheduledTime,
                      );
                      if (picked != null) {
                        setState(() => _scheduledTime = picked);
                      }
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Reason field
            TextFormField(
              controller: _reasonController,
              decoration: const InputDecoration(
                labelText: 'الهدف من الزيارة / محاور التركيز',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.track_changes),
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),

            // General Notes
            TextFormField(
              controller: _notesController,
              decoration: const InputDecoration(
                labelText: 'ملاحظات وتوجيهات أولية',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.notes),
              ),
              maxLines: 3,
            ),
            const SizedBox(height: 24),

            // Submit Button
            FilledButton.icon(
              onPressed: _isLoading ? null : _submit,
              icon: _isLoading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Icon(Icons.check),
              label: Text(_isLoading ? 'جاري الحفظ...' : 'حفظ وجدولة الزيارة'),
              style: FilledButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
