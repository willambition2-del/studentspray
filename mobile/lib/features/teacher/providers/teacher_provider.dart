import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync_service.dart';
import '../../../core/utils/api_parsing.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/teacher_models.dart';

final teacherMobileHomeSnapshotProvider = FutureProvider<TeacherMobileHomeSnapshot>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);

  // Return cached snapshot if present in current session
  if (sessionCache.teacherHomeSnapshot != null) {
    return sessionCache.teacherHomeSnapshot!;
  }

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/teacher/me/mobile-home');
  final snapshot = TeacherMobileHomeSnapshot.fromJson(response.data as Map<String, dynamic>);
  sessionCache.setTeacherHome(snapshot);
  return snapshot;
});

final myHalaqasProvider = FutureProvider<List<HalaqaItem>>((ref) async {
  final snapshot = await ref.watch(teacherMobileHomeSnapshotProvider.future);
  return snapshot.halaqasSummary;
});

final halaqaWorkspaceProvider =
    FutureProvider.autoDispose.family<HalaqaTodayWorkspace, String>((ref, halaqaId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/teacher/me/halaqas/$halaqaId/today');
  return HalaqaTodayWorkspace.fromJson(response.data as Map<String, dynamic>);
});

final teacherDashboardStatsProvider = FutureProvider<TeacherDashboardStats>((ref) async {
  final snapshot = await ref.watch(teacherMobileHomeSnapshotProvider.future);
  final today = snapshot.today;

  return TeacherDashboardStats(
    totalHalaqas: snapshot.totalHalaqas,
    totalStudents: snapshot.totalStudents,
    todayPresent: today.present,
    todayAbsent: today.absent,
    todayMemorization: today.memorizationCount,
    todayRevision: today.revisionCount,
    upcomingExams: snapshot.upcomingExamsCount,
    recordedEvaluations: snapshot.evaluationsCount,
    pendingTasks: snapshot.pendingTasksCount,
    unreadNotifications: 0,
    unreadChat: 0,
    attendanceRate: today.attendanceRate,
  );
});

final teacherStudentsProvider = FutureProvider<List<WorkspaceStudent>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<WorkspaceStudent>>('teacher_students');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/students', queryParameters: {'limit': 100});
  final rawList = ApiParsing.extractList(response.data);

  final List<WorkspaceStudent> allStudents = rawList.map((item) {
    final map = item as Map<String, dynamic>;
    final user = map['user'] as Map<String, dynamic>? ?? {};
    return WorkspaceStudent(
      studentId: ApiParsing.parseString(map['id']) ?? '',
      studentNumber: ApiParsing.parseString(map['studentNumber']),
      displayName: ApiParsing.parseString(user['displayName']) ??
          ApiParsing.parseString(user['username']) ??
          'طالب',
      username: ApiParsing.parseString(user['username']) ?? '',
      phone: ApiParsing.parseString(user['phone']),
    );
  }).toList();

  sessionCache.setFeature<List<WorkspaceStudent>>('teacher_students', allStudents);
  return allStudents;
});

final studentProgressProvider =
    FutureProvider.family<StudentProgressData, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'student_progress_$studentId';
  final cached = sessionCache.getFeature<StudentProgressData>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/students/$studentId/progress');
  final data = StudentProgressData.fromJson(response.data as Map<String, dynamic>);
  sessionCache.setFeature<StudentProgressData>(cacheKey, data);
  return data;
});

final studentFullHistoryProvider =
    FutureProvider.family<Map<String, dynamic>, String>((ref, studentId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'student_history_$studentId';
  final cached = sessionCache.getFeature<Map<String, dynamic>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);

  Map<String, dynamic> progress = {};
  List<dynamic> memorizationList = [];
  List<dynamic> revisionList = [];
  List<dynamic> evaluationsList = [];

  try {
    final res = await apiClient.get('/students/$studentId/progress');
    if (res.data is Map) progress = res.data as Map<String, dynamic>;
  } catch (_) {}

  try {
    final res = await apiClient.get('/memorization', queryParameters: {'studentId': studentId});
    memorizationList = ApiParsing.extractList(res.data);
  } catch (_) {}

  try {
    final res = await apiClient.get('/revision', queryParameters: {'studentId': studentId});
    revisionList = ApiParsing.extractList(res.data);
  } catch (_) {}

  try {
    final res = await apiClient.get('/student-evaluations', queryParameters: {'studentId': studentId});
    evaluationsList = ApiParsing.extractList(res.data);
  } catch (_) {}

  final fullHistory = {
    'progress': progress,
    'memorization': memorizationList,
    'revision': revisionList,
    'evaluations': evaluationsList,
  };
  sessionCache.setFeature<Map<String, dynamic>>(cacheKey, fullHistory);
  return fullHistory;
});

