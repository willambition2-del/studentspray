import { Injectable } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

@Injectable()
export class AuthorizationService {
  hasPermissions(user: AuthenticatedUser, permissions: readonly string[]): boolean {
    return permissions.every((permission) => user.permissions.includes(permission));
  }

  hasRole(user: AuthenticatedUser, roleName: string): boolean {
    return user.roles.some((role) => role.name === roleName);
  }

  scopedBranches(user: AuthenticatedUser): string[] {
    return [...new Set(user.roles.map((role) => role.branchId).filter((id): id is string => Boolean(id)))];
  }
}
