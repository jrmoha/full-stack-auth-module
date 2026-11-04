import type { CookieOptions, Response } from 'express';

export const AUTH_COOKIE = 'access_token';

export interface AuthCookieConfig {
  ttlSeconds: number;
  secure: boolean;
}

/** One attribute set for issuing and clearing, so they always match (architecture §10). */
function cookieOptions(config: AuthCookieConfig): CookieOptions {
  return { httpOnly: true, sameSite: 'lax', path: '/', secure: config.secure };
}

/** HttpOnly session cookie; Max-Age equals the token lifetime. The token never goes in a body. */
export function setAuthCookie(res: Response, token: string, config: AuthCookieConfig): void {
  res.cookie(AUTH_COOKIE, token, { ...cookieOptions(config), maxAge: config.ttlSeconds * 1000 });
}

/** Same attributes with Max-Age 0 (architecture §4 logout). */
export function clearAuthCookie(res: Response, config: AuthCookieConfig): void {
  res.cookie(AUTH_COOKIE, '', { ...cookieOptions(config), maxAge: 0 });
}
