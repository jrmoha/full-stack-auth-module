import request from 'supertest';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PasswordHasher } from '../../src/auth/password-hasher.js';
import type { ErrorBody } from '../../src/common/errors/error-codes.js';
import { createTestApp, type TestApp } from '../setup/app-factory.js';
import { clearDatabase } from '../setup/cleanup.js';
import { bodyFor, casesFor } from './fixtures.js';

const PASSWORD = 'Zq9-pass!word1';
const account = { email: 'dana@company.com', name: 'Dana Levi', password: PASSWORD };

describe('POST /auth/signin (task 1.5)', () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(async () => {
    await http().post('/auth/signup').send(account).expect(201);
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await clearDatabase(testApp.connection);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('200: sets the cookie and returns only id, email, name, createdAt', async () => {
    const res = await http()
      .post('/auth/signin')
      .send({ email: account.email, password: PASSWORD });

    expect(res.status).toBe(200);
    const { user } = res.body as { user: Record<string, unknown> };
    expect(Object.keys(res.body as object)).toEqual(['user']);
    expect(Object.keys(user).sort()).toEqual(['createdAt', 'email', 'id', 'name']);
    const cookies = res.headers['set-cookie'] as unknown as string[];
    expect(cookies.some((c) => c.startsWith('access_token=') && c.includes('HttpOnly'))).toBe(true);
  });

  it('a mixed-case, padded email signs in', async () => {
    const res = await http()
      .post('/auth/signin')
      .send({ email: '  Dana@COMPANY.com ', password: PASSWORD });

    expect(res.status).toBe(200);
    expect((res.body as { user: { email: string } }).user.email).toBe('dana@company.com');
  });

  it('unknown email and wrong password give identical bodies apart from requestId', async () => {
    const unknown = await http()
      .post('/auth/signin')
      .send({ email: 'nobody@company.com', password: PASSWORD });
    const wrong = await http()
      .post('/auth/signin')
      .send({ email: account.email, password: 'Wrong-pass1!' });

    const strip = (body: unknown) => ({ ...(body as ErrorBody), requestId: undefined });
    expect(unknown.status).toBe(401);
    expect(wrong.status).toBe(401);
    expect(strip(unknown.body)).toEqual(strip(wrong.body));
    expect(strip(unknown.body)).toEqual({
      statusCode: 401,
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password',
      requestId: undefined,
    });
    expect(unknown.headers['set-cookie']).toBeUndefined();
    expect(wrong.headers['set-cookie']).toBeUndefined();
  });

  it('runs one argon2id verify for an unknown email, as for a wrong password (no timing shortcut)', async () => {
    const hasher = testApp.app.get(PasswordHasher);
    const verify = vi.spyOn(hasher, 'verify');

    const unknown = await http()
      .post('/auth/signin')
      .send({ email: 'nobody@company.com', password: PASSWORD });
    expect(unknown.status).toBe(401);
    expect(verify).toHaveBeenCalledTimes(1);
    expect(verify.mock.calls[0]?.[0]).toMatch(/^\$argon2id\$/);

    verify.mockClear();
    const wrong = await http()
      .post('/auth/signin')
      .send({ email: account.email, password: 'Wrong-pass1!' });
    expect(wrong.status).toBe(401);
    expect(verify).toHaveBeenCalledTimes(1);
  });

  it('a malformed stored hash gives the same 401, not a 500', async () => {
    await testApp.connection
      .collection('users')
      .updateOne({ email: account.email }, { $set: { passwordHash: 'not-a-hash' } });

    const res = await http()
      .post('/auth/signin')
      .send({ email: account.email, password: PASSWORD });

    expect(res.status).toBe(401);
    expect((res.body as ErrorBody).code).toBe('INVALID_CREDENTIALS');
  });

  it('the password is never trimmed: padding changes it', async () => {
    const res = await http()
      .post('/auth/signin')
      .send({ email: account.email, password: ` ${PASSWORD}` });

    expect(res.status).toBe(401);
  });

  it('a password registered with spaces signs in only with the same spaces', async () => {
    const padded = { email: 'spaces@company.com', name: 'Space User', password: '  ab1!xy  ' };
    await http().post('/auth/signup').send(padded).expect(201);

    await http()
      .post('/auth/signin')
      .send({ email: padded.email, password: padded.password })
      .expect(200);
    await http().post('/auth/signin').send({ email: padded.email, password: 'ab1!xy' }).expect(401);
  });

  describe('every signin fixture row over HTTP', () => {
    it.each(casesFor('signin').map((row) => [row.id, row] as const))('%s', async (_id, row) => {
      const res = await http().post('/auth/signin').send(bodyFor(row));
      const body = res.body as ErrorBody;

      if (row.valid) {
        // Valid input for an account that does not exist: past validation, the generic 401.
        expect(res.status).toBe(401);
        expect(body.code).toBe('INVALID_CREDENTIALS');
      } else {
        expect(res.status).toBe(400);
        expect(body.code).toBe('VALIDATION_FAILED');
        expect(body.fieldErrors?.[row.field]?.[0]).toBe(row.message);
      }
    });
  });
});