final teacherExamsProvider = FutureProvider<List<TeacherExamItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<TeacherExamItem>>('teacher_exams');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/exams');
  final items = ApiParsing.parseList(response.data, TeacherExamItem.fromJson);
  sessionCache.setFeature<List<TeacherExamItem>>('teacher_exams', items);
  return items;
});

final teacherExamResultsProvider =
    FutureProvider.family<List<TeacherExamResultItem>, String>((ref, examId) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cacheKey = 'teacher_exam_results_$examId';
  final cached = sessionCache.getFeature<List<TeacherExamResultItem>>(cacheKey);
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/exams/$examId/results');
  final items = ApiParsing.parseList(response.data, TeacherExamResultItem.fromJson);
  sessionCache.setFeature<List<TeacherExamResultItem>>(cacheKey, items);
  return items;
});

final teacherEvaluationsProvider = FutureProvider<List<TeacherEvaluationItem>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<TeacherEvaluationItem>>('teacher_evaluations');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/student-evaluations');
  final items = ApiParsing.parseList(response.data, TeacherEvaluationItem.fromJson);
  sessionCache.setFeature<List<TeacherEvaluationItem>>('teacher_evaluations', items);
  return items;
});

final teacherPlansProvider = FutureProvider<List<TeacherEducationalPlan>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<TeacherEducationalPlan>>('teacher_plans');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/educational-plans');
  final items = ApiParsing.parseList(response.data, TeacherEducationalPlan.fromJson);
  sessionCache.setFeature<List<TeacherEducationalPlan>>('teacher_plans', items);
  return items;
});

final teacherAwardsListProvider = FutureProvider<List<TeacherAwardOption>>((ref) async {
  final sessionCache = ref.watch(sessionCacheServiceProvider);
  final cached = sessionCache.getFeature<List<TeacherAwardOption>>('teacher_awards');
  if (cached != null) return cached;

  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/awards');
  final items = ApiParsing.parseList(response.data, TeacherAwardOption.fromJson);
  sessionCache.setFeature<List<TeacherAwardOption>>('teacher_awards', items);
  return items;
});

final pendingMutationsCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.user == null) return 0;
  final syncService = ref.watch(syncServiceProvider);
  return await syncService.getPendingCount(authState.user!.id);
});

final teacherOperationsProvider = Provider((ref) => TeacherOperationsNotifier(ref));

class TeacherOperationsNotifier {
  final Ref _ref;

  TeacherOperationsNotifier(this._ref);

  Future<dynamic> recordAttendance({
    required String halaqaId,
    required String sessionDate,
    required List<Map<String, dynamic>> records,
    String? notes,
  }) async {
    final authState = _ref.read(authProvider);
    final user = authState.user;
    if (user == null) throw Exception('المستخدم غير مسجل الدخول');

    final syncService = _ref.read(syncServiceProvider);

    final payload = {
      'sessionDate': sessionDate,
      'notes': notes,
      'records': records,
    };

    final result = await syncService.executeOrQueue(
      userId: user.id,
      type: MutationType.attendance,
      path: '/halaqas/$halaqaId/attendance/sessions',
      payload: payload,
    );

    final int presentCount = records.where((r) => r['status'] == 'PRESENT').length;
    final int absentCount = records.where((r) => r['status'] == 'ABSENT').length;
    final sessionCache = _ref.read(sessionCacheServiceProvider);
    sessionCache.patchTeacherTodayAttendance(presentDelta: presentCount, absentDelta: absentCount);

    _ref.invalidate(halaqaWorkspaceProvider(halaqaId));
    _ref.invalidate(teacherMobileHomeSnapshotProvider);
    _ref.invalidate(pendingMutationsCountProvider);

    return result;
  }

  Future<dynamic> recordMemorization({
    required String halaqaId,
    required String studentId,
    required String date,
    required int surahNumber,
    required int fromAyah,
    required int toAyah,
    int? pageFrom,
    int? pageTo,
    double evaluationScore = 100,
    String rating = 'EXCELLENT',
    int mistakesCount = 0,
    String? teacherNotes,
  }) async {
    final authState = _ref.read(authProvider);
    final user = authState.user;
    if (user == null) throw Exception('المستخدم غير مسجل الدخول');

    final syncService = _ref.read(syncServiceProvider);

    final payload = {
      'halaqaId': halaqaId,
      'studentId': studentId,
      'date': date,
      'surahNumber': surahNumber,
      'fromAyah': fromAyah,
      'toAyah': toAyah,
      if (pageFrom != null) 'pageFrom': pageFrom,
      if (pageTo != null) 'pageTo': pageTo,
      'evaluationScore': evaluationScore,
      'rating': rating,
      'mistakesCount': mistakesCount,
      if (teacherNotes != null && teacherNotes.isNotEmpty)
        'teacherNotes': teacherNotes,
    };

    final result = await syncService.executeOrQueue(
      userId: user.id,
      type: MutationType.memorization,
      path: '/memorization',
      payload: payload,
    );

    final sessionCache = _ref.read(sessionCacheServiceProvider);
    sessionCache.patchTeacherTodayMemorization(delta: 1);

    _ref.invalidate(halaqaWorkspaceProvider(halaqaId));
    _ref.invalidate(studentProgressProvider(studentId));
    _ref.invalidate(studentFullHistoryProvider(studentId));
    _ref.invalidate(teacherMobileHomeSnapshotProvider);
    _ref.invalidate(pendingMutationsCountProvider);

    return result;
  }

