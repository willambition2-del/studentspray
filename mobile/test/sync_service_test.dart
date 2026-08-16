import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/native.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_forum/core/database/app_database.dart';
import 'package:quran_forum/core/network/api_client.dart';
import 'package:quran_forum/core/storage/token_storage.dart';
import 'package:quran_forum/core/sync/sync_service.dart';

class MockConnectivity extends Mock implements Connectivity {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('SyncService & Drift Database Tests', () {
    late AppDatabase db;
    late TokenStorage storage;
    late ApiClient apiClient;
    late MockConnectivity mockConnectivity;
    late SyncService syncService;

    setUp(() {
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

    test('generates unique client mutation UUIDs', () {
      final id1 = syncService.generateMutationId();
      final id2 = syncService.generateMutationId();
      expect(id1, isNotEmpty);
      expect(id2, isNotEmpty);
      expect(id1, isNot(equals(id2)));
    });

    test('queues mutation into Drift when offline or on failure', () async {
      const userId = 'teacher-101';
      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.memorization,
        path: '/memorization',
        payload: {
          'studentId': 'stu-1',
          'surahNumber': 1,
          'fromAyah': 1,
          'toAyah': 7,
          'evaluationScore': 100,
        },
      );

      expect(result['clientMutationId'], isNotNull);
      expect(result['isOffline'], isTrue);

      final count = await db.countPendingMutationsForUser(userId);
      expect(count, equals(1));

      final pending = await db.getPendingMutationsForUser(userId);
      expect(pending.length, equals(1));
      expect(pending.first.userId, equals(userId));
      expect(pending.first.type, equals('MEMORIZATION'));
    });

    test('isolates pending mutations per userId and deletes correctly', () async {
      await syncService.executeOrQueue(
        userId: 'user-A',
        type: MutationType.attendance,
        path: '/halaqas/h1/attendance/sessions',
        payload: {'records': []},
      );

      await syncService.executeOrQueue(
        userId: 'user-B',
        type: MutationType.revision,
        path: '/revision',
        payload: {'studentId': 'stu-2'},
      );

      expect(await db.countPendingMutationsForUser('user-A'), equals(1));
      expect(await db.countPendingMutationsForUser('user-B'), equals(1));

      await db.deleteMutationsForUser('user-A');
      expect(await db.countPendingMutationsForUser('user-A'), equals(0));
      expect(await db.countPendingMutationsForUser('user-B'), equals(1));
    });
  });
}
