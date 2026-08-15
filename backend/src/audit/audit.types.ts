import type { AuthContext } from "../auth/types/auth-context";

export type BusinessAuditInput = AuthContext & {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  metadata?: unknown;
};
