import { plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { EnvironmentVariables, type LogLevel, type NodeEnv } from './env.schema.js';

/** Validated API configuration with §7 defaults applied. */
export interface Env {
  NODE_ENV: NodeEnv;
  PORT: number;
  MONGODB_URI: string;
  JWT_SECRET: string;
  JWT_TTL_SECONDS: number;
  WEB_ORIGIN: string;
  COOKIE_SECURE: boolean;
  TRUST_PROXY_HOPS: number;
  THROTTLE_AUTH_LIMIT: number;
  THROTTLE_AUTH_TTL_SECONDS: number;
  LOG_LEVEL: LogLevel;
}

/** Carries failing variable names only. Values are never included (architecture §8, §10). */
export class EnvValidationError extends Error {
  constructor(readonly variables: readonly string[]) {
    super(`Invalid environment variables: ${variables.join(', ')}`);
    this.name = 'EnvValidationError';
  }
}

/** `validate` hook for ConfigModule.forRoot: throws EnvValidationError or returns the typed config. */
export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = plainToInstance(EnvironmentVariables, raw);
  const failing = new Set(
    validateSync(parsed, { skipMissingProperties: false }).map((error) => error.property),
  );

  if (parsed.NODE_ENV === 'production' && parsed.COOKIE_SECURE === false) {
    failing.add('COOKIE_SECURE');
  }

  if (failing.size > 0) {
    throw new EnvValidationError([...failing].sort());
  }

  const isProduction = parsed.NODE_ENV === 'production';
  return {
    NODE_ENV: parsed.NODE_ENV,
    PORT: parsed.PORT ?? 4000,
    MONGODB_URI: parsed.MONGODB_URI,
    JWT_SECRET: parsed.JWT_SECRET,
    JWT_TTL_SECONDS: parsed.JWT_TTL_SECONDS ?? 3600,
    WEB_ORIGIN: parsed.WEB_ORIGIN,
    COOKIE_SECURE: parsed.COOKIE_SECURE ?? isProduction,
    TRUST_PROXY_HOPS: parsed.TRUST_PROXY_HOPS ?? 1,
    THROTTLE_AUTH_LIMIT: parsed.THROTTLE_AUTH_LIMIT ?? 10,
    THROTTLE_AUTH_TTL_SECONDS: parsed.THROTTLE_AUTH_TTL_SECONDS ?? 60,
    LOG_LEVEL: parsed.LOG_LEVEL ?? 'info',
  };
}
