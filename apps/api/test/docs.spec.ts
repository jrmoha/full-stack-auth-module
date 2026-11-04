import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp, type TestApp } from './setup/app-factory.js';

interface OpenApiDoc {
  paths: Record<
    string,
    Record<string, { responses: Record<string, unknown>; security?: unknown[] }>
  >;
  components: {
    securitySchemes?: Record<string, { type: string; in: string; name: string }>;
    schemas: Record<string, unknown>;
  };
}

const HELMET_DEFAULT_SCRIPT_SRC = "script-src 'self'";

describe('API docs at /docs outside production (task 3.1)', () => {
  let testApp: TestApp;
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('serves Swagger UI at /docs', async () => {
    const res = await http().get('/docs').redirects(1);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
  });

  it('documents all four endpoints with request, success and §4 error schemas', async () => {
    const res = await http().get('/docs/json');
    const doc = res.body as OpenApiDoc;

    expect(res.status).toBe(200);
    expect(Object.keys(doc.paths).sort()).toEqual([
      '/auth/logout',
      '/auth/me',
      '/auth/signin',
      '/auth/signup',
    ]);
    expect(Object.keys(doc.paths['/auth/signup']?.post?.responses ?? {}).sort()).toEqual([
      '201',
      '400',
      '409',
      '429',
      '500',
      '503',
    ]);
    expect(Object.keys(doc.paths['/auth/signin']?.post?.responses ?? {}).sort()).toEqual([
      '200',
      '400',
      '401',
      '429',
      '500',
      '503',
    ]);
    expect(Object.keys(doc.paths['/auth/me']?.get?.responses ?? {}).sort()).toEqual([
      '200',
      '401',
      '500',
      '503',
    ]);
    expect(Object.keys(doc.paths['/auth/logout']?.post?.responses ?? {}).sort()).toEqual([
      '204',
      '500',
    ]);
    const signupBody = doc.components.schemas.SignupDto as {
      required?: string[];
      properties: Record<string, { minLength?: number; maxLength?: number }>;
    };
    expect(signupBody.required?.sort()).toEqual(['email', 'name', 'password']);
    expect(signupBody.properties.password).toMatchObject({ minLength: 8, maxLength: 128 });
    expect(Object.keys(doc.components.schemas)).toEqual(
      expect.arrayContaining(['SignupDto', 'SigninDto', 'UserResponseDto', 'ErrorResponseDto']),
    );
  });

  it('describes the session as the access_token cookie, required only on /auth/me', async () => {
    const doc = (await http().get('/docs/json')).body as OpenApiDoc;

    expect(doc.components.securitySchemes?.session).toEqual({
      type: 'apiKey',
      in: 'cookie',
      name: 'access_token',
    });
    expect(doc.paths['/auth/me']?.get?.security).toEqual([{ session: [] }]);
    expect(doc.paths['/auth/signup']?.post?.security).toBeUndefined();
  });

  it('JSON endpoints and /docs keep the same default Helmet CSP (no relaxation)', async () => {
    const api = await http().get('/auth/me');
    const docs = await http().get('/docs').redirects(1);

    expect(api.headers['content-security-policy']).toContain(HELMET_DEFAULT_SCRIPT_SRC);
    expect(docs.headers['content-security-policy']).toBe(api.headers['content-security-policy']);
  });

  it('serves only the JSON document, no YAML copy', async () => {
    expect((await http().get('/docs-yaml')).status).toBe(404);
    expect((await http().get('/docs-json')).status).toBe(404);
  });
});

describe('API docs absent in production (task 3.1)', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp({ config: { NODE_ENV: 'production', COOKIE_SECURE: 'true' } });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it.each(['/docs', '/docs/json', '/docs-json', '/docs-yaml', '/docs/swagger-ui-init.js'])(
    '%s is 404',
    async (path) => {
      const res = await request(testApp.app.getHttpServer()).get(path);

      expect(res.status).toBe(404);
      expect((res.body as { code: string }).code).toBe('NOT_FOUND');
    },
  );
});
