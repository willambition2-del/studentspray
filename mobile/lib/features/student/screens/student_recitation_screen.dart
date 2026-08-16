import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/theme/app_theme.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentRecitationScreen extends ConsumerStatefulWidget {
  const StudentRecitationScreen({super.key});

  @override
  ConsumerState<StudentRecitationScreen> createState() => _StudentRecitationScreenState();
}

class _StudentRecitationScreenState extends ConsumerState<StudentRecitationScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final memAsync = ref.watch(studentMemorizationProvider);
    final revAsync = ref.watch(studentRevisionProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('سجل الحفظ والمراجعة'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppTheme.accentGold,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(text: 'الحفظ الجديد', icon: Icon(Icons.bookmark_added_rounded)),
            Tab(text: 'المراجعة والتثبيت', icon: Icon(Icons.auto_stories_rounded)),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // 1. Memorization Tab
          memAsync.when(
            data: (records) {
              if (records.isEmpty) {
                return const EmptyStateView(title: 'لا توجد تسميعات حفظ مسجلة بعد', icon: Icons.menu_book);
              }
              return RefreshIndicator(
                onRefresh: () async => ref.refresh(studentMemorizationProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: records.length,
                  itemBuilder: (ctx, i) => _RecitationRecordCard(record: records[i] as Map<String, dynamic>, isHifz: true),
                ),
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل سجل الحفظ...'),
            error: (err, stack) => ErrorView(
              message: 'تعذر تحميل سجل الحفظ',
              onRetry: () => ref.refresh(studentMemorizationProvider),
            ),
          ),

          // 2. Revision Tab
          revAsync.when(
            data: (records) {
              if (records.isEmpty) {
                return const EmptyStateView(title: 'لا توجد تسميعات مراجعة مسجلة بعد', icon: Icons.menu_book);
              }
              return RefreshIndicator(
                onRefresh: () async => ref.refresh(studentRevisionProvider.future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: records.length,
                  itemBuilder: (ctx, i) => _RecitationRecordCard(record: records[i] as Map<String, dynamic>, isHifz: false),
                ),
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل سجل المراجعة...'),
            error: (err, stack) => ErrorView(
              message: 'تعذر تحميل سجل المراجعة',
              onRetry: () => ref.refresh(studentRevisionProvider),
            ),
          ),
        ],
      ),
    );
  }
}

class _RecitationRecordCard extends StatelessWidget {
  final Map<String, dynamic> record;
  final bool isHifz;

  const _RecitationRecordCard({
    required this.record,
    required this.isHifz,
  });

  @override
  Widget build(BuildContext context) {
    final date = record['date'] as String? ?? '';
    final surahNumber = record['surahNumber'];
    final fromAyah = record['fromAyah'];
    final toAyah = record['toAyah'];
    final score = (record['score'] as num?)?.toDouble() ?? 0.0;
    final rating = record['rating'] as String? ?? 'VERY_GOOD';
    final mistakes = (record['mistakesCount'] as num?)?.toInt() ?? 0;
    final notes = record['teacherNotes'] as String?;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: isHifz ? Colors.teal.shade100 : Colors.indigo.shade100,
                      child: Icon(
                        isHifz ? Icons.bookmark_outline : Icons.repeat,
                        size: 18,
                        color: isHifz ? Colors.teal.shade800 : Colors.indigo.shade800,
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      surahNumber != null ? 'سورة رقم $surahNumber (الآيات $fromAyah - $toAyah)' : 'تسميع مقرأ',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
                  ],
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(
                    color: score >= 90 ? Colors.green.shade50 : (score >= 75 ? Colors.amber.shade50 : Colors.red.shade50),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: score >= 90 ? Colors.green.shade300 : (score >= 75 ? Colors.amber.shade300 : Colors.red.shade300),
                    ),
                  ),
                  child: Text(
                    'الدرجة: ${score.toStringAsFixed(0)}%',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 12,
                      color: score >= 90 ? Colors.green.shade800 : (score >= 75 ? Colors.amber.shade800 : Colors.red.shade800),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(Icons.calendar_today, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text(date, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                const SizedBox(width: 16),
                Icon(Icons.rule, size: 14, color: Colors.grey.shade600),
                const SizedBox(width: 4),
                Text('التقييم: $rating', style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
                if (mistakes > 0) ...[
                  const SizedBox(width: 16),
                  Icon(Icons.error_outline, size: 14, color: Colors.orange.shade700),
                  const SizedBox(width: 4),
                  Text('الأخطاء: $mistakes', style: TextStyle(fontSize: 12, color: Colors.orange.shade800)),
                ],
              ],
            ),
            if (notes != null && notes.isNotEmpty) ...[
              const SizedBox(height: 8),
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  'ملاحظة المعلم: $notes',
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade800, fontStyle: FontStyle.italic),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
