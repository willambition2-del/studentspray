import type { ExecutionContext } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import { PermissionGuard } from '../src/auth/guards/permission.guard';
import type { AuthenticatedUser } from '../src/auth/types/authenticated-user';

describe('PermissionGuard', () => {
  const user: AuthenticatedUser = {
    id: 'user', sessionId: 'session', forumId: 'forum', branchId: null, username: 'manager',
    mustChangePassword: false, roles: [], permissions: ['students.read'],
  };

  function context(authenticatedUser: AuthenticatedUser | undefined): ExecutionContext {
    return {
      getHandler: () => function handler() {},
      getClass: () => class TestController {},
      switchToHttp: () => ({ getRequest: () => ({ user: authenticatedUser }) }),
    } as unknown as ExecutionContext;
  }

  it('allows users holding every required permission', () => {
    const reflector = { getAllAndOverride: () => ['students.read'] } as unknown as Reflector;
    expect(new PermissionGuard(reflector).canActivate(context(user))).toBe(true);
  });

  it('denies missing permissions', () => {
    const reflector = { getAllAndOverride: () => ['students.manage'] } as unknown as Reflector;
    expect(() => new PermissionGuard(reflector).canActivate(context(user))).toThrow(ForbiddenException);
  });
});
