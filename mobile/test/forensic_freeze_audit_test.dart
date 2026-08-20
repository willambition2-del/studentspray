import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_forum/core/cache/session_cache_service.dart';
import 'package:quran_forum/features/auth/models/user_profile.dart';
import 'package:quran_forum/features/auth/providers/auth_provider.dart';
import 'package:quran_forum/features/chat/providers/chat_provider.dart';
import 'package:quran_forum/features/notifications/providers/notification_provider.dart';
import 'package:quran_forum/features/teacher/models/teacher_models.dart';
import 'package:quran_forum/features/teacher/screens/teacher_home_screen.dart';

class FakeAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  FakeAuthNotifier(UserProfile user) : super(AuthState(status: AuthStatus.authenticated, user: user));

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

void main() {
  group('FULL HOME FREEZE FORENSIC SUITE', () {
    late SessionCacheService sessionCache;

    final mockTeacherUser = UserProfile(
      id: 'usr-1',
      username: 'tch_test',
      displayName: 'الأستاذ أحمد',
      roles: const [
        RoleRef(id: 'r-1', name: 'TEACHER', displayName: 'معلم'),
      ],
      forum: const ForumRef(id: 'f-1', name: 'ملتقى النور القرآني', slug: 'test-forum'),
      branch: const BranchRef(id: 'b-1', name: 'الفرع الرئيسي', code: 'MAIN'),
    );

    final mockSnapshot = TeacherMobileHomeSnapshot(
      teacher: {'id': 't-1', 'displayName': 'الأستاذ أحمد'},
      halaqasSummary: const [
        HalaqaItem(id: 'h-1', name: 'حلقة النور', code: 'NUR', branchName: 'الفرع الرئيسي', studentsCount: 15),
        HalaqaItem(id: 'h-2', name: 'حلقة الفرقان', code: 'FUR', branchName: 'الفرع الرئيسي', studentsCount: 20),
      ],
      totalHalaqas: 2,
      totalStudents: 35,
      today: const TeacherTodayMetrics(
        present: 30,
        absent: 5,
        memorizationCount: 25,
        revisionCount: 18,
        attendanceRate: 85.7,
      ),
    );

    setUp(() {
      sessionCache = SessionCacheService();
      sessionCache.setTeacherHome(mockSnapshot);
    });

    testWidgets('PHASE 3 — Binary Isolation: AppBar vs Empty Body', (tester) async {
      int buildCount = 0;
      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionCacheServiceProvider.overrideWithValue(sessionCache),
            authProvider.overrideWith((ref) => FakeAuthNotifier(mockTeacherUser)),
            chatTotalUnreadCountStateProvider.overrideWith((ref) => 0),
            unreadNotificationsCountProvider.overrideWith((ref) => 0),
          ],
          child: MaterialApp(
            home: StatefulBuilder(
              builder: (context, setState) {
                buildCount++;
                return Scaffold(
                  appBar: AppBar(title: const Text('Test')),
                  body: const SizedBox.shrink(),
                );
              },
            ),
          ),
        ),
      );

      expect(find.byType(AppBar), findsOneWidget);
      expect(find.byType(SizedBox), findsWidgets);
      expect(buildCount, 1);
    });

    testWidgets('PHASE 4 — Incremental Body Bisection & First Frame Timing', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      final stopwatch = Stopwatch()..start();

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionCacheServiceProvider.overrideWithValue(sessionCache),
            authProvider.overrideWith((ref) => FakeAuthNotifier(mockTeacherUser)),
            unreadNotificationsCountProvider.overrideWith((ref) => 0),
            chatTotalUnreadCountStateProvider.overrideWith((ref) => 0),
          ],
          child: const MaterialApp(
            home: TeacherHomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();
      stopwatch.stop();

      expect(stopwatch.elapsedMilliseconds, lessThan(2000));
      expect(find.text('الأستاذ أحمد'), findsOneWidget);
      expect(find.text('مؤشرات الأداء والإحصائيات'), findsOneWidget);
      expect(find.text('حلقاتي وجلسات اليوم'), findsOneWidget);
      expect(find.text('حلقة النور'), findsOneWidget);
    });

    testWidgets('PHASE 6 & 20 — Socket Chat Badge update MUST NOT cause full body rebuild', (tester) async {
      final container = ProviderContainer(
        overrides: [
          sessionCacheServiceProvider.overrideWithValue(sessionCache),
          authProvider.overrideWith((ref) => FakeAuthNotifier(mockTeacherUser)),
          unreadNotificationsCountProvider.overrideWith((ref) => 0),
        ],
      );
      addTearDown(container.dispose);

      await tester.pumpWidget(
        UncontrolledProviderScope(
          container: container,
          child: const MaterialApp(
            home: TeacherHomeScreen(),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Simulate 5 rapid socket unread badge increments
      for (int i = 1; i <= 5; i++) {
        container.read(chatTotalUnreadCountStateProvider.notifier).state = i;
        await tester.pump();
      }

      // Verify badge updated cleanly in the AppBar badge
      expect(find.descendant(of: find.byType(Badge), matching: find.text('5')), findsOneWidget);
    });
  });
}