  Future<dynamic> recordRevision({
    required String halaqaId,
    required String studentId,
    required String date,
    int? surahNumber,
    int? fromAyah,
    int? toAyah,
    int? pageFrom,
    int? pageTo,
    int? juzNumber,
    double evaluationScore = 100,
    String rating = 'EXCELLENT',
    int mistakesCount = 0,
    String? teacherNotes,
  }) async {
    final authState = _ref.read(authProvider);
    final user = authState.user;
    if (user == null) throw Exception('المستخدم غير مسجل الدخول');

    final syncService = _ref.read(syncServiceProvider);

    final payload = {
      'halaqaId': halaqaId,
      'studentId': studentId,
      'date': date,
      if (surahNumber != null) 'surahNumber': surahNumber,
      if (fromAyah != null) 'fromAyah': fromAyah,
      if (toAyah != null) 'toAyah': toAyah,
      if (pageFrom != null) 'pageFrom': pageFrom,
      if (pageTo != null) 'pageTo': pageTo,
      if (juzNumber != null) 'juzNumber': juzNumber,
      'evaluationScore': evaluationScore,
      'rating': rating,
      'mistakesCount': mistakesCount,
      if (teacherNotes != null && teacherNotes.isNotEmpty)
        'teacherNotes': teacherNotes,
    };

    final result = await syncService.executeOrQueue(
      userId: user.id,
      type: MutationType.revision,
      path: '/revision',
      payload: payload,
    );

    final sessionCache = _ref.read(sessionCacheServiceProvider);
    sessionCache.patchTeacherTodayRevision(delta: 1);

    _ref.invalidate(halaqaWorkspaceProvider(halaqaId));
    _ref.invalidate(studentProgressProvider(studentId));
    _ref.invalidate(studentFullHistoryProvider(studentId));
    _ref.invalidate(teacherMobileHomeSnapshotProvider);
    _ref.invalidate(pendingMutationsCountProvider);

    return result;
  }

  Future<void> gradeExam({
    required String examId,
    required String studentId,
    required double score,
    required bool isPassed,
    String? notes,
    Map<String, dynamic>? criterionScores,
  }) async {
    final apiClient = _ref.read(apiClientProvider);
    await apiClient.post(
      '/exams/$examId/results',
      data: {
        'studentId': studentId,
        'score': score,
        'isPassed': isPassed,
        if (notes != null && notes.isNotEmpty) 'notes': notes,
        if (criterionScores != null) 'criterionScores': criterionScores,
      },
    );
    _ref.invalidate(teacherExamResultsProvider(examId));
    _ref.invalidate(studentFullHistoryProvider(studentId));
    _ref.invalidate(teacherDashboardStatsProvider);
  }

  Future<void> submitStudentEvaluation({
    required String studentId,
    required String halaqaId,
    required String evaluationDate,
    required double behaviorScore,
    required double discipline,
    required double participation,
    required double overallScore,
    required String rating,
    String? teacherNotes,
    String? actionLabel,
  }) async {
    final apiClient = _ref.read(apiClientProvider);
    await apiClient.post(
      '/student-evaluations',
      data: {
        'studentId': studentId,
        'halaqaId': halaqaId,
        'evaluationDate': evaluationDate,
        'behaviorScore': behaviorScore,
        'discipline': discipline,
        'participation': participation,
        'overallScore': overallScore,
        'rating': rating,
        if (teacherNotes != null && teacherNotes.isNotEmpty)
          'teacherNotes': teacherNotes,
        if (actionLabel != null && actionLabel.isNotEmpty)
          'actionLabel': actionLabel,
      },
    );
    _ref.invalidate(teacherEvaluationsProvider);
    _ref.invalidate(studentFullHistoryProvider(studentId));
    _ref.invalidate(teacherDashboardStatsProvider);
  }

  Future<void> grantAward({
    required String awardId,
    required String studentId,
    required String reason,
  }) async {
    final apiClient = _ref.read(apiClientProvider);
    await apiClient.post(
      '/awards/grant',
      data: {
        'awardId': awardId,
        'studentId': studentId,
        'reason': reason,
      },
    );
    _ref.invalidate(studentFullHistoryProvider(studentId));
    _ref.invalidate(teacherDashboardStatsProvider);
  }

  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    final apiClient = _ref.read(apiClientProvider);
    await apiClient.post(
      '/auth/change-password',
      data: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
    );
  }
}
