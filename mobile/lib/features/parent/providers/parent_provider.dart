import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  final snapshot = ParentMobileHomeSnapshot.fromJson(response.data as Map<String, dynamic>);
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
  final dashboard = StudentDashboardModel.fromJson(response.data as Map<String, dynamic>);
  sessionCache.setChildDashboard(studentId, dashboard);
  return dashboard;
});

// Selected Child Educational Plan Provider
final childPlanProvider =
    FutureProvider.autoDispose.family<List<PlanSummaryModel>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/plan');
  final list = response.data as List;
  return list.map((e) => PlanSummaryModel.fromJson(e as Map<String, dynamic>)).toList();
});

// Selected Child Attendance Provider
final childAttendanceProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/attendance');
  return response.data as Map<String, dynamic>;
});

// Selected Child Memorization Provider
final childMemorizationProvider =
    FutureProvider.autoDispose.family<List<dynamic>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/memorization');
  return response.data as List;
});

// Selected Child Revision Provider
final childRevisionProvider =
    FutureProvider.autoDispose.family<List<dynamic>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/revision');
  return response.data as List;
});

// Selected Child Exams and Results Provider
final childExamsProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/exams');
  final data = response.data as Map<String, dynamic>;
  final upcoming = (data['upcomingExams'] as List? ?? [])
      .map((e) => UpcomingExamModel.fromJson(e as Map<String, dynamic>))
      .toList();
  final results = (data['results'] as List? ?? [])
      .map((r) => ExamResultModel.fromJson(r as Map<String, dynamic>))
      .toList();

  return {
    'upcomingExams': upcoming,
    'results': results,
  };
});

// Selected Child Periodic Evaluations Provider
final childEvaluationsProvider =
    FutureProvider.autoDispose.family<List<StudentEvaluationModel>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/evaluations');
  final list = response.data as List;
  return list.map((e) => StudentEvaluationModel.fromJson(e as Map<String, dynamic>)).toList();
});

// Selected Child Cumulative Progress Provider
final childProgressProvider =
    FutureProvider.autoDispose.family<Map<String, dynamic>, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/progress');
  return response.data as Map<String, dynamic>;
});
