import { getModelToken } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ErrorBody } from '../../src/common/errors/error-codes.js';
import { User } from '../../src/users/user.schema.js';
import { captureLogs, createTestApp, type TestApp } from '../setup/app-factory.js';
import { clearDatabase } from '../setup/cleanup.js';
import { bodyFor, casesFor } from './fixtures.js';

const PASSWORD = 'Zq9-pass!word1';
const signupBody = { email: 'dana@company.com', name: 'Dana Levi', password: PASSWORD };

/** Splits a Set-Cookie header into its attributes, lowercased keys. */
function cookieAttributes(setCookie: string): Record<string, string> {
  const [pair = '', ...attrs] = setCookie.split(';').map((part) => part.trim());
  const [name = '', value = ''] = pair.split('=');
  const out: Record<string, string> = { name, value };
  for (const attr of attrs) {
    const [key = '', val = 'true'] = attr.split('=');
    out[key.toLowerCase()] = val;
  }
  return out;
}

function authCookie(res: request.Response): string {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  const cookie = header?.find((c) => c.startsWith('access_token='));
  if (!cookie) throw new Error('no access_token cookie');
  return cookie;
}

describe('POST /auth/signup (task 1.4)', () => {
  let testApp: TestApp;
  let model: Model<User>;
  const logs = captureLogs();
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp({ logDestination: logs.destination });
    model = testApp.app.get<Model<User>>(getModelToken(User.name));
  });

  afterEach(async () => {
    await clearDatabase(testApp.connection);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('201: sets the cookie and returns only id, email, name, createdAt', async () => {
    const res = await http().post('/auth/signup').send(signupBody);

    expect(res.status).toBe(201);
    expect(Object.keys(res.body as object)).toEqual(['user']);
    const { user } = res.body as { user: Record<string, unknown> };
    expect(Object.keys(user).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
    expect(user).toMatchObject({ email: 'dana@company.com', name: 'Dana Levi' });

    const cookie = cookieAttributes(authCookie(res));
    expect(cookie.value).toMatch(/^[\w-]+\.[\w-]+\.[\w-]+$/);
    expect(cookie).toMatchObject({
      httponly: 'true',
      samesite: 'Lax',
      path: '/',
      'max-age': '3600',
    });
    expect(cookie.secure).toBeUndefined();
    expect(JSON.stringify(res.body)).not.toContain(cookie.value);
  });

  it('the token is HS256 with claims sub, iat and exp only, valid for JWT_TTL_SECONDS', async () => {
    const res = await http().post('/auth/signup').send(signupBody);
    const [header = '', payload = ''] = (cookieAttributes(authCookie(res)).value ?? '').split('.');
    const decode = (part: string) =>
      JSON.parse(Buffer.from(part, 'base64url').toString('utf8')) as Record<string, unknown>;

    expect(decode(header)).toEqual({ alg: 'HS256', typ: 'JWT' });
    const claims = decode(payload);
    expect(Object.keys(claims).sort()).toEqual(['exp', 'iat', 'sub']);
    expect(claims.sub).toBe((res.body as { user: { id: string } }).user.id);
    expect(Number(claims.exp) - Number(claims.iat)).toBe(3600);
  });

  it('stores an argon2id hash, never the password', async () => {
    await http().post('/auth/signup').send(signupBody);

    const stored = await model
      .findOne({ email: 'dana@company.com' })
      .select('+passwordHash')
      .lean();
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(JSON.stringify(stored)).not.toContain(PASSWORD);
  });

  it('409 EMAIL_TAKEN with a field error on email for a duplicate, case-insensitively', async () => {
    await http().post('/auth/signup').send(signupBody);

    const res = await http()
      .post('/auth/signup')
      .send({ ...signupBody, email: '  DANA@Company.com ' });

    expect(res.status).toBe(409);
    expect(res.body).toEqual({
      statusCode: 409,
      code: 'EMAIL_TAKEN',
      message: 'An account with this email already exists',
      requestId: res.headers['x-request-id'],
      fieldErrors: { email: ['An account with this email already exists'] },
    });
    expect(res.headers['set-cookie']).toBeUndefined();
  });

  it('5 parallel signups with one email: exactly one 201, four 409, one document', async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () => http().post('/auth/signup').send(signupBody)),
    );

    const statuses = results.map((res) => res.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(await model.countDocuments({ email: 'dana@company.com' })).toBe(1);
  });

  it('responses and logs never contain the password or the hash', async () => {
    const ok = await http().post('/auth/signup').send(signupBody);
    const dup = await http().post('/auth/signup').send(signupBody);
    const stored = await model.findOne({}).select('+passwordHash').lean();
    const hash = stored?.passwordHash ?? 'missing-hash';

    for (const res of [ok, dup]) {
      const text = JSON.stringify(res.body);
      expect(text).not.toContain(PASSWORD);
      expect(text).not.toContain(hash);
      expect(text).not.toContain('passwordHash');
    }
    const token = cookieAttributes(authCookie(ok)).value ?? 'missing-token';
    expect(logs.text()).toContain('/auth/signup');
    expect(logs.text()).not.toContain(PASSWORD);
    expect(logs.text()).not.toContain(hash);
    expect(logs.text()).not.toContain(token);
  });

  it('a URL-encoded body gives 400', async () => {
    const res = await http()
      .post('/auth/signup')
      .type('form')
      .send(`email=dana%40company.com&name=Dana+Levi&password=${encodeURIComponent(PASSWORD)}`);

    expect(res.status).toBe(400);
    expect((res.body as ErrorBody).code).toBe('VALIDATION_FAILED');
    expect(await model.countDocuments()).toBe(0);
  });

  describe('every signup fixture row over HTTP', () => {
    it.each(casesFor('signup').map((row) => [row.id, row] as const))('%s', async (_id, row) => {
      const res = await http().post('/auth/signup').send(bodyFor(row));

      if (row.valid) {
        expect(res.status).toBe(201);
        if (row.field !== 'password' && 'normalized' in row) {
          expect((res.body as { user: Record<string, unknown> }).user[row.field]).toEqual(
            row.normalized,
          );
        }
      } else {
        const body = res.body as ErrorBody;
        expect(res.status).toBe(400);
        expect(body.code).toBe('VALIDATION_FAILED');
        expect(body.fieldErrors?.[row.field]?.[0]).toBe(row.message);
      }
    });
  });
});

describe('POST /auth/signup with COOKIE_SECURE=true (task 1.4)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ config: { COOKIE_SECURE: 'true' } });
  });

  afterAll(async () => {
    await clearDatabase(testApp.connection);
    await testApp.app.close();
  });

  it('marks the cookie Secure', async () => {
    const res = await request(testApp.app.getHttpServer()).post('/auth/signup').send(signupBody);

    expect(res.status).toBe(201);
    expect(cookieAttributes(authCookie(res)).secure).toBe('true');
  });
});
