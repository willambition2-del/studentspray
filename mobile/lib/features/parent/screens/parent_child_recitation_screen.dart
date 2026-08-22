import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/parent_provider.dart';

class ParentChildRecitationScreen extends ConsumerStatefulWidget {
  final String studentId;

  const ParentChildRecitationScreen({super.key, required this.studentId});

  @override
  ConsumerState<ParentChildRecitationScreen> createState() => _ParentChildRecitationScreenState();
}

class _ParentChildRecitationScreenState extends ConsumerState<ParentChildRecitationScreen> with SingleTickerProviderStateMixin {
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
    final memAsync = ref.watch(childMemorizationProvider(widget.studentId));
    final revAsync = ref.watch(childRevisionProvider(widget.studentId));

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سجل تسميع ومراجعة الابن'),
        bottom: TabBar(
          controller: _tabController,
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
            Tab(text: 'الحفظ الجديد', icon: Icon(Icons.bookmark_border, size: 18)),
            Tab(text: 'المراجعة والتثبيت', icon: Icon(Icons.menu_book_outlined, size: 18)),
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
                return const EmptyStateView(
                  title: 'لا توجد تسميعات حفظ مسجلة للابن بعد',
                  subtitle: 'ستظهر هنا جلسات التسميع فور رصدها من قبل المعلم',
                  icon: Icons.menu_book_outlined,
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async => ref.refresh(childMemorizationProvider(widget.studentId).future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: records.length,
                  itemBuilder: (ctx, i) => _RecitationRecordCard(record: records[i] as Map<String, dynamic>, isHifz: true),
                ),
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل سجل الحفظ للابن...'),
            error: (err, stack) => ErrorView(
              message: 'تعذر تحميل سجل الحفظ للابن',
              onRetry: () => ref.refresh(childMemorizationProvider(widget.studentId)),
            ),
          ),

          // 2. Revision Tab
          revAsync.when(
            data: (records) {
              if (records.isEmpty) {
                return const EmptyStateView(
                  title: 'لا توجد تسميعات مراجعة مسجلة للابن بعد',
                  subtitle: 'ستظهر هنا جلسات التثبيت والمراجعة فور رصدها من قبل المعلم',
                  icon: Icons.menu_book_outlined,
                );
              }
              return RefreshIndicator(
                color: AppColors.primary,
                onRefresh: () async => ref.refresh(childRevisionProvider(widget.studentId).future),
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: records.length,
                  itemBuilder: (ctx, i) => _RecitationRecordCard(record: records[i] as Map<String, dynamic>, isHifz: false),
                ),
              );
            },
            loading: () => const LoadingView(message: 'جاري تحميل سجل المراجعة للابن...'),
            error: (err, stack) => ErrorView(
              message: 'تعذر تحميل سجل المراجعة للابن',
              onRetry: () => ref.refresh(childRevisionProvider(widget.studentId)),
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

  const _RecitationRecordCard({required this.record, required this.isHifz});

  @override
  Widget build(BuildContext context) {
    final surahNum = record['surahNumber'];
    final rawScore = record['score'] ?? record['evaluationScore'] ?? 100;
    final score = rawScore is double ? rawScore.toInt() : rawScore;
    final rating = record['rating'] as String? ?? 'EXCELLENT';
    final date = record['date'] as String? ?? '';
    final notes = record['teacherNotes'] as String?;
    final fromAyah = record['fromAyah'] ?? 1;
    final toAyah = record['toAyah'] ?? 10;

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
                surahNum != null ? 'سورة رقم $surahNum (الآيات $fromAyah - $toAyah)' : 'مقرر قرآني',
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
                  color: isHifz ? AppColors.primarySoft : const Color(0xFFEEF2FF),
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
                child: Text(
                  'الدرجة: $score%',
                  style: TextStyle(
                    fontFamily: AppTypography.fontFamily,
                    color: isHifz ? AppColors.primaryDark : const Color(0xFF4F46E5),
                    fontWeight: FontWeight.bold,
                    fontSize: 11.5,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(
            'التاريخ: $date • التقدير: $rating',
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
              child: Text(
                'ملاحظة المعلم: $notes',
                style: AppTypography.secondary,
              ),
            ),
          ],
        ],
      ),
    );
  }
}
