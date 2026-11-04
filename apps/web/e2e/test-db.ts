import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseEnv } from 'node:util';

/**
 * E2E test database rules (architecture §9, test-db-isolation ADR), mirrored from apps/api/test/setup/test-db.ts
 * because the apps never import from each other. Reads TEST_MONGODB_URI and MONGODB_URI from the environment
 * (CI) or, failing that, from the developer's apps/api/.env. Messages never print URIs.
 */
export function resolveTestDatabaseUri(): string {
  // Playwright loads this file as CommonJS, so __dirname (not import.meta) is available.
  const envFile = join(__dirname, '..', '..', 'api', '.env');
  const fromFile = existsSync(envFile) ? parseEnv(readFileSync(envFile, 'utf8')) : {};
  const testUri = process.env.TEST_MONGODB_URI ?? fromFile.TEST_MONGODB_URI;
  const appUri = process.env.MONGODB_URI ?? fromFile.MONGODB_URI;

  const fail = (reason: string): never => {
    throw new Error(`E2E test database guard: ${reason} No servers were started.`);
  };
  if (!testUri) return fail('TEST_MONGODB_URI is not set.');
  if (!/^mongodb(\+srv)?:\/\//.test(testUri)) return fail('TEST_MONGODB_URI is not a mongodb URI.');
  let name: string;
  try {
    name = decodeURIComponent(new URL(testUri).pathname.replace(/^\//, ''));
  } catch {
    return fail('TEST_MONGODB_URI cannot be parsed.');
  }
  if (!name.endsWith('_test'))
    return fail('TEST_MONGODB_URI must name a database ending in "_test".');
  if (appUri !== undefined && appUri === testUri)
    return fail('TEST_MONGODB_URI must differ from MONGODB_URI.');
  return testUri;
}
