import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { RequestWithId } from '../../common/types/request-with-id';
import { REQUIRED_ROLES_KEY } from '../decorators/require-roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[]>(REQUIRED_ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!required?.length) return true;

    const user = context.switchToHttp().getRequest<RequestWithId>().user;
    const hasRole = user?.roles.some((role) => required.includes(role.name));
    if (!hasRole) throw new ForbiddenException('Insufficient role');
    return true;
  }
}
