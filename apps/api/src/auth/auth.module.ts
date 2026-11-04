import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { Env } from '../config/index.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { PasswordHasher } from './password-hasher.js';

/** HS256 pinned for signing and verifying, 30 s clock tolerance (architecture §10). */
export const JWT_ALGORITHM = 'HS256';
export const JWT_CLOCK_TOLERANCE_SECONDS = 30;

@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        secret: config.get('JWT_SECRET', { infer: true }),
        signOptions: {
          algorithm: JWT_ALGORITHM,
          expiresIn: config.get('JWT_TTL_SECONDS', { infer: true }),
        },
        verifyOptions: {
          algorithms: [JWT_ALGORITHM],
          clockTolerance: JWT_CLOCK_TOLERANCE_SECONDS,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PasswordHasher],
})
export class AuthModule {}
