import { Body, Controller, Get, Module, Post, UnauthorizedException } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import request from 'supertest';
import type { ErrorBody } from '../../src/common/errors/error-codes.js';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { captureLogs, createTestApp, type TestApp } from '../setup/app-factory.js';

const COOKIE_VALUE = 'Zq9-cookie-sentinel';
const AUTH_VALUE = 'Bearer Zq9-authorization-sentinel';
const WEB_ORIGIN = 'http://localhost:3000';

class ProbeDto {
  @IsNotEmpty({ message: 'Name is required' })
  name!: string;
}

/** Test-only routes: crashes, a DTO-validated echo, and errors that must map to §4 codes. */
@Controller('__test')
class ProbeController {
  @Get('boom')
  boom(): never {
    throw new Error('internal detail Zq9-stack-sentinel');
  }

  @Post('echo')
  echo(): { ok: true } {
    return { ok: true };
  }

  @Post('validate')
  validate(@Body() body: ProbeDto): { name: string } {
    return { name: body.name };
  }

  @Get('unauthorized')
  unauthorized(): never {
    throw new UnauthorizedException();
  }

  @Get('db-down')
  dbDown(): never {
    const error = new Error('connect ECONNREFUSED 127.0.0.1:27017');
    error.name = 'MongoServerSelectionError';
    throw error;
  }

  @Get('leaky')
  leaky(): never {
    throw new Error(
      'failed for dana.zq9@company.com via mongodb://zq9user:zq9pass@db.internal/auth',
    );
  }
}

@Module({ controllers: [ProbeController] })
class ProbeModule {}

describe('app setup: errors, logging, CORS, body parsing (task 1.1)', () => {
  let testApp: TestApp;
  const logs = captureLogs();
  const http = () => request(testApp.app.getHttpServer());

  beforeAll(async () => {
    testApp = await createTestApp({ imports: [ProbeModule], logDestination: logs.destination });
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it('unknown route: §4 error shape with NOT_FOUND and requestId equal to x-request-id', async () => {
    const res = await http().get('/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      statusCode: 404,
      code: 'NOT_FOUND',
      message: 'Not found.',
      requestId: res.headers['x-request-id'],
    });
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('unexpected error: 500 INTERNAL_ERROR with a generic message and no internal detail', async () => {
    const res = await http().get('/__test/boom');

    expect(res.status).toBe(500);
    expect(res.body).toEqual({
      statusCode: 500,
      code: 'INTERNAL_ERROR',
      message: 'Something went wrong. Try again.',
      requestId: res.headers['x-request-id'],
    });
    expect(JSON.stringify(res.body)).not.toContain('Zq9-stack-sentinel');
    // The detail is logged instead, tagged with the request id.
    expect(logs.text()).toContain('Zq9-stack-sentinel');
  });

  it('logs carry the request id and never the cookie or authorization values sent', async () => {
    const res = await http()
      .get('/does-not-exist?token=Zq9-query-sentinel')
      .set('Cookie', `access_token=${COOKIE_VALUE}`)
      .set('Authorization', AUTH_VALUE);

    const text = logs.text();
    expect(text).toContain(String(res.headers['x-request-id']));
    expect(text).not.toContain(COOKIE_VALUE);
    expect(text).not.toContain('Zq9-authorization-sentinel');
    expect(text).not.toContain('Zq9-query-sentinel');
  });

  it('CORS preflight is allowed for WEB_ORIGIN with credentials', async () => {
    const res = await http()
      .options('/__test/echo')
      .set('Origin', WEB_ORIGIN)
      .set('Access-Control-Request-Method', 'POST');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(WEB_ORIGIN);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('CORS preflight from another origin gets no allow-origin header', async () => {
    const res = await http()
      .options('/__test/echo')
      .set('Origin', 'http://evil.example')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });

  it('invalid JSON gives 400 VALIDATION_FAILED with a request id, though it fails before routing', async () => {
    const res = await http()
      .post('/__test/echo')
      .set('Content-Type', 'application/json')
      .send('{"a":');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ statusCode: 400, code: 'VALIDATION_FAILED' });
    expect(res.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
    expect((res.body as ErrorBody).requestId).toBe(res.headers['x-request-id']);
  });

  it('an unsupported charset (415) keeps its status with VALIDATION_FAILED, not a 500', async () => {
    const res = await http()
      .post('/__test/echo')
      .set('Content-Type', 'application/json; charset=foo')
      .send('{}');

    expect(res.status).toBe(415);
    expect(res.body).toMatchObject({ statusCode: 415, code: 'VALIDATION_FAILED' });
    expect((res.body as ErrorBody).requestId).toBe(res.headers['x-request-id']);
  });

  it('a URL-encoded body is not parsed, so the DTO rejects it', async () => {
    const res = await http()
      .post('/__test/validate')
      .set('Content-Type', 'application/x-www-form-urlencoded')
      .send('name=Dana');

    expect(res.status).toBe(400);
    expect(res.body).toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('validation errors list §4 messages per field, and unknown fields as "Field is not allowed"', async () => {
    const res = await http().post('/__test/validate').send({ role: 'admin' });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({
      statusCode: 400,
      code: 'VALIDATION_FAILED',
      message: 'Some fields are invalid.',
      requestId: res.headers['x-request-id'],
      fieldErrors: { name: ['Name is required'], role: ['Field is not allowed'] },
    });
  });

  it('a 401 HttpException maps to UNAUTHENTICATED', async () => {
    const res = await http().get('/__test/unauthorized');

    expect(res.status).toBe(401);
    expect(res.body).toMatchObject({ statusCode: 401, code: 'UNAUTHENTICATED' });
  });

  it('a Mongo server-selection error at runtime maps to 503 SERVICE_UNAVAILABLE', async () => {
    const res = await http().get('/__test/db-down');

    expect(res.status).toBe(503);
    expect(res.body).toMatchObject({ statusCode: 503, code: 'SERVICE_UNAVAILABLE' });
  });

  it('error logs scrub connection-string credentials and email addresses', async () => {
    await http().get('/__test/leaky');

    const text = logs.text();
    expect(text).toContain('[email]');
    expect(text).not.toContain('dana.zq9@company.com');
    expect(text).not.toContain('zq9pass');
  });

  it('a JSON body over 10 KB is refused', async () => {
    const res = await http()
      .post('/__test/echo')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify({ pad: 'x'.repeat(11 * 1024) }));

    expect(res.status).toBe(413);
    expect(res.body).toMatchObject({ statusCode: 413, code: 'VALIDATION_FAILED' });
    expect((res.body as ErrorBody).requestId).toBe(res.headers['x-request-id']);
  });

  it('Helmet headers are present', async () => {
    const res = await http().get('/does-not-exist');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['content-security-policy']).toBeDefined();
  });
});
