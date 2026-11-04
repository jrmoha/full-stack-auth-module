import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { Env } from '../config/index.js';
import { UsersModule } from '../users/users.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { JWT_ALGORITHM, JWT_CLOCK_TOLERANCE_SECONDS } from './jwt.constants.js';
import { JwtStrategy } from './jwt.strategy.js';
import { PasswordHasher } from './password-hasher.js';

@Module({
  imports: [
    UsersModule,
    PassportModule,
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
  providers: [AuthService, PasswordHasher, JwtStrategy, JwtAuthGuard],
})
export class AuthModule {}
