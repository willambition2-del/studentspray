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
    ],
  );
});
