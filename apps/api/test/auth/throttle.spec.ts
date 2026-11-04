import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import type { ErrorBody } from '../../src/common/errors/error-codes.js';
import { createTestApp, type TestApp } from '../setup/app-factory.js';
import { clearDatabase } from '../setup/cleanup.js';

const LIMIT = 3;
const signin = { email: 'nobody@company.com', password: 'Zq9-pass!word1' };

describe('rate limiting on signup and signin (task 1.8)', () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());
  const fromIp = (path: string, ip: string, body: object) =>
    http().post(path).set('X-Forwarded-For', ip).send(body);

  beforeAll(async () => {
    testApp = await createTestApp({
      config: { THROTTLE_AUTH_LIMIT: String(LIMIT), THROTTLE_AUTH_TTL_SECONDS: '60' },
    });
  });

  afterEach(async () => {
    await clearDatabase(testApp.connection);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('past the limit: 429 RATE_LIMITED with Retry-After, in the §4 shape', async () => {
    for (let i = 0; i < LIMIT; i++) {
      expect((await fromIp('/auth/signin', '203.0.113.10', signin)).status).toBe(401);
    }

    const res = await fromIp('/auth/signin', '203.0.113.10', signin);

    expect(res.status).toBe(429);
    expect(res.body).toEqual({
      statusCode: 429,
      code: 'RATE_LIMITED',
      message: 'Too many attempts. Try again later.',
      requestId: res.headers['x-request-id'],
    });
    const retryAfter = Number(res.headers['retry-after']);
    expect(retryAfter).toBeGreaterThan(0);
    expect(retryAfter).toBeLessThanOrEqual(60);
  });

  it('another forwarded client IP is limited independently', async () => {
    for (let i = 0; i <= LIMIT; i++) {
      await fromIp('/auth/signin', '203.0.113.20', signin);
    }
    expect((await fromIp('/auth/signin', '203.0.113.20', signin)).status).toBe(429);

    expect((await fromIp('/auth/signin', '203.0.113.21', signin)).status).toBe(401);
  });

  it('signup is limited too', async () => {
    const body = (i: number) => ({
      email: `user${String(i)}@company.com`,
      name: 'Test User',
      password: 'Zq9-pass!word1',
    });
    for (let i = 0; i < LIMIT; i++) {
      expect((await fromIp('/auth/signup', '203.0.113.30', body(i))).status).toBe(201);
    }

    const res = await fromIp('/auth/signup', '203.0.113.30', body(99));

    expect(res.status).toBe(429);
    expect((res.body as ErrorBody).code).toBe('RATE_LIMITED');
    expect(res.headers['retry-after']).toBeDefined();
  });

  it('only the trusted hop counts: a spoofed left-most X-Forwarded-For entry does not change the key', async () => {
    // With TRUST_PROXY_HOPS=1 the key is the entry the proxy appended (right-most), not what the client wrote.
    for (let i = 0; i <= LIMIT; i++) {
      await fromIp('/auth/signin', `198.51.100.${String(i)}, 203.0.113.40`, signin);
    }

    expect((await fromIp('/auth/signin', '198.51.100.250, 203.0.113.40', signin)).status).toBe(429);
  });

  it('IPv6 clients are grouped by /64: rotating addresses in one prefix shares a bucket', async () => {
    for (let i = 1; i <= LIMIT; i++) {
      expect((await fromIp('/auth/signin', `2001:db8:1:1::${String(i)}`, signin)).status).toBe(401);
    }

    expect((await fromIp('/auth/signin', '2001:db8:1:1::ffff', signin)).status).toBe(429);
    expect((await fromIp('/auth/signin', '2001:db8:1:2::1', signin)).status).toBe(401);
  });

  it('/auth/me and logout are never throttled', async () => {
    for (let i = 0; i < LIMIT * 3; i++) {
      expect((await http().get('/auth/me').set('X-Forwarded-For', '203.0.113.50')).status).toBe(
        401,
      );
      expect(
        (await http().post('/auth/logout').set('X-Forwarded-For', '203.0.113.50')).status,
      ).toBe(204);
    }
  });
});
