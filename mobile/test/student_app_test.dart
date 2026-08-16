import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/features/student/models/student_models.dart';
import 'package:quran_forum/features/student/providers/student_provider.dart';
import 'package:quran_forum/features/student/screens/student_attendance_screen.dart';
import 'package:quran_forum/features/student/screens/student_evaluations_screen.dart';
import 'package:quran_forum/features/student/screens/student_exams_screen.dart';
import 'package:quran_forum/features/student/screens/student_home_screen.dart';
import 'package:quran_forum/features/student/screens/student_plan_screen.dart';
import 'package:quran_forum/features/student/screens/student_progress_screen.dart';
import 'package:quran_forum/features/student/screens/student_recitation_screen.dart';

void main() {
  final mockStudentInfo = StudentInfo(
    id: 'stu-1',
    name: 'أحمد محمود',
    halaqaName: 'حلقة الإمام عاصم',
    teacherName: 'الشيخ عبد الله',
    teacherPhone: '0555123456',
  );

  final mockPlan = PlanSummaryModel(
    id: 'plan-1',
    name: 'خطة حفظ جزء عم',
    type: 'HIFZ',
    totalItems: 10,
    completedItems: 7,
    progressPercentage: 70.0,
    items: [
      {'id': 'item-1', 'surahNumber': 78, 'fromAyah': 1, 'toAyah': 20, 'status': 'COMPLETED', 'notes': 'متقن'},
      {'id': 'item-2', 'surahNumber': 78, 'fromAyah': 21, 'toAyah': 40, 'status': 'PENDING'},
    ],
  );

  final mockAttendance = AttendanceSummaryModel(
    totalSessions: 20,
    presentCount: 19,
    absentCount: 1,
    lateCount: 0,
    excusedCount: 0,
    attendanceRate: 95.0,
  );

  final mockDashboard = StudentDashboardModel(
    student: mockStudentInfo,
    plan: mockPlan,
    attendance: mockAttendance,
    totalMemorizations: 15,
    totalRevisions: 25,
    upcomingExams: [
      UpcomingExamModel(id: 'ex-1', title: 'اختبار الحفظ الشهري', examType: 'MONTHLY', maxScore: 100, scheduledDate: '2026-08-25'),
    ],
    recentResults: [
      ExamResultModel(
        id: 'res-1',
        examTitle: 'اختبار التجويد',
        examType: 'MONTHLY',
        score: 96,
        maxScore: 100,
        percentage: 96,
        isPassed: true,
        status: 'PASSED',
      ),
    ],
    latestEvaluation: StudentEvaluationModel(
      id: 'ev-1',
      period: 'التقييم الشهري',
      evaluationDate: '2026-08-20',
      rating: 'EXCELLENT',
      behaviorScore: 98,
      overallScore: 96,
      teacherNotes: 'طالب متميز جداً',
      actionLabel: 'تكريم شهري',
    ),
  );

  testWidgets('1. StudentHomeScreen renders student profile, plan, attendance and navigation cards', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentDashboardProvider.overrideWith((ref) => Future.value(mockDashboard)),
        ],
        child: const MaterialApp(
          home: StudentHomeScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('بوابة الطالب القرآني'), findsOneWidget);
    expect(find.text('أحمد محمود'), findsOneWidget);
    expect(find.text('الحلقة: حلقة الإمام عاصم'), findsOneWidget);
    expect(find.text('المعلم: الشيخ عبد الله'), findsOneWidget);
    expect(find.text('خطة حفظ جزء عم'), findsOneWidget);
    expect(find.text('70.0%'), findsOneWidget);
    expect(find.text('سجل التسميع'), findsOneWidget);
    expect(find.text('الحضور والغياب'), findsOneWidget);
    expect(find.text('الاختبارات والنتائج'), findsOneWidget);
    expect(find.text('التقييمات الدورية'), findsOneWidget);
  });

  testWidgets('2. StudentPlanScreen renders plan progress and items', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentPlanProvider.overrideWith((ref) => Future.value([mockPlan])),
        ],
        child: const MaterialApp(
          home: StudentPlanScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('الخطة التعليمية'), findsOneWidget);
    expect(find.text('خطة حفظ جزء عم'), findsOneWidget);
    expect(find.text('سورة رقم 78 (الآيات 1 - 20)'), findsOneWidget);
    expect(find.text('تم الإنجاز'), findsOneWidget);
    expect(find.text('مستهدف'), findsOneWidget);
  });

  testWidgets('3. StudentAttendanceScreen renders summary rates and session records', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentAttendanceProvider.overrideWith(
            (ref) => Future.value({
              'summary': {
                'attendanceRate': 95.0,
                'totalSessions': 20,
                'presentCount': 19,
                'absentCount': 1,
                'lateCount': 0,
                'excusedCount': 0,
              },
              'history': [
                {'id': 'rec-1', 'date': '2026-08-16', 'status': 'PRESENT', 'notes': 'حضور مبكر'},
              ],
            }),
          ),
        ],
        child: const MaterialApp(
          home: StudentAttendanceScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('سجل الحضور والغياب'), findsOneWidget);
    expect(find.text('95.0%'), findsOneWidget);
    expect(find.text('حاضر'), findsWidgets);
    expect(find.text('جلسة تاريخ: 2026-08-16'), findsOneWidget);
  });

  testWidgets('4. StudentRecitationScreen renders memorization and revision records', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentMemorizationProvider.overrideWith(
            (ref) => Future.value([
              {
                'id': 'mem-1',
                'date': '2026-08-15',
                'surahNumber': 78,
                'fromAyah': 1,
                'toAyah': 15,
                'score': 98.0,
                'rating': 'EXCELLENT',
                'mistakesCount': 0,
                'teacherNotes': 'حفظ ممتاز جداً بدون تردد',
              }
            ]),
          ),
          studentRevisionProvider.overrideWith((ref) => Future.value([])),
        ],
        child: const MaterialApp(
          home: StudentRecitationScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('سجل الحفظ والمراجعة'), findsOneWidget);
    expect(find.text('الحفظ الجديد'), findsOneWidget);
    expect(find.text('المراجعة والتثبيت'), findsOneWidget);
    expect(find.text('سورة رقم 78 (الآيات 1 - 15)'), findsOneWidget);
    expect(find.text('الدرجة: 98%'), findsOneWidget);
    expect(find.text('ملاحظة المعلم: حفظ ممتاز جداً بدون تردد'), findsOneWidget);
  });

  testWidgets('5. StudentExamsScreen renders upcoming exams and published results', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentExamsProvider.overrideWith(
            (ref) => Future.value({
              'upcomingExams': [
                UpcomingExamModel(id: 'ex-1', title: 'اختبار الحفظ النهائي', examType: 'FINAL', maxScore: 100, scheduledDate: '2026-08-30'),
              ],
              'results': [
                ExamResultModel(
                  id: 'res-1',
                  examTitle: 'اختبار الحفظ الشهري',
                  examType: 'MONTHLY',
                  score: 95,
                  maxScore: 100,
                  percentage: 95,
                  isPassed: true,
                  status: 'PASSED',
                ),
              ],
            }),
          ),
        ],
        child: const MaterialApp(
          home: StudentExamsScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('الاختبارات والنتائج'), findsOneWidget);
    expect(find.text('اختبار الحفظ النهائي'), findsOneWidget);
    expect(find.text('اختبار الحفظ الشهري'), findsOneWidget);
    expect(find.text('ناجح'), findsOneWidget);
    expect(find.text('95.0%'), findsOneWidget);
  });

  testWidgets('6. StudentEvaluationsScreen renders evaluation cards and ratings', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentEvaluationsProvider.overrideWith(
            (ref) => Future.value([
              StudentEvaluationModel(
                id: 'ev-1',
                period: 'التقييم الدوري الأول',
                evaluationDate: '2026-08-20',
                rating: 'EXCELLENT',
                behaviorScore: 100,
                discipline: 95,
                participation: 98,
                overallScore: 98,
                teacherNotes: 'طالب قدوة في الحلقة',
                actionLabel: 'تكريم وتميز',
              ),
            ]),
          ),
        ],
        child: const MaterialApp(
          home: StudentEvaluationsScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('التقييمات الدورية والتربوية'), findsOneWidget);
    expect(find.text('التقييم الدوري الأول'), findsOneWidget);
    expect(find.text('ممتاز ومتميز'), findsOneWidget);
    expect(find.text('توجيهات المعلم:'), findsOneWidget);
    expect(find.text('طالب قدوة في الحلقة'), findsOneWidget);
    expect(find.text('التوصية: تكريم وتميز'), findsOneWidget);
  });

  testWidgets('7. StudentProgressScreen renders cumulative indicators', (tester) async {
    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          studentProgressProvider.overrideWith(
            (ref) => Future.value({
              'attendanceRate': 96.5,
              'totalSessions': 24,
              'totalMemorizations': 18,
              'totalRevisions': 30,
              'totalExamsTaken': 3,
              'examAveragePercentage': 94.5,
              'evaluationAverage': 97.0,
              'statusLabel': 'طالب متميز ومتفوق',
            }),
          ),
        ],
        child: const MaterialApp(
          home: StudentPortalProgressScreen(),
        ),
      ),
    );

    await tester.pumpAndSettle();

    expect(find.text('مؤشرات الإنجاز والتقدم'), findsOneWidget);
    expect(find.text('طالب متميز ومتفوق'), findsOneWidget);
    expect(find.text('96.5%'), findsOneWidget);
    expect(find.text('94.5%'), findsOneWidget);
    expect(find.text('18'), findsOneWidget);
    expect(find.text('30'), findsOneWidget);
  });
}
