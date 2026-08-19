import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/supervisor_models.dart';

// Dashboard Provider (Session-cached)
final supervisorDashboardProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  if (sessionCache.supervisorDashboardSnapshot != null) {
    return sessionCache.supervisorDashboardSnapshot!;
  }
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/supervisor/me/dashboard');
  final dashboard = response.data as Map<String, dynamic>;
  sessionCache.setSupervisorDashboard(dashboard);
  return dashboard;
});

// Halaqas Provider
final supervisorHalaqasProvider = FutureProvider.autoDispose<List<SupervisorHalaqa>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/supervisor/me/halaqas');
  final list = response.data as List;
  return list.map((item) => SupervisorHalaqa.fromJson(item as Map<String, dynamic>)).toList();
});

// Teachers Provider
final supervisorTeachersProvider = FutureProvider.autoDispose<List<SupervisorTeacher>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/supervisor/me/teachers');
  final list = response.data as List;
  return list.map((item) => SupervisorTeacher.fromJson(item as Map<String, dynamic>)).toList();
});

// Teacher Detail Provider
final supervisorTeacherDetailProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, teacherId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/supervisor/me/teachers/$teacherId');
  return response.data as Map<String, dynamic>;
});

// Visits Provider
final supervisorVisitsProvider =
    FutureProvider.autoDispose.family<List<FieldVisitItem>, String?>((ref, status) async {
  final apiClient = ref.watch(apiClientProvider);
  final query = status != null ? {'status': status} : null;
  final response = await apiClient.get('/supervisor/me/visits', queryParameters: query);
  final items = (response.data as Map<String, dynamic>)['items'] as List;
  return items.map((item) => FieldVisitItem.fromJson(item as Map<String, dynamic>)).toList();
});

// Visit Workspace Provider
final supervisorVisitWorkspaceProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, visitId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/supervisor/me/visits/$visitId/workspace');
  return response.data as Map<String, dynamic>;
});

// Recommendations Provider
final supervisorRecommendationsProvider =
    FutureProvider.autoDispose.family<List<RecommendationModel>, String?>((ref, status) async {
  final apiClient = ref.watch(apiClientProvider);
  final query = status != null ? {'status': status} : null;
  final response = await apiClient.get('/supervisor/me/recommendations', queryParameters: query);
  final items = (response.data as Map<String, dynamic>)['items'] as List;
  return items.map((item) => RecommendationModel.fromJson(item as Map<String, dynamic>)).toList();
});

// Supervisor Controller / Action Notifier
class SupervisorActionsNotifier extends StateNotifier<AsyncValue<void>> {
  final Ref ref;

  SupervisorActionsNotifier(this.ref) : super(const AsyncValue.data(null));

