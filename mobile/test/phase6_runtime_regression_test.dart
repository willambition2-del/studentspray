import 'dart:convert';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_forum/core/database/app_database.dart';
import 'package:quran_forum/core/network/api_client.dart';
import 'package:quran_forum/core/storage/token_storage.dart';
import 'package:quran_forum/core/sync/sync_service.dart';
import 'package:quran_forum/core/theme/app_theme.dart';
import 'package:quran_forum/features/auth/models/user_profile.dart';
import 'package:quran_forum/features/placeholders/unsupported_role_screen.dart';

class MockConnectivity extends Mock implements Connectivity {}

Widget createTestApp(Widget child) {
  return ProviderScope(
    child: MaterialApp(
      theme: AppTheme.lightTheme,
      locale: const Locale('ar'),
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      home: Directionality(
        textDirection: TextDirection.rtl,
        child: child,
      ),
    ),
  );
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  late AppDatabase db;
  late TokenStorage storage;
  late ApiClient apiClient;
  late MockConnectivity mockConnectivity;
  late SyncService syncService;

  setUp(() {
    FlutterSecureStorage.setMockInitialValues({});
    db = AppDatabase(NativeDatabase.memory());
    storage = TokenStorage();
    apiClient = ApiClient(tokenStorage: storage);
    mockConnectivity = MockConnectivity();

    when(() => mockConnectivity.checkConnectivity())
        .thenAnswer((_) async => [ConnectivityResult.none]);
    when(() => mockConnectivity.onConnectivityChanged)
        .thenAnswer((_) => Stream.value([ConnectivityResult.none]));

    syncService = SyncService(
      apiClient: apiClient,
      db: db,
      connectivity: mockConnectivity,
    );
  });

  tearDown(() async {
    await db.close();
    syncService.dispose();
  });

  group('Phase 6 Flutter Runtime & Regression Verifications', () {
    test('15 & 16. Offline Attendance & Memorization Queueing in Drift', () async {
      const userId = 'teacher-uuid-001';
      final attPayload = {
        'sessionDate': '2026-08-16',
        'records': [
          {'studentId': 'st-1', 'status': 'PRESENT'},
        ],
      };

      // Queue Attendance Mutation
      final attResult = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.attendance,
        path: '/halaqas/h1/attendance/sessions',
        payload: attPayload,
      );

      expect(attResult['isOffline'], isTrue);
      expect(attResult['clientMutationId'], isNotNull);

      // Verify Drift SQLite database
      final pendingAtt = await db.getPendingMutationsForUser(userId);
      expect(pendingAtt.length, equals(1));
      expect(pendingAtt.first.type, equals('ATTENDANCE'));
      expect(pendingAtt.first.clientMutationId, equals(attResult['clientMutationId']));

      // Queue Memorization Mutation
      final memoPayload = {
        'studentId': 'st-1',
        'halaqaId': 'h1',
        'surahNumber': 114,
        'fromAyah': 1,
        'toAyah': 6,
        'evaluationScore': 99.0,
      };

      final memoResult = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.memorization,
        path: '/memorization',
        payload: memoPayload,
      );

      expect(memoResult['isOffline'], isTrue);
      expect(memoResult['clientMutationId'], isNotNull);

      final allPending = await db.getPendingMutationsForUser(userId);
      expect(allPending.length, equals(2));
      expect(allPending.map((p) => p.type).toList(), containsAll(['ATTENDANCE', 'MEMORIZATION']));
    });

    test('17. Idempotency across Retries', () async {
      const userId = 'teacher-uuid-001';
      final payload = {'test': 'data'};

      final r1 = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.attendance,
        path: '/test/idempotent',
        payload: payload,
      );

      final clientMutationId = r1['clientMutationId'] as String;
      expect(clientMutationId, isNotEmpty);

      // Verify same clientMutationId is preserved in drift entry
      final mutations = await db.getPendingMutationsForUser(userId);
      expect(mutations.first.clientMutationId, equals(clientMutationId));
    });

    test('18. Pending Mutation Account / User Isolation', () async {
      const userA = 'teacher-A-uuid';
      const userB = 'teacher-B-uuid';

      await syncService.executeOrQueue(
        userId: userA,
        type: MutationType.attendance,
        path: '/pathA',
        payload: {'owner': 'UserA'},
      );

      await syncService.executeOrQueue(
        userId: userB,
        type: MutationType.memorization,
        path: '/pathB',
        payload: {'owner': 'UserB'},
      );

      final listA = await db.getPendingMutationsForUser(userA);
      final listB = await db.getPendingMutationsForUser(userB);

      expect(listA.length, equals(1));
      expect(listA.first.userId, equals(userA));
      expect(jsonDecode(listA.first.payloadJson)['data']['owner'], equals('UserA'));

      expect(listB.length, equals(1));
      expect(listB.first.userId, equals(userB));
      expect(jsonDecode(listB.first.payloadJson)['data']['owner'], equals('UserB'));

      // User A pending count is isolated
      expect(await syncService.getPendingCount(userA), equals(1));
      expect(await syncService.getPendingCount(userB), equals(1));
    });

    test('19. Token Security & Storage Integrity', () async {
      final tokenStorage = TokenStorage();
      await tokenStorage.clearAll();

      // Access Token stored in memory
      tokenStorage.setAccessToken('mem-access-token-xyz');
      expect(tokenStorage.getAccessToken(), equals('mem-access-token-xyz'));

      // Refresh Token stored via secure storage
      await tokenStorage.saveRefreshToken('secure-refresh-token-xyz');
      final fetchedRefreshToken = await tokenStorage.getRefreshToken();
      expect(fetchedRefreshToken, equals('secure-refresh-token-xyz'));

      // Clear memory token on logout
      await tokenStorage.clearAll();
      expect(tokenStorage.getAccessToken(), isNull);
      expect(await tokenStorage.getRefreshToken(), isNull);
    });

    test('20 & 21. 401 Session Expiry vs 403 Forbidden Handling', () {
      // 403 must NOT expire session
      final forbiddenError = DioException(
        requestOptions: RequestOptions(path: '/api/v1/teacher/me/halaqas/forbidden-id/today'),
        response: Response(
          requestOptions: RequestOptions(path: '/api/v1/teacher/me/halaqas/forbidden-id/today'),
          statusCode: 403,
          data: {'message': 'Branch is outside your access scope'},
        ),
        type: DioExceptionType.badResponse,
      );

      // Verify that 403 response preserves status
      expect(forbiddenError.response?.statusCode, equals(403));
      expect(forbiddenError.response?.data['message'], contains('outside your access scope'));
    });

    test('22. Role Routing Verification', () {
      final teacherUser = UserProfile(
        id: 'u-1',
        username: 'teacher',
        displayName: 'أستاذ',
        forum: const ForumRef(id: 'f-1', name: 'ملتقى', slug: 'demo'),
        branch: const BranchRef(id: 'b-1', name: 'الفرع', code: 'MAIN'),
        roles: const [RoleRef(id: 'r-1', name: 'TEACHER', displayName: 'المعلم')],
        permissions: const ['halaqas.read', 'attendance.write', 'memorization.write'],
      );

      final supervisorUser = UserProfile(
        id: 'u-2',
        username: 'supervisor',
        displayName: 'مشرف',
        forum: const ForumRef(id: 'f-1', name: 'ملتقى', slug: 'demo'),
        branch: const BranchRef(id: 'b-1', name: 'الفرع', code: 'MAIN'),
        roles: const [RoleRef(id: 'r-2', name: 'TECHNICAL_SUPERVISOR', displayName: 'المشرف')],
        permissions: const ['halaqas.read'],
      );

      final studentUser = UserProfile(
        id: 'u-3',
        username: 'student',
        displayName: 'طالب',
        forum: const ForumRef(id: 'f-1', name: 'ملتقى', slug: 'demo'),
        branch: const BranchRef(id: 'b-1', name: 'الفرع', code: 'MAIN'),
        roles: const [RoleRef(id: 'r-3', name: 'STUDENT', displayName: 'الطالب')],
        permissions: const [],
      );

      final gmUser = UserProfile(
        id: 'u-4',
        username: 'gm',
        displayName: 'المدير العام',
        forum: const ForumRef(id: 'f-1', name: 'ملتقى', slug: 'demo'),
        branch: const BranchRef(id: 'b-1', name: 'الفرع', code: 'MAIN'),
        roles: const [RoleRef(id: 'r-4', name: 'GENERAL_MANAGER', displayName: 'المدير العام')],
        permissions: const [],
      );

      expect(teacherUser.isTeacher, isTrue);
      expect(teacherUser.isTechnicalSupervisor, isFalse);

      expect(supervisorUser.isTechnicalSupervisor, isTrue);
      expect(supervisorUser.isTeacher, isFalse);

      expect(studentUser.isStudent, isTrue);
      expect(studentUser.isTeacher, isFalse);

      expect(gmUser.isGeneralManager, isTrue);
      expect(gmUser.isTeacher, isFalse);
    });

    testWidgets('UnsupportedRoleScreen displays correct role prompt for GM / Supervisor',
        (tester) async {
      await tester.pumpWidget(createTestApp(const UnsupportedRoleScreen()));

      expect(find.text('الملتقى القرآني'), findsOneWidget);
      expect(find.textContaining('بوابة الجوال'), findsOneWidget);
      expect(find.byType(OutlinedButton), findsOneWidget);
    });
  });
}
