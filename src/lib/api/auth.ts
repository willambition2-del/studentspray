import { FORUM_SLUG, request, setAccessToken, ApiError } from './client';
export { ApiError } from './client';

export type WebAccount = {
  id: string;
  username: string;
  displayName: string | null;
  email: string | null;
  phone: string | null;
  mustChangePassword: boolean;
  forum: { id: string; name: string; slug: string };
  branch: { id: string; name: string; code: string } | null;
  roles: Array<{ id: string; name: string; branchId: string | null }>;
  permissions: string[];
};

export async function readMe(): Promise<WebAccount> {
  return request<WebAccount>('/auth/me');
}

export async function loginWeb(identifier: string, password: string): Promise<WebAccount> {
  const session = await request<{ accessToken: string }>('/auth/web/login', {
    method: 'POST',
    body: JSON.stringify({ forumSlug: FORUM_SLUG, identifier, password }),
  });
  setAccessToken(session.accessToken);
  return readMe();
}

export async function restoreWebSession(): Promise<WebAccount | null> {
  try {
    const session = await request<{ accessToken: string }>(
      '/auth/web/refresh',
      { method: 'POST' },
      false
    );
    if (session?.accessToken) {
      setAccessToken(session.accessToken);
      return await readMe();
    }
    setAccessToken(null);
    return null;
  } catch (error) {
    setAccessToken(null);
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
      return null;
    }
    throw error;
  }
}

export async function logoutWeb(): Promise<void> {
  try {
    await request<void>('/auth/web/logout', { method: 'POST' }, false);
  } finally {
    setAccessToken(null);
  }
}
