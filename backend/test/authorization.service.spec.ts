import { AuthorizationService } from '../src/authorization/authorization.service';
import type { AuthenticatedUser } from '../src/auth/types/authenticated-user';

describe('AuthorizationService', () => {
  const service = new AuthorizationService();
  const user: AuthenticatedUser = {
    id: 'user', sessionId: 'session', forumId: 'forum', branchId: 'branch-a', username: 'teacher',
    mustChangePassword: false,
    roles: [{ id: 'role', name: 'TEACHER', branchId: 'branch-a' }],
    permissions: ['students.read', 'attendance.write'],
  };

  it('requires every declared permission', () => {
    expect(service.hasPermissions(user, ['students.read'])).toBe(true);
    expect(service.hasPermissions(user, ['students.read', 'students.manage'])).toBe(false);
  });

  it('resolves roles and branch restrictions', () => {
    expect(service.hasRole(user, 'TEACHER')).toBe(true);
    expect(service.hasRole(user, 'GENERAL_MANAGER')).toBe(false);
    expect(service.scopedBranches(user)).toEqual(['branch-a']);
  });
});