  Future<dynamic> createVisit({
    required String halaqaId,
    required String teacherId,
    String visitType = 'ROUTINE',
    String? scheduledDate,
    String? reason,
    String? generalNotes,
  }) async {
    state = const AsyncValue.loading();
    try {
      final syncService = ref.read(syncServiceProvider);
      final currentUser = ref.read(authProvider).user;
      final userId = currentUser?.id ?? '';

      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.fieldVisitCreate,
        path: '/supervisor/me/visits',
        payload: {
          'halaqaId': halaqaId,
          'teacherId': teacherId,
          'visitType': visitType,
          if (scheduledDate != null) 'scheduledDate': scheduledDate,
          if (reason != null) 'reason': reason,
          if (generalNotes != null) 'generalNotes': generalNotes,
        },
      );

      ref.invalidate(supervisorDashboardProvider);
      ref.invalidate(supervisorVisitsProvider);
      state = const AsyncValue.data(null);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<dynamic> updateVisitStatus({
    required String visitId,
    required String status,
    String? summary,
    String? generalNotes,
  }) async {
    state = const AsyncValue.loading();
    try {
      final syncService = ref.read(syncServiceProvider);
      final currentUser = ref.read(authProvider).user;
      final userId = currentUser?.id ?? '';

      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.fieldVisitStatus,
        path: '/supervisor/me/visits/$visitId/status',
        method: 'PATCH',
        payload: {
          'status': status,
          if (summary != null) 'summary': summary,
          if (generalNotes != null) 'generalNotes': generalNotes,
        },
      );

      ref.invalidate(supervisorDashboardProvider);
      ref.invalidate(supervisorVisitsProvider);
      ref.invalidate(supervisorVisitWorkspaceProvider(visitId));
      state = const AsyncValue.data(null);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<dynamic> saveEvaluationDraft({
    required String visitId,
    String? templateId,
    required List<Map<String, dynamic>> criteria,
    String? strengths,
    String? improvementAreas,
    String? summary,
  }) async {
    state = const AsyncValue.loading();
    try {
      final syncService = ref.read(syncServiceProvider);
      final currentUser = ref.read(authProvider).user;
      final userId = currentUser?.id ?? '';

      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.evaluationDraft,
        path: '/supervisor/me/visits/$visitId/evaluation',
        method: 'PUT',
        payload: {
          if (templateId != null) 'templateId': templateId,
          'status': 'DRAFT',
          'criteria': criteria,
          if (strengths != null) 'strengths': strengths,
          if (improvementAreas != null) 'improvementAreas': improvementAreas,
          if (summary != null) 'summary': summary,
        },
      );

      ref.invalidate(supervisorVisitWorkspaceProvider(visitId));
      state = const AsyncValue.data(null);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<dynamic> submitEvaluation({
    required String visitId,
    String? templateId,
    required List<Map<String, dynamic>> criteria,
    String? strengths,
    String? improvementAreas,
    String? summary,
  }) async {
    state = const AsyncValue.loading();
    try {
      final syncService = ref.read(syncServiceProvider);
      final currentUser = ref.read(authProvider).user;
      final userId = currentUser?.id ?? '';

      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.evaluationSubmit,
        path: '/supervisor/me/visits/$visitId/evaluation/submit',
        payload: {
          if (templateId != null) 'templateId': templateId,
          'status': 'SUBMITTED',
          'criteria': criteria,
          if (strengths != null) 'strengths': strengths,
          if (improvementAreas != null) 'improvementAreas': improvementAreas,
          if (summary != null) 'summary': summary,
        },
      );

      ref.invalidate(supervisorDashboardProvider);
      ref.invalidate(supervisorVisitsProvider);
      ref.invalidate(supervisorVisitWorkspaceProvider(visitId));
      state = const AsyncValue.data(null);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<dynamic> createRecommendation({
    required String visitId,
    required String halaqaId,
    required String teacherId,
    required String title,
    required String description,
    String? domain,
    String priority = 'MEDIUM',
    String? dueDate,
  }) async {
    state = const AsyncValue.loading();
    try {
      final syncService = ref.read(syncServiceProvider);
      final currentUser = ref.read(authProvider).user;
      final userId = currentUser?.id ?? '';

      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.recommendationCreate,
        path: '/supervisor/me/visits/$visitId/recommendations',
        payload: {
          'halaqaId': halaqaId,
          'teacherId': teacherId,
          'title': title,
          'description': description,
          if (domain != null) 'domain': domain,
          'priority': priority,
          if (dueDate != null) 'dueDate': dueDate,
        },
      );

      ref.invalidate(supervisorDashboardProvider);
      ref.invalidate(supervisorRecommendationsProvider);
      ref.invalidate(supervisorVisitWorkspaceProvider(visitId));
      state = const AsyncValue.data(null);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }

  Future<dynamic> addRecommendationFollowUp({
    required String recommendationId,
    required String status,
    required String notes,
  }) async {
    state = const AsyncValue.loading();
    try {
      final syncService = ref.read(syncServiceProvider);
      final currentUser = ref.read(authProvider).user;
      final userId = currentUser?.id ?? '';

      final result = await syncService.executeOrQueue(
        userId: userId,
        type: MutationType.recommendationFollowUp,
        path: '/supervisor/me/recommendations/$recommendationId/follow-ups',
        payload: {
          'status': status,
          'notes': notes,
        },
      );

      ref.invalidate(supervisorDashboardProvider);
      ref.invalidate(supervisorRecommendationsProvider);
      state = const AsyncValue.data(null);
      return result;
    } catch (e, st) {
      state = AsyncValue.error(e, st);
      rethrow;
    }
  }
}

final supervisorActionsProvider =
    StateNotifierProvider<SupervisorActionsNotifier, AsyncValue<void>>((ref) {
  return SupervisorActionsNotifier(ref);
});
