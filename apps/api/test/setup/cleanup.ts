import type { Connection } from 'mongoose';
import { TEST_DB_SUFFIX } from './test-db.js';

/**
 * Deletes every document in every collection of the connected test database, including collections no
 * model has registered. Never drops: indexes must survive (architecture §9). Refuses any database whose
 * name does not end in _test, independently of the env guard.
 */
export async function clearDatabase(connection: Connection): Promise<void> {
  const db = connection.db;
  if (db === undefined) {
    throw new Error('clearDatabase: the connection is not open.');
  }
  if (!db.databaseName.endsWith(TEST_DB_SUFFIX)) {
    throw new Error(
      `clearDatabase: refusing a database whose name does not end in "${TEST_DB_SUFFIX}".`,
    );
  }
  const collections = await db.collections();
  await Promise.all(collections.map((collection) => collection.deleteMany({})));
}
