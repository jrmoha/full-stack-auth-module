import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** One row of fixtures/validation-cases.json (architecture §4). */
export interface ValidationCase {
  id: string;
  form: 'signup' | 'signin';
  field: string;
  omit?: true;
  input?: unknown;
  valid: boolean;
  message?: string;
  normalized?: unknown;
  note?: string;
}

interface ValidationFixtures {
  base: Record<'signup' | 'signin', Record<string, string>>;
  cases: ValidationCase[];
}

/** Data only: read from the repo root, never imported by runtime code (architecture §3). */
export const fixtures = JSON.parse(
  readFileSync(
    join(import.meta.dirname, '..', '..', '..', '..', 'fixtures', 'validation-cases.json'),
    'utf8',
  ),
) as ValidationFixtures;

/** The request body for a row: the form's base values with the row's field set or removed. */
export function bodyFor(row: ValidationCase): Record<string, unknown> {
  const body: Record<string, unknown> = { ...fixtures.base[row.form] };
  if (row.omit) {
    return Object.fromEntries(Object.entries(body).filter(([key]) => key !== row.field));
  }
  body[row.field] = row.input;
  return body;
}

export const casesFor = (form: ValidationCase['form']) =>
  fixtures.cases.filter((row) => row.form === form);
