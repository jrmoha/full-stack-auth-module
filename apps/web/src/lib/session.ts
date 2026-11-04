import 'server-only';
import { cookies, headers } from 'next/headers';
import type { PublicUser } from './types';
import { parseWebEnv } from './env';

const { API_URL } = parseWebEnv(process.env);

/** A hung API must not hang every protected render; an abort renders error.tsx like any network failure. */
const SESSION_TIMEOUT_MS = 5000;

/** Header-safe JWT shape; anything else (including non-ASCII after URL-decoding) is treated as signed out. */
const JWT_SHAPE = /^[\w-]+\.[\w-]+\.[\w-]+$/;

/**
 * Server-side session check for page Server Components (architecture §6). Calls `API_URL/auth/me` with only the
 * `access_token` cookie and the client's forwarded-for header, never cached. Returns the user on 200, null when
 * signed out (no cookie, or 401), and throws on network failure or any other status so `error.tsx` renders.
 */
export async function getSession(): Promise<PublicUser | null> {
  const token = (await cookies()).get('access_token')?.value;
  if (!token || !JWT_SHAPE.test(token)) {
    return null; // nothing the API could accept; saves a call on every anonymous render
  }
  const forwardedFor = (await headers()).get('x-forwarded-for');

  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/me`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(SESSION_TIMEOUT_MS),
      headers: {
        cookie: `access_token=${token}`,
        ...(forwardedFor ? { 'x-forwarded-for': forwardedFor } : {}),
      },
    });
  } catch {
    throw new Error('Session check failed: the API is unreachable.');
  }

  if (res.status === 200) {
    const body = (await res.json()) as { user?: PublicUser };
    if (!body.user) {
      throw new Error('Session check failed: the API returned no user.');
    }
    return body.user;
  }
  await res.body?.cancel();
  if (res.status === 401) {
    return null;
  }
  throw new Error(`Session check failed with status ${String(res.status)}.`);
}
