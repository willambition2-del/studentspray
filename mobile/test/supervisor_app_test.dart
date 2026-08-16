import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:drift/native.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:quran_forum/core/database/app_database.dart';
import 'package:quran_forum/core/network/api_client.dart';
import 'package:quran_forum/core/storage/token_storage.dart';
import 'package:quran_forum/core/sync/sync_service.dart';
import 'package:quran_forum/features/auth/models/user_profile.dart';
import 'package:quran_forum/features/supervisor/models/supervisor_models.dart';
import 'package:quran_forum/features/supervisor/screens/supervisor_home_screen.dart';

class MockConnectivity extends Mock implements Connectivity {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('Technical Supervisor Models Tests', () {
    test('deserializes SupervisorDashboardMetrics correctly', () {
      final json = {
        'totalHalaqas': 3,
        'totalTeachers': 4,
        'totalVisitsCompleted': 12,
        'totalVisitsPlanned': 2,
        'totalVisitsInProgress': 1,
        'averageEvaluationScore': 88.5,
        'openRecommendationsCount': 5,
        'overdueRecommendationsCount': 1,
      };

      final metrics = SupervisorDashboardMetrics.fromJson(json);
      expect(metrics.totalHalaqas, 3);
      expect(metrics.totalTeachers, 4);
      expect(metrics.totalVisitsCompleted, 12);
      expect(metrics.averageEvaluationScore, 88.5);
      expect(metrics.overdueRecommendationsCount, 1);
    });

    test('deserializes FieldVisitItem correctly', () {
      final json = {
        'id': 'v-101',
        'visitNumber': 'VIS-2026-0001',
        'visitType': 'ROUTINE',
        'status': 'COMPLETED',
        'teacher': {
          'id': 'tch-1',
          'user': {'displayName': 'الشيخ أحمد'},
        },
        'halaqa': {
          'id': 'hal-1',
          'name': 'حلقة أبي بكر الصديق',
        },
        'evaluation': {
          'percentage': 92.5,
          'level': 'EXCELLENT',
        },
      };

      final visit = FieldVisitItem.fromJson(json);
      expect(visit.id, 'v-101');
      expect(visit.visitNumber, 'VIS-2026-0001');
      expect(visit.teacherName, 'الشيخ أحمد');
      expect(visit.halaqaName, 'حلقة أبي بكر الصديق');
      expect(visit.evaluationScore, 92.5);
      expect(visit.evaluationLevel, 'EXCELLENT');
    });

    test('deserializes EvaluationTemplateModel with weighted axes & criteria', () {
      final json = {
        'id': 'tpl-1',
        'name': 'الاستمارة المعيارية الشاملة',
        'version': 1,
        'axes': [
          {
            'id': 'ax-1',
            'name': 'محور الأداء القرآني',
            'weight': 35.0,
            'order': 1,
            'criteria': [
              {
                'id': 'cr-1',
                'name': 'ضبط أحكام التجويد ومخارج الحروف',
                'type': 'SCALE_5',
                'maxScore': 5.0,
                'order': 1,
              },
            ],
          },
        ],
      };

      final tpl = EvaluationTemplateModel.fromJson(json);
      expect(tpl.id, 'tpl-1');
      expect(tpl.axes.length, 1);
      expect(tpl.axes.first.weight, 35.0);
      expect(tpl.axes.first.criteria.first.maxScore, 5.0);
    });

    test('deserializes RecommendationModel correctly', () {
      final json = {
        'id': 'rec-1',
        'title': 'تكثيف جلسات سرد الربع الأخير',
        'description': 'يوصى بتركيز المراجعة التراكمية في بداية كل جلسة',
        'priority': 'HIGH',
        'status': 'OPEN',
        'isOverdue': true,
        'teacher': {
          'user': {'displayName': 'الشيخ محمد'},
        },
        'halaqa': {
          'name': 'حلقة عثمان بن عفان',
        },
      };

      final rec = RecommendationModel.fromJson(json);
      expect(rec.id, 'rec-1');
      expect(rec.title, 'تكثيف جلسات سرد الربع الأخير');
      expect(rec.priority, 'HIGH');
      expect(rec.isOverdue, true);
    });
  });

  group('Technical Supervisor Offline Sync & Drift Database Tests', () {
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

    test('queues field visit creation offline in Drift DB', () async {
      const userId = 'sup-user-1';
      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.fieldVisitCreate,
        path: '/supervisor/me/visits',
        payload: {
          'halaqaId': 'hal-10',
          'teacherId': 'tch-20',
          'visitType': 'ROUTINE',
        },
      );

      expect(result['isOffline'], isTrue);
      expect(result['clientMutationId'], isNotNull);

      final count = await db.countPendingMutationsForUser(userId);
      expect(count, 1);
    });

    test('queues evaluation draft with PUT method offline', () async {
      const userId = 'sup-user-1';
      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.evaluationDraft,
        path: '/supervisor/me/visits/v-1/evaluation',
        method: 'PUT',
        payload: {
          'status': 'DRAFT',
          'criteria': [
            {'criterionId': 'c-1', 'score': 4.5},
            {'criterionId': 'c-2', 'score': 5.0},
          ],
        },
      );

      expect(result['isOffline'], isTrue);
      final count = await db.countPendingMutationsForUser(userId);
      expect(count, 1);
    });

    test('queues recommendation and follow-up offline', () async {
      const userId = 'sup-user-1';
      await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.recommendationCreate,
        path: '/supervisor/me/visits/v-1/recommendations',
        payload: {'title': 'توصية 1', 'description': 'وصف 1'},
      );

      await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.recommendationFollowUp,
        path: '/supervisor/me/recommendations/rec-1/follow-ups',
        payload: {'status': 'COMPLETED', 'notes': 'تم التحقق من التنفيذ'},
      );

      final count = await db.countPendingMutationsForUser(userId);
      expect(count, 2);
    });
  });

  group('Technical Supervisor Role Detection Tests', () {
    test('identifies TECHNICAL_SUPERVISOR user role correctly', () {
      final user = UserProfile.fromJson({
        'id': 'usr-sup-1',
        'username': 'supervisor_ahmed',
        'displayName': 'الأستاذ أحمد المشرف',
        'roles': [
          {'id': 'r-sup', 'name': 'TECHNICAL_SUPERVISOR', 'displayName': 'مشرف فني تعليمي'}
        ],
      });

      expect(user.isTechnicalSupervisor, isTrue);
      expect(user.isTeacher, isFalse);
      expect(user.primaryRoleTitle, 'مشرف فني تعليمي');
    });
  });
}
