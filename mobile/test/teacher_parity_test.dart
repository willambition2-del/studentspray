import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_forum/features/teacher/screens/teacher_home_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_students_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_student_detail_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_exams_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_evaluations_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_plans_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_reports_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_activities_awards_screen.dart';
import 'package:quran_forum/features/teacher/screens/teacher_profile_screen.dart';
import 'package:quran_forum/features/teacher/providers/teacher_provider.dart';
import 'package:quran_forum/features/teacher/models/teacher_models.dart';
import 'package:quran_forum/features/auth/providers/auth_provider.dart';
import 'package:quran_forum/features/auth/models/user_profile.dart';
import 'package:quran_forum/features/activities_shelf/providers/activities_shelf_provider.dart';
import 'package:quran_forum/features/activities_shelf/models/activity_models.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier(UserProfile user) : super(AuthState(status: AuthStatus.authenticated, user: user));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  setUp(() {
    TestWidgetsFlutterBinding.ensureInitialized();
  });

  final testUser = UserProfile(
    id: 'tch-test-1',
    username: 'teacher1',
    displayName: 'أحمد المعلم',
    email: 'teacher@forum.com',
    forum: const ForumRef(id: 'f1', name: 'ملتقى النور', slug: 'noor-forum'),
    branch: const BranchRef(id: 'b1', name: 'فرع اليرموك', code: 'BR-YAR'),
    roles: const [
      RoleRef(id: 'r1', name: 'TEACHER', displayName: 'معلم'),
    ],
  );

  final testHalaqas = [
    const HalaqaItem(
      id: 'h1',
      name: 'حلقة الإتقان',
      code: 'HLQ-01',
      branchName: 'فرع اليرموك',
      studentsCount: 15,
    ),
  ];

  final testStudents = [
    const WorkspaceStudent(
      studentId: 's1',
      studentNumber: 'STU-101',
      displayName: 'عمر التلميذ',
      username: 'omar',
      todayAttendanceStatus: 'PRESENT',
    ),
  ];

  Widget createTestWidget(Widget child, {List<Override> overrides = const []}) {
    return ProviderScope(
      overrides: [
        authProvider.overrideWith((ref) => FakeAuthNotifier(testUser)),
        myHalaqasProvider.overrideWith((ref) => Future.value(testHalaqas)),
        teacherStudentsProvider.overrideWith((ref) => Future.value(testStudents)),
        teacherDashboardStatsProvider.overrideWith((ref) => Future.value(const TeacherDashboardStats(
          totalHalaqas: 1,
          totalStudents: 15,
          todayPresent: 14,
          todayAbsent: 1,
          todayMemorization: 12,
          todayRevision: 10,
          upcomingExams: 2,
          recordedEvaluations: 5,
        ))),
        ...overrides,
      ],
      child: MaterialApp(
        home: child,
      ),
    );
  }

  testWidgets('1. TeacherHomeScreen renders teacher profile, stats, quick actions and halaqas', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(createTestWidget(const TeacherHomeScreen()));
    await tester.pumpAndSettle();

    expect(find.text('لوحة المعلم'), findsOneWidget);
    expect(find.text('أحمد المعلم'), findsOneWidget);
    expect(find.text('مؤشرات الأداء والإحصائيات'), findsOneWidget);
    expect(find.text('الوصول السريع والإجراءات'), findsOneWidget);
  });

  testWidgets('2. TeacherStudentsScreen renders search and student cards', (tester) async {
    await tester.pumpWidget(createTestWidget(const TeacherStudentsScreen()));
    await tester.pumpAndSettle();

    expect(find.text('شؤون طلاب الحلقات'), findsOneWidget);
    expect(find.text('عمر التلميذ'), findsOneWidget);
    expect(find.text('حاضر اليوم'), findsOneWidget);
  });

  testWidgets('3. TeacherStudentDetailScreen renders multi-tab profile', (tester) async {
    await tester.pumpWidget(createTestWidget(
      const TeacherStudentDetailScreen(studentId: 's1', studentName: 'عمر التلميذ'),
      overrides: [
        studentFullHistoryProvider('s1').overrideWith((ref) => Future.value({
          'progress': {
            'student': {'displayName': 'عمر التلميذ', 'studentNumber': 'STU-101'},
            'metrics': {'attendanceRate': 95, 'totalMemorizationSessions': 20, 'avgMemorizationScore': 98.5},
            'activePlan': {'name': 'خطة حفظ جزء عم', 'progressPercentage': 75},
          },
          'memorization': [],
          'revision': [],
          'evaluations': [],
        })),
      ],
    ));
    await tester.pumpAndSettle();

    expect(find.text('عمر التلميذ'), findsWidgets);
    expect(find.text('نظرة عامة والتقدم'), findsOneWidget);
    expect(find.text('سجل الحفظ'), findsOneWidget);
    expect(find.text('تسميع حفظ'), findsOneWidget);
  });

  testWidgets('4. TeacherExamsScreen renders exams list', (tester) async {
    await tester.pumpWidget(createTestWidget(
      const TeacherExamsScreen(),
      overrides: [
        teacherExamsProvider.overrideWith((ref) => Future.value([
          const TeacherExamItem(
            id: 'e1',
            title: 'اختبار تجويد جزء عم',
            curriculum: 'الجزء الثلاثون',
            examType: 'MONTHLY',
            maxScore: 100,
            passScore: 60,
          ),
        ])),
      ],
    ));
    await tester.pumpAndSettle();

    expect(find.text('الاختبارات ورصد الدرجات'), findsOneWidget);
    expect(find.text('اختبار تجويد جزء عم'), findsOneWidget);
    expect(find.text('رصد الدرجات'), findsOneWidget);
  });

  testWidgets('5. TeacherEvaluationsScreen renders periodic evaluations', (tester) async {
    await tester.pumpWidget(createTestWidget(
      const TeacherEvaluationsScreen(),
      overrides: [
        teacherEvaluationsProvider.overrideWith((ref) => Future.value([
          TeacherEvaluationItem(
            id: 'ev1',
            studentId: 's1',
            studentName: 'عمر التلميذ',
            halaqaId: 'h1',
            evaluationDate: DateTime.now(),
            behaviorScore: 95,
            discipline: 90,
            participation: 92,
            overallScore: 92.3,
            rating: 'EXCELLENT',
            teacherNotes: 'متميز وخلوق',
          ),
        ])),
      ],
    ));
    await tester.pumpAndSettle();

    expect(find.text('التقييم التربوي والسلوكي'), findsOneWidget);
    expect(find.text('عمر التلميذ'), findsOneWidget);
    expect(find.text('تقييم طالب جديد'), findsOneWidget);
  });

  testWidgets('6. TeacherPlansScreen renders educational plans', (tester) async {
    await tester.pumpWidget(createTestWidget(
      const TeacherPlansScreen(),
      overrides: [
        teacherPlansProvider.overrideWith((ref) => Future.value([
          const TeacherEducationalPlan(
            id: 'p1',
            name: 'خطة حفظ وتثبيت جزء تبارك',
            type: 'HIFZ',
            status: 'ACTIVE',
            items: [
              TeacherPlanItemDetail(
                id: 'pi1',
                surahNumber: 67,
                fromAyah: 1,
                toAyah: 30,
                status: 'COMPLETED',
              ),
            ],
          ),
        ])),
      ],
    ));
    await tester.pumpAndSettle();

    expect(find.text('الخطط التعليمية والمقررات'), findsOneWidget);
    expect(find.text('خطة حفظ وتثبيت جزء تبارك'), findsOneWidget);
  });

  testWidgets('7. TeacherReportsScreen renders cumulative indicators', (tester) async {
    await tester.pumpWidget(createTestWidget(const TeacherReportsScreen()));
    await tester.pumpAndSettle();

    expect(find.text('التقارير والإحصائيات التحليلية'), findsOneWidget);
    expect(find.text('الملخص التراكمي العام للحلقات'), findsOneWidget);
  });

  testWidgets('8. TeacherActivitiesAwardsScreen renders tabs and award granting', (tester) async {
    await tester.pumpWidget(createTestWidget(
      const TeacherActivitiesAwardsScreen(),
      overrides: [
        generalActivitiesProvider.overrideWith((ref) => Future.value([
          ActivityItem(
            id: 'act1',
            title: 'دورة أحكام النون الساكنة',
            type: 'COURSE',
            status: 'PUBLISHED',
            startsAt: DateTime.now(),
          ),
        ])),
        generalCompetitionsProvider.overrideWith((ref) => Future.value([])),
        teacherAwardsListProvider.overrideWith((ref) => Future.value([
          const TeacherAwardOption(
            id: 'aw1',
            name: 'وسام الإتقان والترتيل',
            description: 'للمتميزين في التجويد',
          ),
        ])),
      ],
    ));
    await tester.pumpAndSettle();

    expect(find.text('الأنشطة والمسابقات والجوائز'), findsOneWidget);
    expect(find.text('دورة أحكام النون الساكنة'), findsOneWidget);
  });

  testWidgets('9. TeacherProfileScreen renders teacher details and password change action', (tester) async {
    tester.view.physicalSize = const Size(1080, 2400);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(() => tester.view.resetPhysicalSize());

    await tester.pumpWidget(createTestWidget(const TeacherProfileScreen()));
    await tester.pumpAndSettle();

    expect(find.text('الملف الشخصي والحساب'), findsOneWidget);
    expect(find.text('أحمد المعلم'), findsWidgets);
    expect(find.text('تغيير كلمة المرور'), findsOneWidget);
  });
}
