import 'package:flutter/foundation.dart';
import '../../features/parent/models/parent_models.dart';
import '../../features/student/models/student_models.dart';
import '../../features/teacher/models/teacher_models.dart';

class SessionCacheService {
  int _sessionGeneration = 0;

  TeacherMobileHomeSnapshot? _teacherHomeSnapshot;
  ParentMobileHomeSnapshot? _parentHomeSnapshot;
  StudentDashboardModel? _studentDashboardSnapshot;
  Map<String, dynamic>? _supervisorDashboardSnapshot;

  final Map<String, StudentDashboardModel> _childDashboards = {};
  final Map<String, dynamic> _featureCache = {};

  int get sessionGeneration => _sessionGeneration;

  // --- TEACHER CACHE ---
  TeacherMobileHomeSnapshot? get teacherHomeSnapshot => _teacherHomeSnapshot;

  void setTeacherHome(TeacherMobileHomeSnapshot snapshot) {
    _teacherHomeSnapshot = snapshot;
    debugPrint('[SessionCache] Teacher home snapshot cached (gen: $_sessionGeneration)');
  }

  void patchTeacherTodayAttendance({required int presentDelta, required int absentDelta}) {
    if (_teacherHomeSnapshot == null) return;
    final currentToday = _teacherHomeSnapshot!.today;
    final newPresent = (currentToday.present + presentDelta).clamp(0, 999999);
    final newAbsent = (currentToday.absent + absentDelta).clamp(0, 999999);
    final totalRecorded = newPresent + newAbsent;
    final newRate = totalRecorded > 0
        ? (newPresent / totalRecorded) * 100
        : (_teacherHomeSnapshot!.totalStudents > 0 ? 100.0 : 0.0);

    final updatedToday = currentToday.copyWith(
      present: newPresent,
      absent: newAbsent,
      attendanceRate: newRate,
    );

    _teacherHomeSnapshot = _teacherHomeSnapshot!.copyWith(today: updatedToday);
    debugPrint('[SessionCache] Teacher today attendance patched: present=$newPresent, absent=$newAbsent');
  }

  void patchTeacherTodayMemorization({int delta = 1}) {
    if (_teacherHomeSnapshot == null) return;
    final currentToday = _teacherHomeSnapshot!.today;
    final newCount = (currentToday.memorizationCount + delta).clamp(0, 999999);
    _teacherHomeSnapshot = _teacherHomeSnapshot!.copyWith(
      today: currentToday.copyWith(memorizationCount: newCount),
    );
    debugPrint('[SessionCache] Teacher today memorization count patched: $newCount');
  }

  void patchTeacherTodayRevision({int delta = 1}) {
    if (_teacherHomeSnapshot == null) return;
    final currentToday = _teacherHomeSnapshot!.today;
    final newCount = (currentToday.revisionCount + delta).clamp(0, 999999);
    _teacherHomeSnapshot = _teacherHomeSnapshot!.copyWith(
      today: currentToday.copyWith(revisionCount: newCount),
    );
    debugPrint('[SessionCache] Teacher today revision count patched: $newCount');
  }

  // --- PARENT CACHE ---
  ParentMobileHomeSnapshot? get parentHomeSnapshot => _parentHomeSnapshot;

  void setParentHome(ParentMobileHomeSnapshot snapshot) {
    _parentHomeSnapshot = snapshot;
    if (snapshot.activeChildId != null && snapshot.activeChildDashboard != null) {
      _childDashboards[snapshot.activeChildId!] = snapshot.activeChildDashboard!;
    }
    debugPrint('[SessionCache] Parent home snapshot cached (gen: $_sessionGeneration)');
  }

  StudentDashboardModel? getCachedChildDashboard(String childId) => _childDashboards[childId];

  void setChildDashboard(String childId, StudentDashboardModel dashboard) {
    _childDashboards[childId] = dashboard;
    debugPrint('[SessionCache] Child dashboard cached for $childId');
  }

  // --- STUDENT CACHE ---
  StudentDashboardModel? get studentDashboardSnapshot => _studentDashboardSnapshot;

  void setStudentDashboard(StudentDashboardModel dashboard) {
    _studentDashboardSnapshot = dashboard;
    debugPrint('[SessionCache] Student dashboard snapshot cached');
  }

  // --- SUPERVISOR CACHE ---
  Map<String, dynamic>? get supervisorDashboardSnapshot => _supervisorDashboardSnapshot;

  void setSupervisorDashboard(Map<String, dynamic> dashboard) {
    _supervisorDashboardSnapshot = dashboard;
    debugPrint('[SessionCache] Supervisor dashboard snapshot cached');
  }

  // --- GENERIC FEATURE CACHE ---
  T? getFeature<T>(String key) => _featureCache[key] as T?;

  void setFeature<T>(String key, T data) {
    _featureCache[key] = data;
    debugPrint('[SessionCache] Feature cached: $key');
  }

  // --- SPECIFIC CLEAR METHODS ---
  void clearTeacherHome() => _teacherHomeSnapshot = null;
  void clearParentHome() => _parentHomeSnapshot = null;
  void clearStudentDashboard() => _studentDashboardSnapshot = null;
  void clearSupervisorDashboard() => _supervisorDashboardSnapshot = null;

  // --- PURGE / LOGOUT ---
  void clearAll() {
    _sessionGeneration++;
    _teacherHomeSnapshot = null;
    _parentHomeSnapshot = null;
    _studentDashboardSnapshot = null;
    _supervisorDashboardSnapshot = null;
    _childDashboards.clear();
    _featureCache.clear();
    debugPrint('[SessionCache] All session caches cleared (new gen: $_sessionGeneration)');
  }
}
