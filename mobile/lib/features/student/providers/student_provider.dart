import 'package:flutter_riverpod/flutter_riverpod.dart';
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
  final dashboard = StudentDashboardModel.fromJson(response.data as Map<String, dynamic>);
  sessionCache.setStudentDashboard(dashboard);
  return dashboard;
});

// Educational Plan Provider
final studentPlanProvider = FutureProvider.autoDispose<List<PlanSummaryModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/plan');
  final list = response.data as List;
  return list.map((e) => PlanSummaryModel.fromJson(e as Map<String, dynamic>)).toList();
});

// Attendance Provider
final studentAttendanceProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/attendance');
  return response.data as Map<String, dynamic>;
});

// Memorization Records Provider
final studentMemorizationProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/memorization');
  return response.data as List;
});

// Revision Records Provider
final studentRevisionProvider = FutureProvider.autoDispose<List<dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/revision');
  return response.data as List;
});

// Exams and Results Provider
final studentExamsProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/exams');
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

// Student Periodic Evaluations Provider
final studentEvaluationsProvider = FutureProvider.autoDispose<List<StudentEvaluationModel>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/evaluations');
  final list = response.data as List;
  return list.map((e) => StudentEvaluationModel.fromJson(e as Map<String, dynamic>)).toList();
});

// Student Progress Overview Provider
final studentProgressProvider = FutureProvider.autoDispose<Map<String, dynamic>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student/me/progress');
  return response.data as Map<String, dynamic>;
});
