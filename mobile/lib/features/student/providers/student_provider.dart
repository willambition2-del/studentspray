import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/utils/api_parsing.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/student_models.dart';

// Dashboard Provider (Session-cached)
final studentDashboardProvider = FutureProvider<StudentDashboardModel>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  if (sessionCache.studentDashboardSnapshot != null) {
    return sessionCache.studentDashboardSnapshot!;
  }
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/dashboard');
  final dashboard = StudentDashboardModel.fromJson(
    response.data is Map<String, dynamic>
        ? response.data as Map<String, dynamic>
        : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{}),
  );
  sessionCache.setStudentDashboard(dashboard);
  return dashboard;
});

// Educational Plan Provider
final studentPlanProvider = FutureProvider<List<PlanSummaryModel>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<PlanSummaryModel>>('student_plan');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/plan');
  final items = ApiParsing.parseList(response.data, PlanSummaryModel.fromJson);
  sessionCache.setFeature<List<PlanSummaryModel>>('student_plan', items);
  return items;
});

// Educational Plan History / Archive Provider
final studentPlanHistoryProvider = FutureProvider<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/plan-history');
  return ApiParsing.extractList(response.data);
});

// Attendance Provider
final studentAttendanceProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<Map<String, dynamic>>('student_attendance');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/attendance');
  final data = response.data is Map<String, dynamic>
      ? response.data as Map<String, dynamic>
      : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{});
  sessionCache.setFeature<Map<String, dynamic>>('student_attendance', data);
  return data;
});

// Memorization Records Provider
final studentMemorizationProvider = FutureProvider<List<dynamic>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<dynamic>>('student_memorization');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/memorization');
  final data = ApiParsing.extractList(response.data);
  sessionCache.setFeature<List<dynamic>>('student_memorization', data);
  return data;
});

// Revision Records Provider
final studentRevisionProvider = FutureProvider<List<dynamic>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<dynamic>>('student_revision');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/revision');
  final data = ApiParsing.extractList(response.data);
  sessionCache.setFeature<List<dynamic>>('student_revision', data);
  return data;
});

// Exams and Results Provider
final studentExamsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<Map<String, dynamic>>('student_exams');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/exams');
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
  sessionCache.setFeature<Map<String, dynamic>>('student_exams', examsMap);
  return examsMap;
});

// Student Periodic Evaluations Provider
final studentEvaluationsProvider = FutureProvider<List<StudentEvaluationModel>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<StudentEvaluationModel>>('student_evaluations');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/evaluations');
  final items = ApiParsing.parseList(response.data, StudentEvaluationModel.fromJson);
  sessionCache.setFeature<List<StudentEvaluationModel>>('student_evaluations', items);
  return items;
});

// Student Progress Overview Provider
final studentProgressProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<Map<String, dynamic>>('student_progress');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/progress');
  final data = response.data is Map<String, dynamic>
      ? response.data as Map<String, dynamic>
      : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{});
  sessionCache.setFeature<Map<String, dynamic>>('student_progress', data);
  return data;
});

// Student Progress History Provider (Real Chronological Monthly Aggregate)
final studentProgressHistoryProvider = FutureProvider<StudentProgressHistoryModel>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<StudentProgressHistoryModel>('student_progress_history');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/progress-history');
  final map = response.data is Map<String, dynamic>
      ? response.data as Map<String, dynamic>
      : (response.data is Map ? (response.data as Map).cast<String, dynamic>() : <String, dynamic>{});
  final model = StudentProgressHistoryModel.fromJson(map);
  sessionCache.setFeature<StudentProgressHistoryModel>('student_progress_history', model);
  return model;
});
