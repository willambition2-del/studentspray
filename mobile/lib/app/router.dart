import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/providers/auth_provider.dart';
import '../features/auth/screens/login_screen.dart';
import '../features/auth/screens/splash_screen.dart';
import '../features/placeholders/unsupported_role_screen.dart';
import '../features/teacher/screens/attendance_screen.dart';
import '../features/teacher/screens/halaqa_detail_screen.dart';
import '../features/teacher/screens/halaqas_list_screen.dart';
import '../features/teacher/screens/memorization_screen.dart';
import '../features/teacher/screens/revision_screen.dart';
import '../features/teacher/screens/student_progress_screen.dart';
import '../features/teacher/screens/teacher_home_screen.dart';
import '../features/supervisor/screens/supervisor_home_screen.dart';
import '../features/supervisor/screens/supervisor_halaqas_screen.dart';
import '../features/supervisor/screens/supervisor_teachers_screen.dart';
import '../features/supervisor/screens/supervisor_teacher_detail_screen.dart';
import '../features/supervisor/screens/visits_list_screen.dart';
import '../features/supervisor/screens/create_visit_screen.dart';
import '../features/supervisor/screens/visit_workspace_screen.dart';
import '../features/supervisor/screens/evaluation_screen.dart';
import '../features/supervisor/screens/recommendations_list_screen.dart';
import '../features/supervisor/screens/recommendation_detail_screen.dart';
import '../features/student/screens/student_home_screen.dart';
import '../features/student/screens/student_plan_screen.dart';
import '../features/student/screens/student_attendance_screen.dart';
import '../features/student/screens/student_recitation_screen.dart';
import '../features/student/screens/student_exams_screen.dart';
import '../features/student/screens/student_evaluations_screen.dart';
import '../features/student/screens/student_progress_screen.dart';
import '../features/parent/screens/parent_home_screen.dart';
import '../features/parent/screens/parent_child_plan_screen.dart';
import '../features/parent/screens/parent_child_attendance_screen.dart';
import '../features/parent/screens/parent_child_recitation_screen.dart';
import '../features/parent/screens/parent_child_exams_screen.dart';
import '../features/parent/screens/parent_child_evaluations_screen.dart';
import '../features/parent/screens/parent_child_progress_screen.dart';
import '../features/notifications/screens/notifications_screen.dart';
import '../features/chat/screens/conversations_screen.dart';
import '../features/chat/screens/chat_room_screen.dart';
import '../features/activities_shelf/screens/student_activities_screen.dart';
import '../features/activities_shelf/screens/student_competitions_screen.dart';
import '../features/activities_shelf/screens/student_awards_screen.dart';
import '../features/activities_shelf/screens/general_shelf_screen.dart';
import '../features/activities_shelf/screens/parent_child_activities_awards_screen.dart';
import '../features/administrative/screens/administrative_hub_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) {
      final status = authState.status;
      final isSplash = state.matchedLocation == '/splash';
      final isLogin = state.matchedLocation == '/login';

      if (status == AuthStatus.initial || status == AuthStatus.loading) {
        return isSplash ? null : '/splash';
      }

      if (status == AuthStatus.unauthenticated) {
        return isLogin ? null : '/login';
      }

      if (status == AuthStatus.authenticated) {
        final user = authState.user;
        if (isLogin || isSplash) {
          if (user != null && user.isTeacher) {
            return '/teacher/home';
          } else if (user != null && user.isTechnicalSupervisor) {
            return '/supervisor/home';
          } else if (user != null && user.isStudent) {
            return '/student/home';
          } else if (user != null && user.isParent) {
            return '/parent/home';
          } else {
            return '/unsupported-role';
          }
        }
      }

      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        builder: (context, state) => const SplashScreen(),
      ),
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/unsupported-role',
        builder: (context, state) => const UnsupportedRoleScreen(),
      ),

      // Teacher Routes
      GoRoute(
        path: '/teacher',
        redirect: (_, __) => '/teacher/home',
      ),
      GoRoute(
        path: '/teacher/home',
        builder: (context, state) => const TeacherHomeScreen(),
      ),
      GoRoute(
        path: '/teacher/halaqas',
        builder: (context, state) => const HalaqasListScreen(),
      ),
      GoRoute(
        path: '/teacher/halaqas/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return HalaqaDetailScreen(halaqaId: id);
        },
      ),
      GoRoute(
        path: '/teacher/halaqas/:id/attendance',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return AttendanceScreen(halaqaId: id);
        },
      ),
      GoRoute(
        path: '/teacher/students/:id/memorization',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final halaqaId = state.uri.queryParameters['halaqaId'] ?? '';
          final name = state.uri.queryParameters['name'] ?? 'الطالب';
          return MemorizationScreen(
            studentId: id,
            halaqaId: halaqaId,
            studentName: name,
          );
        },
      ),
      GoRoute(
        path: '/teacher/students/:id/revision',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final halaqaId = state.uri.queryParameters['halaqaId'] ?? '';
          final name = state.uri.queryParameters['name'] ?? 'الطالب';
          return RevisionScreen(
            studentId: id,
            halaqaId: halaqaId,
            studentName: name,
          );
        },
      ),
      GoRoute(
        path: '/teacher/students/:id/progress',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          final name = state.uri.queryParameters['name'] ?? 'الطالب';
          return StudentProgressScreen(
            studentId: id,
            studentName: name,
          );
        },
      ),

      // Technical Supervisor Routes
      GoRoute(
        path: '/supervisor',
        redirect: (_, __) => '/supervisor/home',
      ),
      GoRoute(
        path: '/supervisor/home',
        builder: (context, state) => const SupervisorHomeScreen(),
      ),
      GoRoute(
        path: '/supervisor/halaqas',
        builder: (context, state) => const SupervisorHalaqasScreen(),
      ),
      GoRoute(
        path: '/supervisor/teachers',
        builder: (context, state) => const SupervisorTeachersScreen(),
      ),
      GoRoute(
        path: '/supervisor/teachers/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return SupervisorTeacherDetailScreen(teacherId: id);
        },
      ),
      GoRoute(
        path: '/supervisor/visits',
        builder: (context, state) => const VisitsListScreen(),
      ),
      GoRoute(
        path: '/supervisor/visits/new',
        builder: (context, state) {
          final halaqaId = state.uri.queryParameters['halaqaId'];
          final teacherId = state.uri.queryParameters['teacherId'];
          return CreateVisitScreen(
            initialHalaqaId: halaqaId,
            initialTeacherId: teacherId,
          );
        },
      ),
      GoRoute(
        path: '/supervisor/visits/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return VisitWorkspaceScreen(visitId: id);
        },
      ),
      GoRoute(
        path: '/supervisor/visits/:id/evaluation',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return EvaluationScreen(visitId: id);
        },
      ),
      GoRoute(
        path: '/supervisor/recommendations',
        builder: (context, state) => const RecommendationsListScreen(),
      ),
      GoRoute(
        path: '/supervisor/recommendations/:id',
        builder: (context, state) {
          final id = state.pathParameters['id'] ?? '';
          return RecommendationDetailScreen(recommendationId: id);
        },
      ),

      // Student Routes
      GoRoute(
        path: '/student',
        redirect: (_, __) => '/student/home',
      ),
      GoRoute(
        path: '/student/home',
        builder: (context, state) => const StudentHomeScreen(),
      ),
      GoRoute(
        path: '/student/plan',
        builder: (context, state) => const StudentPlanScreen(),
      ),
      GoRoute(
        path: '/student/attendance',
        builder: (context, state) => const StudentAttendanceScreen(),
      ),
      GoRoute(
        path: '/student/recitation',
        builder: (context, state) => const StudentRecitationScreen(),
      ),
      GoRoute(
        path: '/student/exams',
        builder: (context, state) => const StudentExamsScreen(),
      ),
      GoRoute(
        path: '/student/evaluations',
        builder: (context, state) => const StudentEvaluationsScreen(),
      ),
      GoRoute(
        path: '/student/progress',
        builder: (context, state) => const StudentPortalProgressScreen(),
      ),
      GoRoute(
        path: '/student/activities',
        builder: (context, state) => const StudentActivitiesScreen(),
      ),
      GoRoute(
        path: '/student/competitions',
        builder: (context, state) => const StudentCompetitionsScreen(),
      ),
      GoRoute(
        path: '/student/awards',
        builder: (context, state) => const StudentAwardsScreen(),
      ),

      // Parent Routes
      GoRoute(
        path: '/parent',
        redirect: (_, __) => '/parent/home',
      ),
      GoRoute(
        path: '/parent/home',
        builder: (context, state) => const ParentHomeScreen(),
      ),
      GoRoute(
        path: '/parent/children/:studentId/plan',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          return ParentChildPlanScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: '/parent/children/:studentId/attendance',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          return ParentChildAttendanceScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: '/parent/children/:studentId/recitation',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          return ParentChildRecitationScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: '/parent/children/:studentId/exams',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          return ParentChildExamsScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: '/parent/children/:studentId/evaluations',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          return ParentChildEvaluationsScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: '/parent/children/:studentId/progress',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          return ParentChildProgressScreen(studentId: studentId);
        },
      ),
      GoRoute(
        path: '/parent/children/:studentId/activities-awards',
        builder: (context, state) {
          final studentId = state.pathParameters['studentId'] ?? '';
          final name = state.uri.queryParameters['name'] ?? 'الطالب';
          return ParentChildActivitiesAwardsScreen(studentId: studentId, studentName: name);
        },
      ),

      // Administrative Hub (Teacher & Technical Supervisor)
      GoRoute(
        path: '/admin-hub',
        builder: (context, state) => const AdministrativeHubScreen(),
      ),

      // General Shelf (Shared across Teacher, Supervisor, Student, Parent)
      GoRoute(
        path: '/shelf',
        builder: (context, state) => const GeneralShelfScreen(),
      ),

      // Notifications Route (Shared across Teacher, Supervisor, Student, Parent)
      GoRoute(
        path: '/notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),

      // Chat Routes (Role-scoped Realtime Chat)
      GoRoute(
        path: '/chat',
        builder: (context, state) => const ConversationsScreen(),
      ),
      GoRoute(
        path: '/chat/:id',
        builder: (context, state) {
          final convId = state.pathParameters['id'] ?? '';
          final title = state.uri.queryParameters['title'];
          return ChatRoomScreen(conversationId: convId, title: title);
        },
      ),
    ],
  );
});
