const API_BASE_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:4000/api/v1';
const FORUM_SLUG = (import.meta.env.VITE_FORUM_SLUG as string | undefined) ?? 'demo-quran-forum';

let accessToken: string | null = null;

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

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) { super(message); }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set('Content-Type', 'application/json');
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);
  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers, credentials: 'include' });
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as { message?: string | string[] };
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(message ?? 'تعذر إكمال الطلب', response.status);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function readMe(): Promise<WebAccount> { return request<WebAccount>('/auth/me'); }

export async function loginWeb(identifier: string, password: string): Promise<WebAccount> {
  const session = await request<{ accessToken: string }>('/auth/web/login', {
    method: 'POST', body: JSON.stringify({ forumSlug: FORUM_SLUG, identifier, password }),
  });
  accessToken = session.accessToken;
  return readMe();
}

export async function restoreWebSession(): Promise<WebAccount | null> {
  try {
    const session = await request<{ accessToken: string }>('/auth/web/refresh', { method: 'POST' });
    accessToken = session.accessToken;
    return await readMe();
  } catch (error) {
    accessToken = null;
    if (error instanceof ApiError && (error.status === 401 || error.status === 403)) return null;
    throw error;
  }
}

export async function logoutWeb(): Promise<void> {
  try { await request<void>('/auth/web/logout', { method: 'POST' }); }
  finally { accessToken = null; }
}
