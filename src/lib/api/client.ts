export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ??
  'http://localhost:4000/api/v1';

export const FORUM_SLUG =
  (import.meta.env.VITE_FORUM_SLUG as string | undefined) ?? 'demo-quran-forum';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly raw?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;
const authListeners = new Set<(isAuthenticated: boolean) => void>();

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  const isAuth = Boolean(token);
  authListeners.forEach((listener) => {
    try {
      listener(isAuth);
    } catch {
      // Ignore listener errors
    }
  });
}

export function subscribeAuth(listener: (isAuthenticated: boolean) => void): () => void {
  authListeners.add(listener);
  return () => authListeners.delete(listener);
}

export function buildQuery(params?: Record<string, string | number | boolean | null | undefined>): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

async function performRefresh(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/web/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) {
        setAccessToken(null);
        return null;
      }

      const data = (await res.json()) as { accessToken?: string };
      if (data?.accessToken) {
        setAccessToken(data.accessToken);
        return data.accessToken;
      }

      setAccessToken(null);
      return null;
    } catch {
      setAccessToken(null);
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function request<T>(path: string, init: RequestInit = {}, allowRefreshRetry = true): Promise<T> {
  const url = path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
  const headers = new Headers(init.headers);

  if (init.body && typeof init.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && allowRefreshRetry && !path.includes('/auth/web/login') && !path.includes('/auth/web/refresh')) {
    const newToken = await performRefresh();
    if (newToken) {
      // Retry once with new token
      return request<T>(path, init, false);
    }
  }

  if (!response.ok) {
    let message = 'تعذر إكمال الطلب';
    let code: string | undefined;
    let rawBody: unknown;

    try {
      const body = (await response.json()) as { message?: string | string[]; code?: string };
      rawBody = body;
      code = body.code;
      if (Array.isArray(body.message)) {
        message = body.message.join(', ');
      } else if (typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      // If not json, keep default message
    }

    if (response.status === 403 && !rawBody) {
      message = 'ليس لديك صلاحية لتنفيذ هذه العملية.';
    }

    throw new ApiError(message, response.status, code, rawBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
