import { randomUUID } from 'node:crypto';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import type { Env } from '../config/index.js';
import { mountApiDocs } from './docs/api-docs.js';
import { validationExceptionFactory } from './errors/validation-exception.factory.js';
import { AllExceptionsFilter } from './filters/all-exceptions.filter.js';
import { REQUEST_ID_HEADER } from './logging/logger.module.js';

/** Request body limit (architecture §4). */
export const JSON_BODY_LIMIT = '10kb';

/**
 * The one HTTP setup shared by main.ts and the tests (architecture §3). The app must be created with
 * `bodyParser: false` (JSON only, no URL-encoded parser) and `bufferLogs: true`.
 */
export function configureApp(app: NestExpressApplication): void {
  const config = app.get<ConfigService<Env, true>>(ConfigService);

  app.useLogger(app.get(Logger));
  app.set('trust proxy', config.get('TRUST_PROXY_HOPS', { infer: true }));

  // First middleware: every response, including errors raised before routing (body parser, bad URL), carries
  // the request id. pino-http reuses req.id, so logs and responses agree. Incoming ids are not trusted.
  app.use((req: Request & { id?: string }, res: Response, next: NextFunction) => {
    req.id = randomUUID();
    res.setHeader(REQUEST_ID_HEADER, req.id);
    next();
  });
  app.use(helmet());
  app.enableCors({
    // A list, so cors compares the request origin and omits the header on a mismatch (a bare string is
    // echoed to every origin).
    origin: [config.get('WEB_ORIGIN', { infer: true })],
    credentials: true,
    methods: ['GET', 'POST'],
  });
  app.use(cookieParser());
  app.useBodyParser('json', { limit: JSON_BODY_LIMIT });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: validationExceptionFactory,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger UI and the OpenAPI JSON exist only outside production (swagger-exposure ADR).
  if (config.get('NODE_ENV', { infer: true }) !== 'production') {
    mountApiDocs(app);
  }
}
