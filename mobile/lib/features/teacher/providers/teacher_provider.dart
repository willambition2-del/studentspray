import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/sync/sync_service.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/teacher_models.dart';

final myHalaqasProvider = FutureProvider.autoDispose<List<HalaqaItem>>((ref) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/teacher/me/halaqas');
  final list = response.data as List? ?? [];
  return list.map((item) => HalaqaItem.fromJson(item as Map<String, dynamic>)).toList();
});

final halaqaWorkspaceProvider =
    FutureProvider.autoDispose.family<HalaqaTodayWorkspace, String>((ref, halaqaId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/teacher/me/halaqas/$halaqaId/today');
  return HalaqaTodayWorkspace.fromJson(response.data as Map<String, dynamic>);
});

final studentProgressProvider =
    FutureProvider.autoDispose.family<StudentProgressData, String>((ref, studentId) async {
  final apiClient = ref.watch(apiClientProvider);
  final response = await apiClient.get('/students/$studentId/progress');
  return StudentProgressData.fromJson(response.data as Map<String, dynamic>);
});

final pendingMutationsCountProvider = FutureProvider.autoDispose<int>((ref) async {
  final authState = ref.watch(authProvider);
  if (authState.user == null) return 0;
  final syncService = ref.watch(syncServiceProvider);
  return await syncService.getPendingCount(authState.user!.id);
});

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

    _ref.invalidate(halaqaWorkspaceProvider(halaqaId));
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

    _ref.invalidate(halaqaWorkspaceProvider(halaqaId));
    _ref.invalidate(studentProgressProvider(studentId));
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

    _ref.invalidate(halaqaWorkspaceProvider(halaqaId));
    _ref.invalidate(studentProgressProvider(studentId));
    _ref.invalidate(pendingMutationsCountProvider);

    return result;
  }
}

final teacherOperationsProvider = Provider<TeacherOperationsNotifier>((ref) {
  return TeacherOperationsNotifier(ref);
});
