import { type FormError, type FormKind, networkOrServerError, toFormError } from './errors';
import type { PublicUser } from './types';

/**
 * Browser API client. Same-origin relative `/api` paths only (the Next.js rewrite forwards them); the session
 * cookie travels automatically and is never read by script (architecture §10).
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: FormError };

export type { PublicUser } from './types';

async function readJson(res: Response): Promise<unknown> {
  try {
    return await res.json();
  } catch {
    return undefined; // e.g. the proxy's plain-text 500 when the API is down
  }
}

async function post<T>(
  path: string,
  body: unknown,
  form: FormKind,
  fields: readonly string[],
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  } catch {
    return { ok: false, error: networkOrServerError() };
  }
  const data = await readJson(res);
  if (res.ok) return { ok: true, data: data as T };
  return {
    ok: false,
    error: toFormError(form, res.status, data, res.headers.get('Retry-After'), fields),
  };
}

export const signup = (values: { email: string; name: string; password: string }) =>
  post<{ user: PublicUser }>('/auth/signup', values, 'signup', ['email', 'name', 'password']);

export const signin = (values: { email: string; password: string }) =>
  post<{ user: PublicUser }>('/auth/signin', values, 'signin', ['email', 'password']);

/** Idempotent; resolves even if the request fails, because the cookie is also cleared on expiry. */
export async function logout(): Promise<boolean> {
  try {
    const res = await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    return res.ok;
  } catch {
    return false;
  }
}
