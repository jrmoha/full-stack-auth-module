import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { Strategy } from 'passport-jwt';
import type { Env } from '../config/index.js';
import type { PublicUser } from '../users/public-user.js';
import { UsersService } from '../users/users.service.js';
import { JWT_ALGORITHM, JWT_CLOCK_TOLERANCE_SECONDS } from './jwt.constants.js';
import { AUTH_COOKIE } from './cookie.js';

interface JwtPayload {
  sub?: unknown;
}

/** The token is read from the httpOnly cookie only; no Authorization header (architecture §10). */
const fromAuthCookie = (req: Request): string | null => {
  const cookies = req.cookies as Record<string, unknown> | undefined;
  const token = cookies?.[AUTH_COOKIE];
  return typeof token === 'string' && token !== '' ? token : null;
};

/**
 * HS256 pinned at the top level (passport-jwt overwrites nested `algorithms`), 30 s clock tolerance, expiry
 * enforced. A token whose user no longer exists is rejected.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService<Env, true>,
    private readonly users: UsersService,
  ) {
    super({
      jwtFromRequest: fromAuthCookie,
      secretOrKey: config.get('JWT_SECRET', { infer: true }),
      algorithms: [JWT_ALGORITHM],
      ignoreExpiration: false,
      // The typings deprecate this for audience/issuer/algorithms (top-level options now), but passport-jwt
      // 4.0.1 still reads it and it is the only way to pass clockTolerance.
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      jsonWebTokenOptions: { clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS },
    });
  }

  async validate(payload: JwtPayload): Promise<PublicUser | false> {
    if (typeof payload.sub !== 'string') return false;
    const user = await this.users.findById(payload.sub);
    return user ? this.users.toPublicUser(user) : false;
  }
}
