import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/api_parsing.dart';
import '../../auth/providers/auth_provider.dart';
import '../../student/models/student_models.dart';
import '../models/parent_models.dart';

// Currently Active Selected Child ID
final activeChildIdProvider = StateProvider.autoDispose<String?>((ref) => null);

// Unified Mobile Home for Parent (1 request per session)
final parentMobileHomeProvider = FutureProvider<ParentMobileHomeSnapshot>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);

  if (sessionCache.parentHomeSnapshot != null) {
    return sessionCache.parentHomeSnapshot!;
  }

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/mobile-home');
  final snapshot = ParentMobileHomeSnapshot.fromJson(
    response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{}),
  );
  sessionCache.setParentHome(snapshot);

  if (snapshot.children.isNotEmpty && ref.read(activeChildIdProvider) == null) {
    ref.read(activeChildIdProvider.notifier).state = snapshot.activeChildId ?? snapshot.children.first.id;
  }

  return snapshot;
});

// List of all children linked to this guardian (extracted from snapshot with 0 extra requests)
final parentChildrenProvider = FutureProvider<List<ParentChildSummary>>((ref) async {
  final snapshot = await ref.watch(parentMobileHomeProvider.future);
  return snapshot.children;
});

// Selected Child Dashboard Provider (Family by child studentId with in-memory caching)
final childDashboardProvider =
    FutureProvider.family<StudentDashboardModel, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);

  // Check cached child dashboard in session
  final cached = sessionCache.getCachedChildDashboard(studentId);
  if (cached != null) {
    return cached;
  }

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/dashboard');
  final dashboard = StudentDashboardModel.fromJson(
    response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{}),
  );
  sessionCache.setChildDashboard(studentId, dashboard);
  return dashboard;
});

// Selected Child Educational Plan Provider
final childPlanProvider =
    FutureProvider.family<List<PlanSummaryModel>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_plan_$studentId';
  final cached = sessionCache.getFeature<List<PlanSummaryModel>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/plan');
  final items = ApiParsing.parseList(response.data, PlanSummaryModel.fromJson);
  sessionCache.setFeature<List<PlanSummaryModel>>(cacheKey, items);
  return items;
});

// Selected Child Attendance Provider
final childAttendanceProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_attendance_$studentId';
  final cached = sessionCache.getFeature<Map<String, dynamic>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/attendance');
  final data = response.data is Map<String, dynamic>
      ? response.data as Map<String, dynamic>
      : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{});
  sessionCache.setFeature<Map<String, dynamic>>(cacheKey, data);
  return data;
});

// Selected Child Memorization Provider
final childMemorizationProvider =
    FutureProvider.family<List<dynamic>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_memorization_$studentId';
  final cached = sessionCache.getFeature<List<dynamic>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/memorization');
  final data = ApiParsing.extractList(response.data);
  sessionCache.setFeature<List<dynamic>>(cacheKey, data);
  return data;
});

// Selected Child Revision Provider
final childRevisionProvider =
    FutureProvider.family<List<dynamic>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_revision_$studentId';
  final cached = sessionCache.getFeature<List<dynamic>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/revision');
  final data = ApiParsing.extractList(response.data);
  sessionCache.setFeature<List<dynamic>>(cacheKey, data);
  return data;
});

// Selected Child Exams and Results Provider
final childExamsProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_exams_$studentId';
  final cached = sessionCache.getFeature<Map<String, dynamic>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/exams');
  final data = response.data is Map<String, dynamic>
      ? response.data as Map<String, dynamic>
      : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{});
  final upcoming = ApiParsing.extractList(data['upcomingExams'])
      .map((e) => UpcomingExamModel.fromJson(e as Map<String, dynamic>))
      .toList();
  final results = ApiParsing.extractList(data['results'])
      .map((r) => ExamResultModel.fromJson(r as Map<String, dynamic>))
      .toList();

  final examsMap = {
    'upcomingExams': upcoming,
    'results': results,
  };
  sessionCache.setFeature<Map<String, dynamic>>(cacheKey, examsMap);
  return examsMap;
});

// Selected Child Periodic Evaluations Provider
final childEvaluationsProvider =
    FutureProvider.family<List<StudentEvaluationModel>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_evaluations_$studentId';
  final cached = sessionCache.getFeature<List<StudentEvaluationModel>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/evaluations');
  final items = ApiParsing.parseList(response.data, StudentEvaluationModel.fromJson);
  sessionCache.setFeature<List<StudentEvaluationModel>>(cacheKey, items);
  return items;
});

// Selected Child Cumulative Progress Provider
final childProgressProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'child_progress_$studentId';
  final cached = sessionCache.getFeature<Map<String, dynamic>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/progress');
  final data = response.data is Map<String, dynamic>
      ? response.data as Map<String, dynamic>
      : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{});
  sessionCache.setFeature<Map<String, dynamic>>(cacheKey, data);
  return data;
});
