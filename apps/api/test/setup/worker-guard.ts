import { testDatabaseProblem } from './test-db.js';

// Runs before every test file, in the worker. Second line of defence behind global-setup.ts:
// the worker must have inherited MONGODB_URI === TEST_MONGODB_URI.
const testUri = process.env.TEST_MONGODB_URI;
const problem =
  testDatabaseProblem(testUri, undefined) ??
  (process.env.MONGODB_URI === testUri
    ? undefined
    : 'MONGODB_URI was not pointed at the test database.');

if (problem !== undefined) {
  throw new Error(`Test database guard (worker): ${problem}`);
}
