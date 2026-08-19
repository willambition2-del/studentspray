import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran_forum/app/router.dart';
import 'package:quran_forum/features/auth/models/user_profile.dart';
import 'package:quran_forum/features/auth/providers/auth_provider.dart';
import 'package:quran_forum/features/parent/providers/parent_provider.dart';

void main() {
  group('Role Isolation & Routing Guards Security Tests', () {
    test('Teacher role route guard initializes router for authenticated teacher', () {
      final container = ProviderContainer(
        overrides: [
          authProvider.overrideWith((ref) => MockAuthNotifier(
                AuthState(
                  status: AuthStatus.authenticated,
                  user: const UserProfile(
                    id: 'tch_01',
                    username: 'teacher1',
                    displayName: 'معلم الاختبار',
                    roles: [RoleRef(id: '1', name: 'TEACHER', displayName: 'معلم')],
                  ),
                ),
              )),
        ],
      );

      final router = container.read(routerProvider);
      expect(router, isNotNull);
      container.dispose();
    });

    test('Parent activeChildIdProvider is autoDispose and resets cleanly', () {
      final container = ProviderContainer();

      // Initial value is null
      expect(container.read(activeChildIdProvider), isNull);

      // Set a child ID
      container.read(activeChildIdProvider.notifier).state = 'child_123';
      expect(container.read(activeChildIdProvider), equals('child_123'));

      // Invalidate provider (simulates logout / session transition)
      container.invalidate(activeChildIdProvider);
      expect(container.read(activeChildIdProvider), isNull);

      container.dispose();
    });

    test('UserProfile role resolution is mutually exclusive and accurate', () {
      const teacher = UserProfile(
        id: '1',
        username: 't',
        displayName: 'T',
        roles: [RoleRef(id: '1', name: 'TEACHER', displayName: 'معلم')],
      );
      expect(teacher.isTeacher, isTrue);
      expect(teacher.isParent, isFalse);
      expect(teacher.isStudent, isFalse);
      expect(teacher.isTechnicalSupervisor, isFalse);

      const supervisor = UserProfile(
        id: '2',
        username: 's',
        displayName: 'S',
        roles: [RoleRef(id: '2', name: 'TECHNICAL_SUPERVISOR', displayName: 'مشرف')],
      );
      expect(supervisor.isTechnicalSupervisor, isTrue);
      expect(supervisor.isTeacher, isFalse);
      expect(supervisor.isParent, isFalse);
      expect(supervisor.isStudent, isFalse);

      const student = UserProfile(
        id: '3',
        username: 'st',
        displayName: 'ST',
        roles: [RoleRef(id: '3', name: 'STUDENT', displayName: 'طالب')],
      );
      expect(student.isStudent, isTrue);
      expect(student.isTeacher, isFalse);
      expect(student.isParent, isFalse);
      expect(student.isTechnicalSupervisor, isFalse);

      const parent = UserProfile(
        id: '4',
        username: 'p',
        displayName: 'P',
        roles: [RoleRef(id: '4', name: 'PARENT', displayName: 'ولي أمر')],
      );
      expect(parent.isParent, isTrue);
      expect(parent.isTeacher, isFalse);
      expect(parent.isStudent, isFalse);
      expect(parent.isTechnicalSupervisor, isFalse);
    });
  });
}

class MockAuthNotifier extends StateNotifier<AuthState> implements AuthNotifier {
  MockAuthNotifier(super.state);

  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
