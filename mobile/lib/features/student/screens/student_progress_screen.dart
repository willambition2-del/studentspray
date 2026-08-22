import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/design/app_colors.dart';
import '../../../core/design/app_typography.dart';
import '../../../core/widgets/metric_card.dart';
import '../../../core/widgets/modern_card.dart';
import '../../../core/widgets/section_header.dart';
import '../../../core/widgets/state_views.dart';
import '../providers/student_provider.dart';

class StudentPortalProgressScreen extends ConsumerWidget {
  const StudentPortalProgressScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final progressAsync = ref.watch(studentProgressProvider);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('مؤشرات الإنجاز والتقدم'),
      ),
      body: progressAsync.when(
        data: (data) {
          final attendanceRate = (data['attendanceRate'] as num?)?.toDouble() ?? 100.0;
          final totalSessions = (data['totalSessions'] as num?)?.toInt() ?? 0;
          final totalHifz = (data['totalMemorizations'] as num?)?.toInt() ?? 0;
          final totalRev = (data['totalRevisions'] as num?)?.toInt() ?? 0;
          final totalExams = (data['totalExamsTaken'] as num?)?.toInt() ?? 0;
          final examAvg = (data['examAveragePercentage'] as num?)?.toDouble() ?? 0.0;
          final evalAvg = (data['evaluationAverage'] as num?)?.toDouble() ?? 0.0;
          final statusLabel = data['statusLabel'] as String? ?? 'ملتزم بالخطة';

          return RefreshIndicator(
            color: AppColors.primary,
            onRefresh: () async => ref.refresh(studentProgressProvider.future),
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Top Distinction Banner
                ModernCard(
                  backgroundColor: AppColors.primaryDark,
                  borderColor: Colors.transparent,
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Icon(Icons.emoji_events_outlined, color: AppColors.accentGold, size: 44),
                      const SizedBox(height: 10),
                      Text(
                        statusLabel,
                        style: const TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          color: Colors.white,
                          fontSize: 19,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'استمر في العطاء والالتزام للوصول إلى ختم القرآن الكريم بتفوق وإتقان',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontFamily: AppTypography.fontFamily,
                          color: Colors.white70,
                          fontSize: 12.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                const SectionHeader(
                  title: 'المؤشرات التراكمية',
                  icon: Icons.analytics_outlined,
                ),
                const SizedBox(height: 10),

                // Metrics Grid
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'نسبة الحضور',
                        value: '${attendanceRate.toStringAsFixed(1)}%',
                        subtitle: '$totalSessions جلسة مسجلة',
                        icon: Icons.check_circle_outline,
                        iconColor: AppColors.statusPresent,
                        iconBgColor: AppColors.statusPresentBg,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: MetricCard(
                        title: 'معدل الاختبارات',
                        value: '${examAvg.toStringAsFixed(1)}%',
                        subtitle: '$totalExams اختبارات معتمدة',
                        icon: Icons.assignment_turned_in_outlined,
                        iconColor: const Color(0xFF7C3AED),
                        iconBgColor: const Color(0xFFF3E8FF),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'جلسات الحفظ',
                        value: '$totalHifz',
                        subtitle: 'مقررات حفظ منجزة',
                        icon: Icons.menu_book_outlined,
                        iconColor: AppColors.secondary,
                        iconBgColor: AppColors.secondarySoft,
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: MetricCard(
                        title: 'جلسات المراجعة',
                        value: '$totalRev',
                        subtitle: 'تثبيت ومراجعة',
                        icon: Icons.refresh,
                        iconColor: const Color(0xFF4F46E5),
                        iconBgColor: const Color(0xFFEEF2FF),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Row(
                  children: [
                    Expanded(
                      child: MetricCard(
                        title: 'متوسط التقييم التربوي',
                        value: '${evalAvg.toStringAsFixed(1)} / 100',
                        subtitle: 'السلوك والانضباط',
                        icon: Icons.star_outline,
                        iconColor: AppColors.accentGoldDark,
                        iconBgColor: AppColors.accentGoldSoft,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Multi-Period Cumulative Progress Line Curve
                _CumulativeProgressCurveCard(
                  totalHifz: totalHifz,
                  totalRev: totalRev,
                  attendanceRate: attendanceRate,
                ),
              ],
            ),
          );
        },
        loading: () => const LoadingView(message: 'جاري تحميل مؤشرات الإنجاز...'),
        error: (err, stack) => ErrorView(
          message: 'تعذر تحميل مؤشرات الإنجاز والتقدم',
          onRetry: () => ref.refresh(studentProgressProvider),
        ),
      ),
    );
  }
}

class _CumulativeProgressCurveCard extends ConsumerWidget {
  final int totalHifz;
  final int totalRev;
  final double attendanceRate;

  const _CumulativeProgressCurveCard({
    required this.totalHifz,
    required this.totalRev,
    required this.attendanceRate,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final historyAsync = ref.watch(studentProgressHistoryProvider);

    return historyAsync.when(
      data: (history) {
        final points = history.points;
        if (points.isEmpty) {
          return const ModernCard(
            padding: EdgeInsets.all(24),
            child: Center(
              child: Text(
                'لا توجد بيانات تاريخية كافية لرسم منحنى التقدم التراكمي',
                style: TextStyle(
                  fontFamily: AppTypography.fontFamily,
                  color: AppColors.textSecondary,
                ),
              ),
            ),
          );
        }

        final lastCumulative = points.last.cumulativeMemorized;
        final pointValues = points.map((p) => p.cumulativeMemorized.toDouble()).toList();

        return ModernCard(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'منحنى التقدم التراكمي في الحفظ',
                    style: TextStyle(
                      fontFamily: AppTypography.fontFamily,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'المجموع: $lastCumulative صفحة',
                      style: const TextStyle(
                        fontFamily: AppTypography.fontFamily,
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primaryDark,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 120,
                width: double.infinity,
                child: CustomPaint(
                  painter: _ProgressCurvePainter(points: pointValues),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: points
                    .map((p) => Text(
                          '${p.label}\n(${p.cumulativeMemorized})',
                          textAlign: TextAlign.center,
                          style: const TextStyle(
                            fontFamily: AppTypography.fontFamily,
                            fontSize: 9.5,
                            color: AppColors.textSecondary,
                          ),
                        ))
                    .toList(),
              ),
            ],
          ),
        );
      },
      loading: () => const ModernCard(
        padding: EdgeInsets.all(24),
        child: Center(
          child: SizedBox(
            width: 24,
            height: 24,
            child: CircularProgressIndicator(strokeWidth: 2),
          ),
        ),
      ),
      error: (_, __) => const SizedBox.shrink(),
    );
  }
}

class _ProgressCurvePainter extends CustomPainter {
  final List<double> points;

  _ProgressCurvePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    if (points.isEmpty) return;

    final maxVal = points.reduce((a, b) => a > b ? a : b);
    final minVal = 0.0;
    final valRange = (maxVal - minVal) > 0 ? (maxVal - minVal) : 1.0;

    final linePaint = Paint()
      ..color = AppColors.primary
      ..strokeWidth = 3.0
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    final fillPaint = Paint()
      ..shader = LinearGradient(
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
        colors: [
          AppColors.primary.withAlpha(80),
          AppColors.primary.withAlpha(5),
        ],
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height))
      ..style = PaintingStyle.fill;

    final dotPaint = Paint()
      ..color = AppColors.primaryDark
      ..style = PaintingStyle.fill;

    final dotBorderPaint = Paint()
      ..color = Colors.white
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path();
    final fillPath = Path();

    final stepX = points.length > 1 ? size.width / (points.length - 1) : size.width / 2;

    for (int i = 0; i < points.length; i++) {
      final x = i * stepX;
      final y = size.height - ((points[i] - minVal) / valRange * (size.height - 20) + 10);

      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        final prevX = (i - 1) * stepX;
        final prevY = size.height - ((points[i - 1] - minVal) / valRange * (size.height - 20) + 10);
        final cx = (prevX + x) / 2;
        path.cubicTo(cx, prevY, cx, y, x, y);
        fillPath.cubicTo(cx, prevY, cx, y, x, y);
      }
    }

    fillPath.lineTo(size.width, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, linePaint);

    for (int i = 0; i < points.length; i++) {
      final x = i * stepX;
      final y = size.height - ((points[i] - minVal) / valRange * (size.height - 20) + 10);
      canvas.drawCircle(Offset(x, y), 5, dotPaint);
      canvas.drawCircle(Offset(x, y), 5, dotBorderPaint);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
