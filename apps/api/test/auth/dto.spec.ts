import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { SigninDto } from '../../src/auth/dto/signin.dto.js';
import { SignupDto } from '../../src/auth/dto/signup.dto.js';
import { validationExceptionFactory } from '../../src/common/errors/validation-exception.factory.js';
import { bodyFor, casesFor, fixtures, type ValidationCase } from './fixtures.js';

/** Same options as the global ValidationPipe (common/app-setup.ts). */
async function run(dto: typeof SignupDto | typeof SigninDto, row: ValidationCase) {
  const instance = plainToInstance(dto, bodyFor(row));
  const errors = await validate(instance, { whitelist: true, forbidNonWhitelisted: true });
  const fieldErrors =
    errors.length > 0 ? (validationExceptionFactory(errors).fieldErrors ?? {}) : {};
  return { instance: instance as unknown as Record<string, unknown>, fieldErrors };
}

describe('validation fixtures (task 1.3)', () => {
  it('cover every §4 message at least once', () => {
    const messages = new Set(fixtures.cases.map((row) => row.message).filter(Boolean));
    expect([...messages].sort()).toEqual(
      [
        'Email is required',
        'Email must be at most 254 characters',
        'Enter a valid email address',
        'Field is not allowed',
        'Name is required',
        'Name must be at least 3 characters',
        'Name must be at most 50 characters',
        'Password is required',
        'Password must be at least 8 characters',
        'Password must be at most 128 characters',
        'Password must contain a letter',
        'Password must contain a number',
        'Password must contain a special character',
      ].sort(),
    );
  });

  it('have unique ids', () => {
    const ids = fixtures.cases.map((row) => row.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

for (const [form, dto] of [
  ['signup', SignupDto],
  ['signin', SigninDto],
] as const) {
  describe(`${dto.name} against every ${form} fixture row`, () => {
    it.each(casesFor(form).map((row) => [row.id, row] as const))('%s', async (_id, row) => {
      const { instance, fieldErrors } = await run(dto, row);

      if (row.valid) {
        expect(fieldErrors).toEqual({});
        if ('normalized' in row) expect(instance[row.field]).toEqual(row.normalized);
      } else {
        // Only the row's field fails, and its first message is the §4 text the web shows.
        expect(Object.keys(fieldErrors)).toEqual([row.field]);
        expect(fieldErrors[row.field]?.[0]).toBe(row.message);
      }
    });
  });
}

describe('API returns every failing message for the field (architecture §4)', () => {
  it('lists all failing password rules in table order', async () => {
    const { fieldErrors } = await run(SignupDto, {
      id: 'adhoc',
      form: 'signup',
      field: 'password',
      input: 'abc',
      valid: false,
    });

    expect(fieldErrors.password).toEqual([
      'Password must be at least 8 characters',
      'Password must contain a number',
      'Password must contain a special character',
    ]);
  });

  it.each([
    [
      'email over 254 with a bad format: max, then format',
      SignupDto,
      'email',
      `${'a'.repeat(250)}@x.c0m`,
      ['Email must be at most 254 characters', 'Enter a valid email address'],
    ],
    [
      'password of 129 letters: max, then number, then special',
      SignupDto,
      'password',
      'p'.repeat(129),
      [
        'Password must be at most 128 characters',
        'Password must contain a number',
        'Password must contain a special character',
      ],
    ],
    [
      'name of 51 characters: max only',
      SignupDto,
      'name',
      'n'.repeat(51),
      ['Name must be at most 50 characters'],
    ],
    [
      'signin password of 129: max only, no complexity rules',
      SigninDto,
      'password',
      'p'.repeat(129),
      ['Password must be at most 128 characters'],
    ],
  ] as const)('%s', async (_name, dto, field, input, expected) => {
    const { fieldErrors } = await run(dto, {
      id: 'adhoc',
      form: dto === SignupDto ? 'signup' : 'signin',
      field,
      input,
      valid: false,
    });

    expect(fieldErrors[field]).toEqual(expected);
  });

  it('a missing field reports only its required message', async () => {
    const { fieldErrors } = await run(SignupDto, {
      id: 'adhoc',
      form: 'signup',
      field: 'password',
      omit: true,
      valid: false,
    });

    expect(fieldErrors.password).toEqual(['Password is required']);
  });
});
