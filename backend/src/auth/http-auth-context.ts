import type { RequestWithId } from '../common/types/request-with-id';
import type { AuthContext } from './types/auth-context';

export function authContext(request: RequestWithId): AuthContext {
  return {
    ipAddress: request.ip,
    userAgent: request.header('user-agent') ?? undefined,
    requestId: request.requestId,
  };
}

export function readCookie(request: RequestWithId, name: string): string | undefined {
  const cookies: unknown = request.cookies;
  if (!cookies || typeof cookies !== 'object') return undefined;
  const value = (cookies as Record<string, unknown>)[name];
  return typeof value === 'string' ? value : undefined;
}
