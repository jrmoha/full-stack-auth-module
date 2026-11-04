import type { DynamicModule, Type } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import type { DestinationStream } from 'pino';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/common/app-setup.js';
import { LOG_DESTINATION } from '../../src/common/logging/log-destination.js';
import { type Env, validateEnv } from '../../src/config/index.js';
import { TEST_DB_SUFFIX } from './test-db.js';

export interface TestApp {
  app: NestExpressApplication;
  connection: Connection;
}

export interface TestAppOptions {
  /** Test-only modules mounted next to AppModule (e.g. a controller that throws). */
  imports?: (Type | DynamicModule)[];
  /** Captures pino output; without it, logging is silent under NODE_ENV=test. */
  logDestination?: DestinationStream;
  /** Per-app config values (e.g. COOKIE_SECURE, THROTTLE_AUTH_LIMIT); validated like the real env. */
  config?: Partial<Record<keyof Env, string>>;
}

/**
 * Boots the full AppModule against the test database (MONGODB_URI was set to TEST_MONGODB_URI by
 * global-setup.ts), with the same HTTP setup as main.ts.
 */
export async function createTestApp(options: TestAppOptions = {}): Promise<TestApp> {
  const builder = Test.createTestingModule({ imports: [AppModule, ...(options.imports ?? [])] });
  if (options.logDestination) {
    builder.overrideProvider(LOG_DESTINATION).useValue(options.logDestination);
  }
  if (options.config) {
    // ConfigModule reads the environment once at import, so per-app values replace the ConfigService.
    const env = validateEnv({ ...process.env, ...options.config });
    builder.overrideProvider(ConfigService).useValue(new ConfigService(env));
  }
  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({
    bodyParser: false,
    bufferLogs: true,
  });
  try {
    configureApp(app);
    await app.init();
    const connection = app.get<Connection>(getConnectionToken());
    if (connection.db?.databaseName.endsWith(TEST_DB_SUFFIX) !== true) {
      throw new Error(
        `createTestApp: connected database name does not end in "${TEST_DB_SUFFIX}".`,
      );
    }
    return { app, connection };
  } catch (error) {
    await app.close();
    throw error;
  }
}

/** Collects pino lines written by the app, for log-content assertions. */
export function captureLogs(): { destination: DestinationStream; text: () => string } {
  const lines: string[] = [];
  return {
    destination: { write: (line: string) => void lines.push(line) },
    text: () => lines.join(''),
  };
}
