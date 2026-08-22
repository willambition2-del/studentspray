import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_radius.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentRecitationScreen extends ConsumerStatefulWidget {
  const StudentRecitationScreen({super.key});

  @override
  ConsumerState<StudentRecitationScreen> createState() => _StudentRecitationScreenState();
}

class _StudentRecitationScreenState extends ConsumerState<StudentRecitationScreen> with SingleTickerProviderStateMixin {
  late final TabController _tabController;
  String _searchQuery = '';

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
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('سجل الحفظ والمراجعة'),
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
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            color: AppColors.background,
            child: TextField(
              decoration: InputDecoration(
                hintText: 'ابحث برقم أو اسم السورة، أو الآيات...',
                hintStyle: AppTypography.label,
                prefixIcon: const Icon(Icons.search, color: AppColors.primary, size: 18),
                suffixIcon: _searchQuery.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear, size: 16, color: AppColors.textMuted),
                        onPressed: () => setState(() => _searchQuery = ''),
                      )
                    : null,
                filled: true,
                fillColor: AppColors.surface,
                contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  borderSide: const BorderSide(color: AppColors.border, width: 0.8),
                ),
                enabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                  borderSide: const BorderSide(color: AppColors.border, width: 0.8),
                ),
              ),
              onChanged: (val) => setState(() => _searchQuery = val.trim()),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // 1. Memorization Tab
                memAsync.when(
                  data: (records) {
                    final filtered = records.where((r) {
                      if (_searchQuery.isEmpty) return true;
                      final sNum = '${r["surahNumber"] ?? ""}';
                      final notes = '${r["teacherNotes"] ?? ""}';
                      return sNum.contains(_searchQuery) || notes.contains(_searchQuery);
                    }).toList();

                    if (filtered.isEmpty) {
                      return const EmptyStateView(
                        title: 'لا توجد تسميعات مطابقة للبحث',
                        subtitle: 'ستظهر هنا جلسات الحفظ الجديد فور رصدها من قبل معلم الحلقة',
                        icon: Icons.menu_book_outlined,
                      );
                    }
                    return RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () async => ref.refresh(studentMemorizationProvider.future),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) => _RecitationRecordCard(record: filtered[i], isHifz: true),
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
                    final filtered = records.where((r) {
                      if (_searchQuery.isEmpty) return true;
                      final sNum = '${r["surahNumber"] ?? ""}';
                      final notes = '${r["teacherNotes"] ?? ""}';
                      return sNum.contains(_searchQuery) || notes.contains(_searchQuery);
                    }).toList();

                    if (filtered.isEmpty) {
                      return const EmptyStateView(
                        title: 'لا توجد تسميعات مطابقة للبحث',
                        subtitle: 'ستظهر هنا جلسات التثبيت والمراجعة فور رصدها من قبل معلم الحلقة',
                        icon: Icons.menu_book_outlined,
                      );
                    }
                    return RefreshIndicator(
                      color: AppColors.primary,
                      onRefresh: () async => ref.refresh(studentRevisionProvider.future),
                      child: ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: filtered.length,
                        itemBuilder: (ctx, i) => _RecitationRecordCard(record: filtered[i], isHifz: false),
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
