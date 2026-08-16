import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../auth/providers/auth_provider.dart';
import '../../student/models/student_models.dart';
import '../models/parent_models.dart';

// Currently Active Selected Child ID
final activeChildIdProvider = StateProvider<String?>((ref) => null);

// List of all children linked to this guardian
final parentChildrenProvider = FutureProvider.autoDispose<List<ParentChildSummary>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children');
  final list = response.data as List;
  final children = list.map((c) => ParentChildSummary.fromJson(c as Map<String, dynamic>)).toList();

  // If no active child selected yet, select the first one automatically
  if (children.isNotEmpty && ref.read(activeChildIdProvider) == null) {
    ref.read(activeChildIdProvider.notifier).state = children.first.id;
  }

  return children;
});

// Selected Child Dashboard Provider (Family by child studentId)
final childDashboardProvider =
    FutureProvider.autoDispose.family<StudentDashboardModel, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/parent/me/children/$studentId/dashboard');
  return StudentDashboardModel.fromJson(response.data as Map<String, dynamic>);
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
