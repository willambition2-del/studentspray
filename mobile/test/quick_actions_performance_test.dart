import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_forum/core/cache/session_cache_service.dart';
import 'package:quran_forum/features/auth/providers/auth_provider.dart';
import 'package:quran_forum/features/teacher/models/teacher_models.dart';
import 'package:quran_forum/features/teacher/providers/teacher_provider.dart';
import 'package:quran_forum/features/parent/providers/parent_provider.dart';
import 'package:quran_forum/features/student/models/student_models.dart';
import 'package:quran_forum/features/student/providers/student_provider.dart';
import 'package:quran_forum/features/supervisor/models/supervisor_models.dart';
import 'package:quran_forum/features/supervisor/providers/supervisor_provider.dart';
import 'package:quran_forum/features/activities_shelf/models/activity_models.dart';
import 'package:quran_forum/features/activities_shelf/providers/activities_shelf_provider.dart';
import 'package:quran_forum/features/administrative/models/administrative_models.dart';
import 'package:quran_forum/features/administrative/providers/administrative_provider.dart';

void main() {
  group('Quick Actions Performance & Zero-Freeze Architecture Tests', () {
    late SessionCacheService sessionCache;

    setUp(() {
      sessionCache = SessionCacheService();
    });

    test('1. Teacher Quick Action features hit Session Cache on second access', () async {
      final container = ProviderContainer(
        overrides: [
          sessionCacheServiceProvider.overrideWithValue(sessionCache),
        ],
      );
      addTearDown(container.dispose);

      // Pre-seed teacher feature cache
      sessionCache.setFeature<List<TeacherExamItem>>('teacher_exams', [
        const TeacherExamItem(
          id: 'exam-1',
          title: 'اختبار تجويد',
          status: 'SCHEDULED',
          maxScore: 100,
          passScore: 60,
        ),
      ]);

      sessionCache.setFeature<List<TeacherEvaluationItem>>('teacher_evaluations', [
        TeacherEvaluationItem(
          id: 'eval-1',
          studentId: 'stu-1',
          studentName: 'أحمد',
          halaqaId: 'hal-1',
          evaluationDate: DateTime.now(),
          rating: 'EXCELLENT',
        ),
      ]);

      sessionCache.setFeature<List<WorkspaceStudent>>('teacher_students', [
        const WorkspaceStudent(
          studentId: 'stu-1',
          displayName: 'أحمد',
          username: 'stu_1',
        ),
      ]);

      // Read providers - Must resolve instantly from session cache with 0 HTTP calls
      final stopwatch = Stopwatch()..start();
      final exams = await container.read(teacherExamsProvider.future);
      final evals = await container.read(teacherEvaluationsProvider.future);
      final students = await container.read(teacherStudentsProvider.future);
      stopwatch.stop();

      expect(exams.length, 1);
      expect(evals.length, 1);
      expect(students.length, 1);
      expect(students.first.displayName, 'أحمد');
      expect(stopwatch.elapsedMilliseconds, lessThan(50)); // Instant memory hit
    });

    test('2. Parent Child Quick Action features hit Session Cache', () async {
      final container = ProviderContainer(
        overrides: [
          sessionCacheServiceProvider.overrideWithValue(sessionCache),
        ],
      );
      addTearDown(container.dispose);

      sessionCache.setFeature<List<PlanSummaryModel>>('child_plan_child-123', [
        PlanSummaryModel(
          id: 'p-1',
          name: 'خطة حفظ جزء عم',
          type: 'MEMORIZATION',
          totalItems: 30,
          completedItems: 15,
          progressPercentage: 50.0,
          items: [],
        ),
      ]);

      final stopwatch = Stopwatch()..start();
      final plans = await container.read(childPlanProvider('child-123').future);
      stopwatch.stop();

      expect(plans.length, 1);
      expect(plans.first.name, 'خطة حفظ جزء عم');
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
    });

    test('3. Student Quick Action features hit Session Cache', () async {
      final container = ProviderContainer(
        overrides: [
          sessionCacheServiceProvider.overrideWithValue(sessionCache),
        ],
      );
      addTearDown(container.dispose);

      sessionCache.setFeature<List<PlanSummaryModel>>('student_plan', [
        PlanSummaryModel(
          id: 'p-2',
          name: 'خطة المراجعة الكبرى',
          type: 'REVISION',
          totalItems: 60,
          completedItems: 30,
          progressPercentage: 50.0,
          items: [],
        ),
      ]);

      final stopwatch = Stopwatch()..start();
      final plans = await container.read(studentPlanProvider.future);
      stopwatch.stop();

      expect(plans.length, 1);
      expect(plans.first.name, 'خطة المراجعة الكبرى');
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
    });

    test('4. Supervisor Quick Action features hit Session Cache', () async {
      final container = ProviderContainer(
        overrides: [
          sessionCacheServiceProvider.overrideWithValue(sessionCache),
        ],
      );
      addTearDown(container.dispose);

      sessionCache.setFeature<List<SupervisorHalaqa>>('supervisor_halaqas', <SupervisorHalaqa>[]);
      sessionCache.setFeature<List<SupervisorTeacher>>('supervisor_teachers', <SupervisorTeacher>[]);

      final stopwatch = Stopwatch()..start();
      final halaqas = await container.read(supervisorHalaqasProvider.future);
      final teachers = await container.read(supervisorTeachersProvider.future);
      stopwatch.stop();

      expect(halaqas, isEmpty);
      expect(teachers, isEmpty);
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
    });

    test('5. General Shelf and Admin Hub Quick Actions hit Session Cache', () async {
      final container = ProviderContainer(
        overrides: [
          sessionCacheServiceProvider.overrideWithValue(sessionCache),
        ],
      );
      addTearDown(container.dispose);

      sessionCache.setFeature<List<ShelfSectionItem>>('shelf_sections', <ShelfSectionItem>[]);
      sessionCache.setFeature<List<AdminTaskModel>>('admin_tasks', <AdminTaskModel>[]);

      final stopwatch = Stopwatch()..start();
      final shelf = await container.read(shelfSectionsProvider.future);
      final tasks = await container.read(myAdminTasksProvider.future);
      stopwatch.stop();

      expect(shelf, isEmpty);
      expect(tasks, isEmpty);
      expect(stopwatch.elapsedMilliseconds, lessThan(50));
    });

    test('6. Logout purges all feature caches across all roles', () {
      sessionCache.setFeature<String>('teacher_exams', 'cached');
      sessionCache.setFeature<String>('child_plan_1', 'cached');
      sessionCache.setFeature<String>('student_plan', 'cached');
      sessionCache.setFeature<String>('supervisor_halaqas', 'cached');

      expect(sessionCache.getFeature<String>('teacher_exams'), isNotNull);

      // Trigger logout / purge
      sessionCache.clearAll();

      expect(sessionCache.getFeature<String>('teacher_exams'), isNull);
      expect(sessionCache.getFeature<String>('child_plan_1'), isNull);
      expect(sessionCache.getFeature<String>('student_plan'), isNull);
      expect(sessionCache.getFeature<String>('supervisor_halaqas'), isNull);
      expect(sessionCache.sessionGeneration, 1);
    });
  });
}
