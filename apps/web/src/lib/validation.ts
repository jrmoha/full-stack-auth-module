import { z } from 'zod';

/**
 * Architecture §4 rules for the web forms, mirrored (not shared) from the API DTOs. Messages are identical text.
 * Checks run in §4 table order and the form shows the first failing message. A field is present only if it is a
 * string that is not empty after normalization; anything else reports the field's required message. Lengths are
 * JavaScript `length`; whitespace is JavaScript `\s`. Parity is proven by test/validation.spec.ts, which runs
 * every row of fixtures/validation-cases.json.
 */

export const MESSAGES = {
  emailRequired: 'Email is required',
  emailMax: 'Email must be at most 254 characters',
  emailFormat: 'Enter a valid email address',
  nameRequired: 'Name is required',
  nameMin: 'Name must be at least 3 characters',
  nameMax: 'Name must be at most 50 characters',
  passwordRequired: 'Password is required',
  passwordMin: 'Password must be at least 8 characters',
  passwordMax: 'Password must be at most 128 characters',
  passwordLetter: 'Password must contain a letter',
  passwordDigit: 'Password must contain a number',
  passwordSpecial: 'Password must contain a special character',
} as const;

/** Same pattern as the API (apps/api/src/auth/validators/rules.ts): §4 custom rule, not Zod's email(). */
const EMAIL_PATTERN = /^[^\s@]+@(?:[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?\.)+[A-Za-z]{2,}$/;

/**
 * Lengths use JavaScript `length` (UTF-16 code units), as §4 and the API count. Zod's own min/max count code
 * points, which disagrees for emoji and other astral characters (fixture signup-name-26-emoji).
 */
const atLeast = (min: number) => (value: string) => value.length >= min;
const atMost = (max: number) => (value: string) => value.length <= max;

/** A string field with a required message for non-strings and for empty-after-normalization values. */
const present = (required: string, normalize: (value: string) => string = (value) => value) =>
  z.string({ error: required }).transform(normalize).pipe(z.string().min(1, required));

const email = present(MESSAGES.emailRequired, (value) => value.trim().toLowerCase()).pipe(
  z.string().refine(atMost(254), MESSAGES.emailMax).regex(EMAIL_PATTERN, MESSAGES.emailFormat),
);

const name = present(MESSAGES.nameRequired, (value) => value.trim()).pipe(
  z.string().refine(atLeast(3), MESSAGES.nameMin).refine(atMost(50), MESSAGES.nameMax),
);

/** Passwords are never trimmed. */
const signupPassword = present(MESSAGES.passwordRequired).pipe(
  z
    .string()
    .refine(atLeast(8), MESSAGES.passwordMin)
    .refine(atMost(128), MESSAGES.passwordMax)
    .regex(/[A-Za-z]/, MESSAGES.passwordLetter)
    .regex(/[0-9]/, MESSAGES.passwordDigit)
    .regex(/[^A-Za-z0-9\s]/, MESSAGES.passwordSpecial),
);

/** No complexity rules on signin: it never reveals the policy. */
const signinPassword = present(MESSAGES.passwordRequired).pipe(
  z.string().refine(atMost(128), MESSAGES.passwordMax),
);

export const signupSchema = z.object({ email, name, password: signupPassword });
export const signinSchema = z.object({ email, password: signinPassword });

export type SignupInput = z.input<typeof signupSchema>;
export type SignupValues = z.output<typeof signupSchema>;
export type SigninInput = z.input<typeof signinSchema>;
export type SigninValues = z.output<typeof signinSchema>;
