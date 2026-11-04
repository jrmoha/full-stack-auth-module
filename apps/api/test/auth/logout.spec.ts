import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from '../setup/app-factory.js';
import { clearDatabase } from '../setup/cleanup.js';

const account = { email: 'dana@company.com', name: 'Dana Levi', password: 'Zq9-pass!word1' };

/** Set-Cookie attributes for access_token, lowercased keys; Expires and Max-Age split out. */
function accessCookie(res: request.Response): Record<string, string> {
  const header = (res.headers['set-cookie'] as unknown as string[] | undefined) ?? [];
  const raw = header.find((c) => c.startsWith('access_token='));
  if (!raw) throw new Error('no access_token Set-Cookie');
  const [pair = '', ...attrs] = raw.split(';').map((part) => part.trim());
  const out: Record<string, string> = { value: pair.slice('access_token='.length) };
  for (const attr of attrs) {
    const [key = '', val = 'true'] = attr.split('=');
    out[key.toLowerCase()] = val;
  }
  return out;
}

const withoutLifetime = (attrs: Record<string, string>) =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !['value', 'max-age', 'expires'].includes(key)),
  );

describe('POST /auth/logout (task 1.7)', () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterEach(async () => {
    await clearDatabase(testApp.connection);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('204 with a clearing cookie whose attributes match the issuing cookie', async () => {
    const signup = await http().post('/auth/signup').send(account).expect(201);
    const issued = accessCookie(signup);

    const res = await http()
      .post('/auth/logout')
      .set('Cookie', `access_token=${issued.value ?? ''}`);

    expect(res.status).toBe(204);
    expect(res.text).toBe('');
    const cleared = accessCookie(res);
    expect(cleared.value).toBe('');
    expect(cleared['max-age']).toBe('0');
    expect(withoutLifetime(cleared)).toEqual(withoutLifetime(issued));
    expect(withoutLifetime(cleared)).toEqual({ path: '/', httponly: 'true', samesite: 'Lax' });
  });

  it('204 and the same clearing cookie without an incoming cookie (anonymous, idempotent)', async () => {
    const first = await http().post('/auth/logout');
    const second = await http().post('/auth/logout');

    for (const res of [first, second]) {
      expect(res.status).toBe(204);
      expect(accessCookie(res)['max-age']).toBe('0');
    }
  });

  it('204 even with an invalid or expired cookie', async () => {
    const res = await http().post('/auth/logout').set('Cookie', 'access_token=not-a-jwt');

    expect(res.status).toBe(204);
    expect(accessCookie(res)['max-age']).toBe('0');
  });

  it('after logout the browser has no cookie, so /auth/me is 401', async () => {
    const agent = request.agent(testApp.app.getHttpServer());
    await agent.post('/auth/signup').send(account).expect(201);
    await agent.get('/auth/me').expect(200);

    await agent.post('/auth/logout').expect(204);

    await agent.get('/auth/me').expect(401);
  });
});

describe('POST /auth/logout with COOKIE_SECURE=true (task 1.7)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ config: { COOKIE_SECURE: 'true' } });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('the clearing cookie is Secure too', async () => {
    const res = await request(testApp.app.getHttpServer()).post('/auth/logout');

    expect(res.status).toBe(204);
    expect(accessCookie(res).secure).toBe('true');
  });
});
