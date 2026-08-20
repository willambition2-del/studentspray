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
  group('HOME BODY TOUCH / SCROLL FORENSIC INVESTIGATION', () {
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

    testWidgets('POINTER TRACE TEST: Body vs AppBar Hit Testing', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

      bool appBarDown = false;
      bool bodyDown = false;
      bool bodyMove = false;
      bool bodyUp = false;

      await tester.pumpWidget(
        ProviderScope(
          overrides: [
            sessionCacheServiceProvider.overrideWithValue(sessionCache),
            authProvider.overrideWith((ref) => FakeAuthNotifier(mockTeacherUser)),
            unreadNotificationsCountProvider.overrideWith((ref) => 0),
            chatTotalUnreadCountStateProvider.overrideWith((ref) => 0),
          ],
          child: MaterialApp(
            home: Scaffold(
              appBar: AppBar(
                title: const Text('لوحة المعلم'),
                actions: [
                  Listener(
                    behavior: HitTestBehavior.translucent,
                    onPointerDown: (_) => appBarDown = true,
                    child: IconButton(
                      icon: const Icon(Icons.person),
                      onPressed: () {},
                    ),
                  ),
                ],
              ),
              body: Listener(
                behavior: HitTestBehavior.translucent,
                onPointerDown: (_) => bodyDown = true,
                onPointerMove: (_) => bodyMove = true,
                onPointerUp: (_) => bodyUp = true,
                child: const TeacherHomeScreen(),
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Tap AppBar Action
      final appBarIcon = find.byIcon(Icons.person).first;
      await tester.tap(appBarIcon);
      await tester.pump();
      expect(appBarDown, isTrue);

      // Perform Drag on Body
      final center = tester.getCenter(find.text('الأستاذ أحمد'));
      final gesture = await tester.startGesture(center);
      expect(bodyDown, isTrue);

      await gesture.moveBy(const Offset(0, -100));
      await tester.pump();
      expect(bodyMove, isTrue);

      await gesture.up();
      await tester.pump();
      expect(bodyUp, isTrue);
    });

    testWidgets('20 SCROLL DRAG TEST: Top-to-Bottom and Bottom-to-Top', (tester) async {
      tester.view.physicalSize = const Size(1080, 2400);
      tester.view.devicePixelRatio = 2.0;
      addTearDown(tester.view.resetPhysicalSize);
      addTearDown(tester.view.resetDevicePixelRatio);

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

      for (int i = 0; i < 20; i++) {
        // Drag up (scroll down)
        await tester.drag(find.byType(CustomScrollView).first, const Offset(0, -200));
        await tester.pump();

        // Drag down (scroll up)
        await tester.drag(find.byType(CustomScrollView).first, const Offset(0, 200));
        await tester.pump();
      }

      expect(find.text('الأستاذ أحمد'), findsOneWidget);
    });
  });
}
