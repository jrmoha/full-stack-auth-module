import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Connection } from 'mongoose';
import { AppModule } from '../../src/app.module.js';
import { TEST_DB_SUFFIX } from './test-db.js';

export interface TestApp {
  app: INestApplication;
  connection: Connection;
}

/**
 * Stub: boots the full AppModule against the test database (MONGODB_URI was set to TEST_MONGODB_URI
 * by global-setup.ts). Task 1.1 replaces the bare init with the shared app setup function.
 */
export async function createTestApp(): Promise<TestApp> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  try {
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
