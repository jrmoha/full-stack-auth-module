import { MongoClient } from 'mongodb';
import { resolveTestDatabaseUri } from './test-db';

/** Clears `users` before the run with a delete, never a drop, so the unique index survives (architecture §9). */
export default async function globalSetup(): Promise<void> {
  const client = new MongoClient(resolveTestDatabaseUri(), { serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    const db = client.db();
    if (!db.databaseName.endsWith('_test')) {
      throw new Error('E2E global setup: refusing a database whose name does not end in "_test".');
    }
    await db.collection('users').deleteMany({});
  } finally {
    await client.close();
  }
}
