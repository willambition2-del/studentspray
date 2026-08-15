import type { Request } from 'express';
import type { AuthenticatedUser } from '../../auth/types/authenticated-user';

export type RequestWithId = Request & { requestId: string; user?: AuthenticatedUser };
