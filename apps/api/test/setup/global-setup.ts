import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';
import { testDatabaseProblem } from './test-db.js';

/** The only values taken from a local apps/api/.env; everything else stays deterministic (test.env). */
const KEYS_FROM_ENV_FILE = ['TEST_MONGODB_URI', 'MONGODB_URI'] as const;

/**
 * Runs once in the main process before any test file is collected. Throwing here aborts the whole run.
 * Afterwards MONGODB_URI is the test URI, so anything booting AppModule in a worker reaches only the test DB.
 */
export default function setup(): void {
  const envFile = join(import.meta.dirname, '..', '..', '.env');
  if (existsSync(envFile)) {
    const fileValues = parseEnv(readFileSync(envFile, 'utf8'));
    for (const key of KEYS_FROM_ENV_FILE) {
      // The real environment (CI, command line) wins over the file.
      process.env[key] ??= fileValues[key];
    }
  }

  const testUri = process.env.TEST_MONGODB_URI;
  const problem = testDatabaseProblem(testUri, process.env.MONGODB_URI);
  if (problem !== undefined || testUri === undefined) {
    throw new Error(
      `Test database guard: ${problem ?? 'TEST_MONGODB_URI is not set.'} No tests were run.`,
    );
  }

  process.env.MONGODB_URI = testUri;
}
