import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { AppException } from '../common/errors/app.exception.js';
import type { Env } from '../config/index.js';
import type { PublicUser } from '../users/public-user.js';
import type { UserDocument } from '../users/user.schema.js';
import { DuplicateEmailError } from '../users/users.errors.js';
import { UsersService } from '../users/users.service.js';
import type { AuthCookieConfig } from './cookie.js';
import type { SignupDto } from './dto/signup.dto.js';

export const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get cookieConfig(): AuthCookieConfig {
    return {
      ttlSeconds: this.config.get('JWT_TTL_SECONDS', { infer: true }),
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
    };
  }

  /** argon2id with library defaults (architecture §10); duplicates come from the unique index (§8). */
  async signup(dto: SignupDto): Promise<AuthResult> {
    const passwordHash = await argon2.hash(dto.password, { type: argon2.argon2id });
    let user: UserDocument;
    try {
      user = await this.users.create({ email: dto.email, name: dto.name, passwordHash });
    } catch (error) {
      if (error instanceof DuplicateEmailError) {
        throw new AppException(HttpStatus.CONFLICT, 'EMAIL_TAKEN', EMAIL_TAKEN_MESSAGE, {
          email: [EMAIL_TAKEN_MESSAGE],
        });
      }
      throw error;
    }
    return this.issue(user);
  }

  /** Claims are sub, iat and exp only (architecture §10). Only the public user leaves this service. */
  private async issue(user: UserDocument): Promise<AuthResult> {
    const token = await this.jwt.signAsync({ sub: user.id });
    return { user: this.users.toPublicUser(user), token };
  }
}
