import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/features/parent/models/parent_models.dart';
import 'package:quran_forum/features/parent/providers/parent_provider.dart';
import 'package:quran_forum/features/parent/screens/parent_child_attendance_screen.dart';
import 'package:quran_forum/features/parent/screens/parent_child_evaluations_screen.dart';
import 'package:quran_forum/features/parent/screens/parent_child_exams_screen.dart';
import 'package:quran_forum/features/parent/screens/parent_child_plan_screen.dart';
import 'package:quran_forum/features/parent/screens/parent_child_progress_screen.dart';
import 'package:quran_forum/features/parent/screens/parent_child_recitation_screen.dart';
import 'package:quran_forum/features/parent/screens/parent_home_screen.dart';
import 'package:quran_forum/features/student/models/student_models.dart';

void main() {
  final mockChild1 = ParentChildSummary(
    id: 'stu-1',
    name: 'عبد الرحمن خالد',
    relationship: 'ابن',
    isPrimary: true,
    halaqaName: 'حلقة الإمام نافع',
    teacherName: 'الشيخ محمد',
    attendanceRate: 98.0,
    lastExamScore: 95.0,
    lastExamTitle: 'اختبار جزء عم',
    latestRating: 'EXCELLENT',
  );

  final mockChild2 = ParentChildSummary(
    id: 'stu-2',
    name: 'فاطمة خالد',
    relationship: 'ابنة',
    isPrimary: false,
    halaqaName: 'حلقة الزهراء',
    teacherName: 'الأستاذة مريم',
    attendanceRate: 92.0,
    lastExamScore: 88.0,
    lastExamTitle: 'اختبار التجويد',
    latestRating: 'VERY_GOOD',
  );

  final mockChild1Dashboard = StudentDashboardModel(
    student: StudentInfo(
      id: 'stu-1',
      name: 'عبد الرحمن خالد',
      halaqaName: 'حلقة الإمام نافع',
      teacherName: 'الشيخ محمد',
    ),
    plan: PlanSummaryModel(
      id: 'plan-1',
      name: 'خطة حفظ جزء تبارك',
      type: 'HIFZ',
      totalItems: 12,
      completedItems: 9,
      progressPercentage: 75.0,
      items: [
        {'id': 'item-1', 'surahNumber': 67, 'fromAyah': 1, 'toAyah': 30, 'status': 'COMPLETED'},
      ],
    ),
    attendance: AttendanceSummaryModel(
      totalSessions: 30,
      presentCount: 29,
      absentCount: 1,
      lateCount: 0,
      excusedCount: 0,
      attendanceRate: 96.6,
    ),
    totalMemorizations: 22,
    totalRevisions: 40,
    upcomingExams: [
      UpcomingExamModel(id: 'ex-1', title: 'اختبار سورة الملك', examType: 'MONTHLY', maxScore: 100),
    ],
    recentResults: [
      ExamResultModel(
        id: 'res-1',
        examTitle: 'اختبار سورة القلم',
        examType: 'MONTHLY',
        score: 97,
        maxScore: 100,
        percentage: 97,
        isPassed: true,
        status: 'PASSED',
      ),
    ],
    latestEvaluation: StudentEvaluationModel(
      id: 'ev-1',
      period: 'تقييم رجب',
      evaluationDate: '2026-08-15',
      rating: 'EXCELLENT',
      behaviorScore: 99,
      overallScore: 98,
      teacherNotes: 'مواظب ومتميز في التسميع',
      actionLabel: 'شهادة تقدير',
    ),
  );

  testWidgets('1. ParentHomeScreen renders multi-child switcher and active child dashboard card', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          parentChildrenProvider.overrideWith((ref) => Future.value([mockChild1, mockChild2])),
          activeChildIdProvider.overrideWith((ref) => 'stu-1'),
          childDashboardProvider('stu-1').overrideWith((ref) => Future.value(mockChild1Dashboard)),
        ],
        child: const MaterialApp(
          home: ParentHomeScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('بوابة ولي الأمر — الملتقى القرآني'), findsOneWidget);
    expect(find.text('الأبناء والمنتسبين (2)'), findsOneWidget);
    expect(find.text('عبد الرحمن خالد'), findsWidgets);
    expect(find.text('فاطمة خالد'), findsOneWidget);
    expect(find.text('خطة حفظ جزء تبارك'), findsOneWidget);
    expect(find.text('75.0%'), findsOneWidget);
    expect(find.text('سجل التسميع'), findsOneWidget);
    expect(find.text('الحضور والغياب'), findsOneWidget);
  });

  testWidgets('2. ParentChildPlanScreen renders child-specific educational plan', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          childPlanProvider('stu-1').overrideWith((ref) => Future.value([mockChild1Dashboard.plan!])),
        ],
        child: const MaterialApp(
          home: ParentChildPlanScreen(studentId: 'stu-1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('الخطة التعليمية للابن'), findsOneWidget);
    expect(find.text('خطة حفظ جزء تبارك'), findsOneWidget);
    expect(find.text('سورة رقم 67 (الآيات 1 - 30)'), findsOneWidget);
    expect(find.text('تم الإنجاز'), findsOneWidget);
  });

  testWidgets('3. ParentChildAttendanceScreen renders child attendance breakdown', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          childAttendanceProvider('stu-1').overrideWith(
            (ref) => Future.value({
              'summary': {
                'attendanceRate': 96.6,
                'totalSessions': 30,
                'presentCount': 29,
                'absentCount': 1,
                'lateCount': 0,
                'excusedCount': 0,
              },
              'history': [
                {'id': 'att-1', 'date': '2026-08-16', 'status': 'PRESENT', 'notes': 'حاضر في الموعد'},
              ],
            }),
          ),
        ],
        child: const MaterialApp(
          home: ParentChildAttendanceScreen(studentId: 'stu-1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('سجل حضور وغياب الابن'), findsOneWidget);
    expect(find.text('96.6%'), findsOneWidget);
    expect(find.text('جلسة تاريخ: 2026-08-16'), findsOneWidget);
  });

  testWidgets('4. ParentChildRecitationScreen renders child memorization and revision records', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          childMemorizationProvider('stu-1').overrideWith(
            (ref) => Future.value([
              {
                'id': 'mem-1',
                'date': '2026-08-14',
                'surahNumber': 67,
                'fromAyah': 1,
                'toAyah': 15,
                'score': 99.0,
                'rating': 'EXCELLENT',
                'mistakesCount': 0,
                'teacherNotes': 'قراءة محكمة ومتقنة',
              }
            ]),
          ),
          childRevisionProvider('stu-1').overrideWith((ref) => Future.value([])),
        ],
        child: const MaterialApp(
          home: ParentChildRecitationScreen(studentId: 'stu-1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('سجل تسميع ومراجعة الابن'), findsOneWidget);
    expect(find.text('سورة رقم 67 (الآيات 1 - 15)'), findsOneWidget);
    expect(find.text('الدرجة: 99%'), findsOneWidget);
    expect(find.text('ملاحظة المعلم: قراءة محكمة ومتقنة'), findsOneWidget);
  });

  testWidgets('5. ParentChildExamsScreen renders child exam results', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          childExamsProvider('stu-1').overrideWith(
            (ref) => Future.value({
              'upcomingExams': [
                UpcomingExamModel(id: 'ex-1', title: 'اختبار الحفظ الفصلي', examType: 'MIDTERM', maxScore: 100),
              ],
              'results': [
                ExamResultModel(
                  id: 'res-1',
                  examTitle: 'اختبار سورة القلم',
                  examType: 'MONTHLY',
                  score: 97,
                  maxScore: 100,
                  percentage: 97,
                  isPassed: true,
                  status: 'PASSED',
                ),
              ],
            }),
          ),
        ],
        child: const MaterialApp(
          home: ParentChildExamsScreen(studentId: 'stu-1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('اختبارات ونتائج الابن'), findsOneWidget);
    expect(find.text('اختبار الحفظ الفصلي'), findsOneWidget);
    expect(find.text('اختبار سورة القلم'), findsOneWidget);
    expect(find.text('ناجح'), findsOneWidget);
    expect(find.text('97.0%'), findsOneWidget);
  });

  testWidgets('6. ParentChildEvaluationsScreen renders periodic evaluations', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          childEvaluationsProvider('stu-1').overrideWith(
            (ref) => Future.value([
              StudentEvaluationModel(
                id: 'ev-1',
                period: 'التقييم الفصلي',
                evaluationDate: '2026-08-15',
                rating: 'EXCELLENT',
                behaviorScore: 100,
                discipline: 98,
                participation: 96,
                overallScore: 98,
                teacherNotes: 'ابنكم قدوة في الأدب والتفوق',
                actionLabel: 'تكريم وتميز',
              ),
            ]),
          ),
        ],
        child: const MaterialApp(
          home: ParentChildEvaluationsScreen(studentId: 'stu-1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('التقييمات التربوية للابن'), findsOneWidget);
    expect(find.text('التقييم الفصلي'), findsOneWidget);
    expect(find.text('ممتاز ومتميز'), findsOneWidget);
    expect(find.text('ابنكم قدوة في الأدب والتفوق'), findsOneWidget);
    expect(find.text('التوصية: تكريم وتميز'), findsOneWidget);
  });

  testWidgets('7. ParentChildProgressScreen renders child cumulative overview', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          childProgressProvider('stu-1').overrideWith(
            (ref) => Future.value({
              'attendanceRate': 96.6,
              'totalSessions': 30,
              'totalMemorizations': 22,
              'totalRevisions': 40,
              'totalExamsTaken': 4,
              'examAveragePercentage': 96.0,
              'evaluationAverage': 98.0,
              'statusLabel': 'طالب متميز ومتفوق',
            }),
          ),
        ],
        child: const MaterialApp(
          home: ParentChildProgressScreen(studentId: 'stu-1'),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('تقرير إنجاز الابن'), findsOneWidget);
    expect(find.text('طالب متميز ومتفوق'), findsOneWidget);
    expect(find.text('96.6%'), findsOneWidget);
    expect(find.text('96.0%'), findsOneWidget);
    expect(find.text('22'), findsOneWidget);
    expect(find.text('40'), findsOneWidget);
  });
}
