export type AuthenticatedRole = {
  id: string;
  name: string;
  branchId: string | null;
};

export type AuthenticatedUser = {
  id: string;
  sessionId: string;
  forumId: string;
  branchId: string | null;
  username: string;
  mustChangePassword: boolean;
  roles: AuthenticatedRole[];
  permissions: string[];
};
