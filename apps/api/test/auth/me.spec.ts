import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ErrorBody } from '../../src/common/errors/error-codes.js';
import type { Env } from '../../src/config/index.js';
import { User } from '../../src/users/user.schema.js';
import { UsersService } from '../../src/users/users.service.js';
import { createTestApp, type TestApp } from '../setup/app-factory.js';
import { clearDatabase } from '../setup/cleanup.js';

const account = { email: 'dana@company.com', name: 'Dana Levi', password: 'Zq9-pass!word1' };
const now = () => Math.floor(Date.now() / 1000);
const b64 = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');

describe('GET /auth/me and the JWT guard (task 1.6)', () => {
  let testApp: TestApp;
  let secret: string;
  let userId: string;
  let cookie: string;
  const http = () => request(testApp.app.getHttpServer());
  const me = (token?: string) => {
    const req = http().get('/auth/me');
    return token === undefined ? req : req.set('Cookie', `access_token=${token}`);
  };
  const expect401 = async (token?: string) => {
    const res = await me(token);
    expect(res.status).toBe(401);
    expect(res.body).toEqual({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
      message: 'Sign in to continue.',
      requestId: res.headers['x-request-id'],
    });
  };

  beforeAll(async () => {
    testApp = await createTestApp();
    secret = testApp.app
      .get<ConfigService<Env, true>>(ConfigService)
      .get('JWT_SECRET', { infer: true });
  });

  beforeEach(async () => {
    const res = await http().post('/auth/signup').send(account).expect(201);
    userId = (res.body as { user: { id: string } }).user.id;
    const setCookie = (res.headers['set-cookie'] as unknown as string[])[0] ?? '';
    cookie = setCookie.split(';')[0]?.split('=')[1] ?? '';
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDatabase(testApp.connection);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('200 { user } with the signup cookie', async () => {
    const res = await me(cookie);

    expect(res.status).toBe(200);
    const { user } = res.body as { user: Record<string, unknown> };
    expect(Object.keys(res.body as object)).toEqual(['user']);
    expect(user).toMatchObject({ id: userId, email: account.email, name: account.name });
    expect(Object.keys(user).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
  });

  it('401 without a cookie', async () => {
    await expect401();
  });

  it('401 for a malformed token', async () => {
    await expect401('not-a-jwt');
  });

  it('401 for a wrong signature', async () => {
    const forged = await new JwtService({ secret: 'x'.repeat(64) }).signAsync({ sub: userId });
    await expect401(forged);
  });

  it('401 for alg: none', async () => {
    await expect401(
      `${b64({ alg: 'none', typ: 'JWT' })}.${b64({ sub: userId, iat: now(), exp: now() + 3600 })}.`,
    );
  });

  it('401 for another algorithm with the right secret (HS256 pinned)', async () => {
    const hs512 = await new JwtService({ secret }).signAsync(
      { sub: userId },
      { algorithm: 'HS512' },
    );
    await expect401(hs512);
  });

  it('401 for a token expired beyond the 30 s tolerance', async () => {
    const expired = await new JwtService({ secret }).signAsync({
      sub: userId,
      iat: now() - 3700,
      exp: now() - 60,
    });
    await expect401(expired);
  });

  it('200 for a token expired within the 30 s tolerance', async () => {
    const justExpired = await new JwtService({ secret }).signAsync({
      sub: userId,
      iat: now() - 3610,
      exp: now() - 10,
    });
    const res = await me(justExpired);
    expect(res.status).toBe(200);
  });

  it('the tolerance is 30 s: expired 25 s ago passes, 35 s ago fails', async () => {
    const jwt = new JwtService({ secret });
    const at = (secondsAgo: number) =>
      jwt.signAsync({ sub: userId, iat: now() - 3600 - secondsAgo, exp: now() - secondsAgo });

    expect((await me(await at(25))).status).toBe(200);
    await expect401(await at(35));
  });

  it('503 SERVICE_UNAVAILABLE, not 401, when the database is unreachable during the check', async () => {
    const users = testApp.app.get(UsersService);
    vi.spyOn(users, 'findById').mockImplementation(() => {
      const error = new Error('connect ECONNREFUSED 127.0.0.1:27017');
      error.name = 'MongoServerSelectionError';
      return Promise.reject(error);
    });

    const res = await me(cookie);

    expect(res.status).toBe(503);
    expect((res.body as ErrorBody).code).toBe('SERVICE_UNAVAILABLE');
  });

  it('401 for a valid token whose user no longer exists', async () => {
    const model = testApp.app.get<Model<User>>(getModelToken(User.name));
    await model.deleteOne({ _id: userId });

    await expect401(cookie);
  });

  it('401 for a token without a usable sub', async () => {
    await expect401(await new JwtService({ secret }).signAsync({ name: 'no-sub' }));
    await expect401(await new JwtService({ secret }).signAsync({ sub: 'not-an-object-id' }));
  });

  it('ignores an Authorization header: the cookie is the only source', async () => {
    const res = await http().get('/auth/me').set('Authorization', `Bearer ${cookie}`);
    expect(res.status).toBe(401);
    expect((res.body as ErrorBody).code).toBe('UNAUTHENTICATED');
  });
});
