import { ValidateBy, type ValidationOptions } from 'class-validator';

/**
 * Architecture §4 rules. One decorator per table row, each carrying the exact §4 message; apply them in table
 * order. "Present" means a string that is not empty after normalization, so a blank form field reads as
 * required. Every rule after the required one passes on a non-string, so a missing field reports only its
 * required message.
 */

const isPresentString = (value: unknown): value is string =>
  typeof value === 'string' && value !== '';

/**
 * §4 check order within a field, encoded in the constraint name (`rule<rank>:<name>`) and applied by the
 * validation-error factory. Every §4 field uses its rules in this relative order.
 */
const RANK = {
  isPresentString: 0,
  minChars: 1,
  maxChars: 2,
  isSpecEmail: 3,
  containsLetter: 4,
  containsDigit: 5,
  containsSpecial: 6,
} as const;

const ruleName = (kind: keyof typeof RANK, suffix = ''): string =>
  `rule${String(RANK[kind])}:${kind}${suffix}`;

function rule(name: string, test: (value: string) => boolean, message: string): PropertyDecorator {
  const options: ValidationOptions = { message };
  return ValidateBy(
    {
      name,
      validator: {
        validate: (value: unknown) => !isPresentString(value) || test(value),
      },
    },
    options,
  );
}

export function IsPresentString(message: string): PropertyDecorator {
  return ValidateBy(
    { name: ruleName('isPresentString'), validator: { validate: isPresentString } },
    { message },
  );
}

export const MinChars = (min: number, message: string) =>
  rule(ruleName('minChars', String(min)), (v) => v.length >= min, message);

export const MaxChars = (max: number, message: string) =>
  rule(ruleName('maxChars', String(max)), (v) => v.length <= max, message);

/**
 * §4 email format: exactly one `@`; a non-empty local part with no whitespace; a domain of two or more
 * dot-separated labels, each letters, digits or hyphens and not starting or ending with a hyphen; the last
 * label at least 2 letters. Deliberately not class-validator's isEmail.
 */
export const EMAIL_PATTERN =
  /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

export const IsSpecEmail = (message: string) =>
  rule(ruleName('isSpecEmail'), (v) => EMAIL_PATTERN.test(v), message);

/** A-Z or a-z only. */
export const ContainsLetter = (message: string) =>
  rule(ruleName('containsLetter'), (v) => /[A-Za-z]/.test(v), message);

/** 0-9 only. */
export const ContainsDigit = (message: string) =>
  rule(ruleName('containsDigit'), (v) => /[0-9]/.test(v), message);

/**
 * Anything that is not an ASCII letter, a digit or whitespace; non-ASCII letters such as é count. Whitespace is
 * JavaScript's `\s` set (the same set `String.prototype.trim` removes), e.g. space, tab, NBSP.
 */
export const ContainsSpecial = (message: string) =>
  rule(ruleName('containsSpecial'), (v) => /[^A-Za-z0-9\s]/.test(v), message);
