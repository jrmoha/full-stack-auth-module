import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { signinSchema, signupSchema } from '../src/lib/validation';

interface ValidationCase {
  id: string;
  form: 'signup' | 'signin';
  field: string;
  omit?: true;
  input?: unknown;
  valid: boolean;
  message?: string;
  normalized?: unknown;
  apiOnly?: true;
}

interface ValidationFixtures {
  base: Record<'signup' | 'signin', Record<string, string>>;
  cases: ValidationCase[];
}

/** Shared §4 data, also run by the API suite (apps/api/test/auth/dto.spec.ts). */
const fixtures = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', 'fixtures', 'validation-cases.json'),
    'utf8',
  ),
) as ValidationFixtures;

function bodyFor(row: ValidationCase): Record<string, unknown> {
  const body: Record<string, unknown> = { ...fixtures.base[row.form] };
  if (row.omit) {
    return Object.fromEntries(Object.entries(body).filter(([key]) => key !== row.field));
  }
  body[row.field] = row.input;
  return body;
}

const schemas = { signup: signupSchema, signin: signinSchema };

describe('web Zod schemas against every fixture row (architecture §4)', () => {
  const rows = fixtures.cases.filter((row) => !row.apiOnly);

  it('run the shared fixtures, skipping only API-only rows', () => {
    expect(rows.length).toBeGreaterThan(90);
    expect(
      fixtures.cases
        .filter((row) => row.apiOnly)
        .every((row) => row.message === 'Field is not allowed'),
    ).toBe(true);
  });

  it.each(rows.map((row) => [row.id, row] as const))('%s', (_id, row) => {
    const result = schemas[row.form].safeParse(bodyFor(row));

    if (row.valid) {
      expect(result.success).toBe(true);
      if (result.success && 'normalized' in row) {
        expect((result.data as Record<string, unknown>)[row.field]).toEqual(row.normalized);
      }
      return;
    }

    expect(result.success).toBe(false);
    const issues = result.error?.issues ?? [];
    // Only the row's field fails, and the first message for it is the §4 text the form shows.
    expect([...new Set(issues.map((issue) => issue.path[0]))]).toEqual([row.field]);
    expect(issues[0]?.message).toBe(row.message);
  });
});
