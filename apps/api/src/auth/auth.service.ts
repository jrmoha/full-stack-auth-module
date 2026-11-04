import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AppException } from '../common/errors/app.exception.js';
import type { Env } from '../config/index.js';
import type { PublicUser } from '../users/public-user.js';
import type { UserDocument } from '../users/user.schema.js';
import { DuplicateEmailError } from '../users/users.errors.js';
import { UsersService } from '../users/users.service.js';
import type { AuthCookieConfig } from './cookie.js';
import type { SigninDto } from './dto/signin.dto.js';
import type { SignupDto } from './dto/signup.dto.js';
import { PasswordHasher } from './password-hasher.js';

export const EMAIL_TAKEN_MESSAGE = 'An account with this email already exists';
export const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

export interface AuthResult {
  user: PublicUser;
  token: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly hasher: PasswordHasher,
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
    const passwordHash = await this.hasher.hash(dto.password);
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

  /**
   * One generic 401 for unknown email and wrong password, and an argon2 verify in both cases so response
   * time does not reveal which (architecture §10).
   */
  async signin(dto: SigninDto): Promise<AuthResult> {
    const user = await this.users.findByEmailWithHash(dto.email);
    const valid = user
      ? await this.hasher.verify(user.passwordHash, dto.password)
      : await this.hasher.verifyAgainstDummy(dto.password);
    if (!user || !valid) {
      throw new AppException(
        HttpStatus.UNAUTHORIZED,
        'INVALID_CREDENTIALS',
        INVALID_CREDENTIALS_MESSAGE,
      );
    }
    return this.issue(user);
  }

  /** Claims are sub, iat and exp only (architecture §10). Only the public user leaves this service. */
  private async issue(user: UserDocument): Promise<AuthResult> {
    const token = await this.jwt.signAsync({ sub: user.id });
    return { user: this.users.toPublicUser(user), token };
  }
}
