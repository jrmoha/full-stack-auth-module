import { describe, expect, it } from 'vitest';
import { EnvValidationError, validateEnv } from '../src/config/index.js';

const SECRET_32 = 'k'.repeat(32);

const valid = (): Record<string, string> => ({
  NODE_ENV: 'development',
  MONGODB_URI: 'mongodb://localhost:27017/auth_dev',
  JWT_SECRET: SECRET_32,
  WEB_ORIGIN: 'http://localhost:3000',
});

const without = (name: string): Record<string, string> =>
  Object.fromEntries(Object.entries(valid()).filter(([key]) => key !== name));

/** Runs validateEnv and returns the failing variable names, or [] when it passes. */
const failingVariables = (env: Record<string, string>): readonly string[] => {
  try {
    validateEnv(env);
    return [];
  } catch (error) {
    if (error instanceof EnvValidationError) return error.variables;
    throw error;
  }
};

describe('validateEnv (architecture §7)', () => {
  it('accepts the minimal valid environment and applies §7 defaults', () => {
    expect(validateEnv(valid())).toEqual({
      ...valid(),
      PORT: 4000,
      JWT_TTL_SECONDS: 3600,
      COOKIE_SECURE: false,
      TRUST_PROXY_HOPS: 1,
      THROTTLE_AUTH_LIMIT: 10,
      THROTTLE_AUTH_TTL_SECONDS: 60,
      LOG_LEVEL: 'info',
    });
  });

  describe('missing required variables are rejected', () => {
    it.each(['NODE_ENV', 'MONGODB_URI', 'JWT_SECRET', 'WEB_ORIGIN'])('%s', (name) => {
      expect(failingVariables(without(name))).toEqual([name]);
    });

    it('an empty environment names every required variable and nothing else', () => {
      expect(failingVariables({})).toEqual(['JWT_SECRET', 'MONGODB_URI', 'NODE_ENV', 'WEB_ORIGIN']);
    });
  });

  describe('JWT_SECRET length', () => {
    it('rejects 31 characters', () => {
      expect(failingVariables({ ...valid(), JWT_SECRET: 'k'.repeat(31) })).toEqual(['JWT_SECRET']);
    });

    it('rejects the 10-character case from the roadmap', () => {
      expect(failingVariables({ ...valid(), JWT_SECRET: 'k'.repeat(10) })).toEqual(['JWT_SECRET']);
    });

    it('accepts exactly 32 characters', () => {
      expect(failingVariables({ ...valid(), JWT_SECRET: SECRET_32 })).toEqual([]);
    });
  });

  describe('COOKIE_SECURE in production', () => {
    it('rejects COOKIE_SECURE=false when NODE_ENV=production', () => {
      expect(
        failingVariables({ ...valid(), NODE_ENV: 'production', COOKIE_SECURE: 'false' }),
      ).toEqual(['COOKIE_SECURE']);
    });

    it('defaults COOKIE_SECURE to true in production', () => {
      expect(validateEnv({ ...valid(), NODE_ENV: 'production' }).COOKIE_SECURE).toBe(true);
    });
  });

  it('never puts a value in the error message', () => {
    const sentinel = 'Zq9-sentinel-value';
    const attempt = () =>
      validateEnv({
        ...valid(),
        JWT_SECRET: sentinel,
        MONGODB_URI: `${sentinel}://nope`,
        WEB_ORIGIN: sentinel,
      });

    expect(attempt).toThrow(EnvValidationError);
    expect(attempt).toThrow(/^Invalid environment variables: JWT_SECRET, MONGODB_URI, WEB_ORIGIN$/);
    expect(attempt).not.toThrow(new RegExp(sentinel));
  });
});
