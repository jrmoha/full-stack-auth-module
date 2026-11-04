import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';
import type { Options } from 'pino-http';
import type { Env } from '../../config/index.js';
import { LOG_DESTINATION, type LogDestination, LogDestinationModule } from './log-destination.js';

export const REQUEST_ID_HEADER = 'X-Request-Id';

/**
 * Architecture §10 redaction list. The serializers below already drop headers and bodies; these paths are the
 * backstop for anything logged by hand.
 */
export const REDACT_PATHS = [
  'req.headers.cookie',
  'req.headers.authorization',
  'res.headers["set-cookie"]',
  'password',
  'passwordHash',
  '*.password',
  '*.passwordHash',
  '*.*.password',
  '*.*.passwordHash',
];

/**
 * Backstop for error text in logs (architecture §10): connection-string credentials and email addresses are
 * removed, since logs reference users by id only.
 */
export function scrubSecrets(text: string): string {
  return text
    .replace(/(mongodb(?:\+srv)?:\/\/)[^\s/]*@/g, '$1[Redacted]@')
    .replace(/[A-Za-z0-9._%+-]+@(?:[A-Za-z0-9-]+\.)+[A-Za-z]{2,}\b/g, '[email]');
}

interface SerializedRequest {
  id?: unknown;
  method?: string;
  url?: string;
}

interface SerializedResponse {
  statusCode?: number;
}

function pinoHttpOptions(config: ConfigService<Env, true>, destination: LogDestination): Options {
  const env = config.get('NODE_ENV', { infer: true });
  const level =
    env === 'test' && destination === undefined
      ? 'silent'
      : config.get('LOG_LEVEL', { infer: true });
  const pretty = env === 'development' && destination === undefined;

  return {
    level,
    // configureApp assigns req.id first; this only covers requests that bypass it.
    genReqId: (req: IncomingMessage & { id?: unknown }, res: ServerResponse) => {
      if (typeof req.id === 'string') return req.id;
      const id = randomUUID();
      res.setHeader(REQUEST_ID_HEADER, id);
      return id;
    },
    // Method, path and status only: no headers, query strings or bodies (architecture §10).
    serializers: {
      req: (req: SerializedRequest) => ({
        id: req.id,
        method: req.method,
        url: req.url?.split('?')[0],
      }),
      res: (res: SerializedResponse) => ({ statusCode: res.statusCode }),
      // Type and scrubbed stack only: no driver fields (e.g. a duplicate-key error's keyValue holds the email).
      err: (err: Error) => ({ type: err.name, stack: scrubSecrets(err.stack ?? err.message) }),
    },
    redact: { paths: REDACT_PATHS, censor: '[Redacted]' },
    ...(pretty ? { transport: { target: 'pino-pretty', options: { singleLine: true } } } : {}),
    ...(destination ? { stream: destination } : {}),
  };
}

/** Structured request logging with request ids and redaction (nestjs-pino). */
@Module({
  imports: [
    LogDestinationModule,
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService, LOG_DESTINATION],
      useFactory: (config: ConfigService<Env, true>, destination: LogDestination) => ({
        pinoHttp: pinoHttpOptions(config, destination),
      }),
    }),
  ],
})
export class LoggingModule {}
