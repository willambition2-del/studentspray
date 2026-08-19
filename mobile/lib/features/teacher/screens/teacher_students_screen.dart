import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../models/teacher_models.dart';
import '../providers/teacher_provider.dart';

class TeacherStudentsScreen extends ConsumerStatefulWidget {
  const TeacherStudentsScreen({super.key});

  @override
  ConsumerState<TeacherStudentsScreen> createState() => _TeacherStudentsScreenState();
}

class _TeacherStudentsScreenState extends ConsumerState<TeacherStudentsScreen> {
  String _searchQuery = '';
  String? _selectedHalaqaId;

  @override
  Widget build(BuildContext context) {
    final halaqasAsync = ref.watch(myHalaqasProvider);
    final studentsAsync = ref.watch(teacherStudentsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('شؤون طلاب الحلقات'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () {
              ref.invalidate(myHalaqasProvider);
              ref.invalidate(teacherStudentsProvider);
            },
          ),
        ],
      ),
      body: Column(
        children: [
          // Search & Filter Header
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                TextField(
                  decoration: InputDecoration(
                    hintText: 'ابحث باسم الطالب أو الرقم التعريفي...',
                    prefixIcon: const Icon(Icons.search_rounded, color: AppTheme.primary),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear_rounded),
                            onPressed: () => setState(() => _searchQuery = ''),
                          )
                        : null,
                    filled: true,
                    fillColor: Colors.grey.shade100,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(14),
                      borderSide: BorderSide.none,
                    ),
                  ),
                  onChanged: (val) => setState(() => _searchQuery = val.trim()),
                ),
                const SizedBox(height: 10),
                halaqasAsync.when(
                  data: (halaqas) {
                    if (halaqas.isEmpty) return const SizedBox.shrink();
                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('كل الحلقات'),
                            selected: _selectedHalaqaId == null,
                            onSelected: (selected) {
                              if (selected) setState(() => _selectedHalaqaId = null);
                            },
                          ),
                          const SizedBox(width: 8),
                          ...halaqas.map((h) => Padding(
                                padding: const EdgeInsets.only(right: 8),
                                child: ChoiceChip(
                                  label: Text('${h.name} (${h.studentsCount})'),
                                  selected: _selectedHalaqaId == h.id,
                                  onSelected: (selected) {
                                    setState(() => _selectedHalaqaId = selected ? h.id : null);
                                  },
                                ),
                              )),
                        ],
                      ),
                    );
                  },
                  loading: () => const SizedBox.shrink(),
                  error: (_, __) => const SizedBox.shrink(),
                ),
              ],
            ),
          ),
          const Divider(height: 1),

          // Students List
          Expanded(
            child: studentsAsync.when(
              data: (allStudents) {
                final filtered = allStudents.where((student) {
                  final matchesSearch = _searchQuery.isEmpty ||
                      student.displayName.toLowerCase().contains(_searchQuery.toLowerCase()) ||
                      (student.studentNumber != null && student.studentNumber!.contains(_searchQuery));
                  return matchesSearch;
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyStateView(
                    title: 'لا يوجد طلاب مطابقين للبحث',
                    subtitle: 'تأكد من كتابة الاسم بشكل صحيح أو مسح الفلتر',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(teacherStudentsProvider),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final student = filtered[index];
                      return _buildStudentItemCard(context, student);
                    },
                  ),
                );
              },
              loading: () => const LoadingView(message: 'جاري تحميل قائمة الطلاب...'),
              error: (err, _) => ErrorView(
                message: err.toString(),
                onRetry: () => ref.invalidate(teacherStudentsProvider),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentItemCard(BuildContext context, WorkspaceStudent student) {
    Color badgeBg;
    Color badgeText;
    String badgeLabel;

    switch (student.todayAttendanceStatus) {
      case 'PRESENT':
        badgeBg = AppTheme.statusPresent.withAlpha(25);
        badgeText = AppTheme.statusPresent;
        badgeLabel = 'حاضر اليوم';
        break;
      case 'ABSENT':
        badgeBg = AppTheme.statusAbsent.withAlpha(25);
        badgeText = AppTheme.statusAbsent;
        badgeLabel = 'غائب اليوم';
        break;
      case 'LATE':
        badgeBg = AppTheme.statusLate.withAlpha(25);
        badgeText = AppTheme.statusLate;
        badgeLabel = 'متأخر اليوم';
        break;
      case 'EXCUSED':
        badgeBg = AppTheme.statusExcused.withAlpha(25);
        badgeText = AppTheme.statusExcused;
        badgeLabel = 'معذور';
        break;
      default:
        badgeBg = Colors.grey.withAlpha(25);
        badgeText = Colors.grey.shade700;
        badgeLabel = 'لم يرصد';
    }

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        leading: CircleAvatar(
          backgroundColor: AppTheme.primary.withAlpha(20),
          child: const Icon(Icons.person_rounded, color: AppTheme.primary),
        ),
        title: Text(
          student.displayName,
          style: const TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: AppTheme.textPrimary,
          ),
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 4),
            Text(
              'رقم الطالب: ${student.studentNumber ?? "STU-2026"}',
              style: const TextStyle(fontSize: 12, color: AppTheme.textMuted),
            ),
            if (student.todayMemorization != null) ...[
              const SizedBox(height: 2),
              Text(
                'تسميع اليوم: سورة ${student.todayMemorization!["surahNumber"]} (${student.todayMemorization!["fromAyah"]}-${student.todayMemorization!["toAyah"]})',
                style: const TextStyle(fontSize: 11, color: AppTheme.primaryDark, fontWeight: FontWeight.w600),
              ),
            ],
          ],
        ),
        trailing: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: badgeBg,
                borderRadius: BorderRadius.circular(6),
              ),
              child: Text(
                badgeLabel,
                style: TextStyle(
                  color: badgeText,
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ),
            const SizedBox(height: 6),
            const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppTheme.primary),
          ],
        ),
        onTap: () {
          context.push(
            '/teacher/students/${student.studentId}/detail?name=${Uri.encodeComponent(student.displayName)}',
          );
        },
      ),
    );
  }
}
