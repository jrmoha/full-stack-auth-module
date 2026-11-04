import { HttpStatus, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AppException } from '../common/errors/app.exception.js';
import { UNAUTHENTICATED_MESSAGE } from '../common/errors/error-codes.js';

/**
 * Token problems (no cookie, malformed, bad signature, wrong alg, expired) and a deleted user arrive as
 * `user === false` and become one 401. A real error from validate() (e.g. Mongo down) is rethrown so the filter
 * maps it (503), instead of looking like a sign-out (architecture §8).
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  override handleRequest<TUser>(err: unknown, user: TUser | false): TUser {
    if (err) {
      throw err instanceof Error ? err : new Error('Authentication failed unexpectedly');
    }
    if (!user) {
      throw new AppException(HttpStatus.UNAUTHORIZED, 'UNAUTHENTICATED', UNAUTHENTICATED_MESSAGE);
    }
    return user;
  }
}
