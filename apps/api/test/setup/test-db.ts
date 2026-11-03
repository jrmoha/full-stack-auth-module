/**
 * Test database rules (architecture §9, ADR 2026-11-03-test-db-isolation).
 * Messages name the problem only; URIs are never printed.
 */

export const TEST_DB_SUFFIX = '_test';

/** Database name from a mongodb:// or mongodb+srv:// URI, or undefined if there is none. */
export function databaseName(uri: string): string | undefined {
  try {
    const name = new URL(uri).pathname.replace(/^\//, '');
    return name === '' ? undefined : decodeURIComponent(name);
  } catch {
    return undefined;
  }
}

/** Returns the reason the URI pair is unsafe for tests, or undefined when it is safe. */
export function testDatabaseProblem(
  testUri: string | undefined,
  appUri: string | undefined,
): string | undefined {
  if (testUri === undefined || testUri.trim() === '') {
    return 'TEST_MONGODB_URI is not set.';
  }
  if (!/^mongodb(\+srv)?:\/\//.test(testUri)) {
    return 'TEST_MONGODB_URI is not a mongodb:// or mongodb+srv:// URI.';
  }
  const name = databaseName(testUri);
  if (name === undefined || !name.endsWith(TEST_DB_SUFFIX)) {
    return `TEST_MONGODB_URI must name a database ending in "${TEST_DB_SUFFIX}".`;
  }
  if (appUri !== undefined && testUri === appUri) {
    return 'TEST_MONGODB_URI must differ from MONGODB_URI.';
  }
  return undefined;
}
