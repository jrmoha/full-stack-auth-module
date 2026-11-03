import { Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { describe, expect, it } from 'vitest';
import { createTestApp } from './setup/app-factory.js';
import { clearDatabase } from './setup/cleanup.js';

@Injectable()
class Dependency {
  readonly name = 'dependency';
}

@Injectable()
class Consumer {
  // No @Inject token: Nest can only resolve this through emitted `design:paramtypes` metadata.
  constructor(readonly dependency: Dependency) {}
}

describe('DI smoke (decorator metadata)', () => {
  it('resolves a provider through constructor injection', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [Dependency, Consumer],
    }).compile();

    const consumer = moduleRef.get(Consumer);

    expect(consumer.dependency).toBeInstanceOf(Dependency);
    await moduleRef.close();
  });
});

describe('test app factory and cleanup (test database)', () => {
  it('boots AppModule on the test database, and cleanup deletes documents without dropping', async () => {
    const { app, connection } = await createTestApp();
    try {
      expect(connection.db?.databaseName).toMatch(/_test$/);

      // Written through the raw driver so cleanup is shown to cover unregistered collections too.
      const db = connection.db;
      if (db === undefined) throw new Error('test connection is not open');
      const probe = db.collection('harness_probe');
      await probe.insertOne({ createdBy: 'di-smoke' });
      expect(await probe.countDocuments()).toBe(1);

      await clearDatabase(connection);

      expect(await probe.countDocuments()).toBe(0);
      const names = (await connection.listCollections()).map((c) => c.name);
      expect(names).toContain('harness_probe');
    } finally {
      await app.close();
    }
  });
});
