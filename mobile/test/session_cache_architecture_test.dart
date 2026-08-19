import 'package:flutter_test/flutter_test.dart';
import 'package:quran_forum/core/cache/session_cache_service.dart';
import 'package:quran_forum/features/parent/models/parent_models.dart';
import 'package:quran_forum/features/student/models/student_models.dart';
import 'package:quran_forum/features/teacher/models/teacher_models.dart';

void main() {
  group('Session Cache Architecture & Isolation Tests', () {
    late SessionCacheService cache;

    setUp(() {
      cache = SessionCacheService();
    });

    test('1. Teacher Snapshot Caching and In-Memory Optimistic Patching', () {
      expect(cache.teacherHomeSnapshot, isNull);

      const snapshot = TeacherMobileHomeSnapshot(
        teacher: {'id': 't-1', 'displayName': 'الأستاذ أحمد'},
        halaqasSummary: [
          HalaqaItem(id: 'h-1', name: 'حلقة النور', code: 'NUR', branchName: 'الرئيسي', studentsCount: 15),
        ],
        totalHalaqas: 1,
        totalStudents: 15,
        today: TeacherTodayMetrics(
          present: 10,
          absent: 2,
          memorizationCount: 8,
          revisionCount: 5,
          attendanceRate: 83.3,
        ),
      );

      cache.setTeacherHome(snapshot);
      expect(cache.teacherHomeSnapshot, isNotNull);
      expect(cache.teacherHomeSnapshot!.totalStudents, 15);
      expect(cache.teacherHomeSnapshot!.today.present, 10);

      // Optimistic Attendance Patch (+2 present, +1 absent)
      cache.patchTeacherTodayAttendance(presentDelta: 2, absentDelta: 1);
      expect(cache.teacherHomeSnapshot!.today.present, 12);
      expect(cache.teacherHomeSnapshot!.today.absent, 3);
      expect(cache.teacherHomeSnapshot!.today.attendanceRate, 80.0);

      // Optimistic Memorization Patch (+1)
      cache.patchTeacherTodayMemorization(delta: 1);
      expect(cache.teacherHomeSnapshot!.today.memorizationCount, 9);

      // Optimistic Revision Patch (+1)
      cache.patchTeacherTodayRevision(delta: 1);
      expect(cache.teacherHomeSnapshot!.today.revisionCount, 6);
    });

    test('2. Parent Snapshot and Child Dashboard Map Caching', () {
      expect(cache.parentHomeSnapshot, isNull);

      final parentSnapshot = ParentMobileHomeSnapshot(
        parent: {'id': 'p-1', 'name': 'ولي الأمر'},
        children: [
          ParentChildSummary(
            id: 'child-1',
            name: 'عبدالله',
            relationship: 'ابن',
            isPrimary: true,
            halaqaName: 'حلقة الفجر',
            teacherName: 'أحمد',
            attendanceRate: 95.0,
          ),
          ParentChildSummary(
            id: 'child-2',
            name: 'فاطمة',
            relationship: 'ابنة',
            isPrimary: false,
            halaqaName: 'حلقة الهدى',
            teacherName: 'خالد',
            attendanceRate: 98.0,
          ),
        ],
        activeChildId: 'child-1',
        activeChildDashboard: StudentDashboardModel.fromJson({
          'student': {'id': 'child-1', 'name': 'عبدالله'},
          'attendance': {'rate': 95.0},
        }),
      );

      cache.setParentHome(parentSnapshot);
      expect(cache.parentHomeSnapshot, isNotNull);
      expect(cache.parentHomeSnapshot!.children.length, 2);

      // Verify active child is pre-cached
      final cachedChild1 = cache.getCachedChildDashboard('child-1');
      expect(cachedChild1, isNotNull);
      expect(cachedChild1!.student.name, 'عبدالله');

      // Verify child 2 is initially not cached until switched
      expect(cache.getCachedChildDashboard('child-2'), isNull);

      // Cache child 2 dashboard on first open
      final child2Dashboard = StudentDashboardModel.fromJson({
        'student': {'id': 'child-2', 'name': 'فاطمة'},
        'attendance': {'rate': 98.0},
      });
      cache.setChildDashboard('child-2', child2Dashboard);

      // Verify second open of child 2 and return to child 1 are both cache hits
      expect(cache.getCachedChildDashboard('child-2'), isNotNull);
      expect(cache.getCachedChildDashboard('child-1'), isNotNull);
    });

    test('3. Logout thoroughly purges all session caches & increments generation', () {
      const teacherSnapshot = TeacherMobileHomeSnapshot(
        teacher: {'id': 't-1'},
        halaqasSummary: [],
        totalHalaqas: 0,
        totalStudents: 0,
        today: TeacherTodayMetrics(),
      );
      cache.setTeacherHome(teacherSnapshot);
      cache.setStudentDashboard(StudentDashboardModel.fromJson({'student': {'id': 's-1'}}));
      cache.setSupervisorDashboard({'metric': 100});

      final initialGen = cache.sessionGeneration;
      expect(cache.teacherHomeSnapshot, isNotNull);
      expect(cache.studentDashboardSnapshot, isNotNull);
      expect(cache.supervisorDashboardSnapshot, isNotNull);

      // Perform logout purge
      cache.clearAll();

      expect(cache.sessionGeneration, initialGen + 1);
      expect(cache.teacherHomeSnapshot, isNull);
      expect(cache.parentHomeSnapshot, isNull);
      expect(cache.studentDashboardSnapshot, isNull);
      expect(cache.supervisorDashboardSnapshot, isNull);
      expect(cache.getCachedChildDashboard('child-1'), isNull);
    });
  });
}
