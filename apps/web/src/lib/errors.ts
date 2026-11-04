/**
 * Maps API failures to what a form shows (architecture §8 "Form failure UX"). Pure, so it is unit-tested
 * without a browser (test/errors.spec.ts).
 */

export const DISPLAY = {
  invalidCredentials: 'Invalid email or password',
  emailTaken: 'An account with this email already exists',
  generic: 'Something went wrong. Try again.',
  tooMany: (seconds: number) => `Too many attempts. Try again in ${String(seconds)} seconds.`,
} as const;

export type FormKind = 'signup' | 'signin';

export interface FormError {
  /** Field name to the message shown under it (first §4 message only). */
  fieldErrors: Record<string, string>;
  /** Message for the form alert (a live region). */
  alert?: string;
  /** "Reference: <requestId>" for 5xx and network failures, when the API sent one. */
  reference?: string;
}

/** The §4 error body, as far as the web relies on it. Anything else (e.g. a proxy's plain-text 500) is unknown. */
interface ApiErrorBody {
  code?: unknown;
  message?: unknown;
  requestId?: unknown;
  fieldErrors?: unknown;
}

const asBody = (value: unknown): ApiErrorBody =>
  typeof value === 'object' && value !== null ? value : {};

function firstMessages(fieldErrors: unknown): Record<string, string> {
  if (typeof fieldErrors !== 'object' || fieldErrors === null) return {};
  const out: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (Array.isArray(messages) && typeof messages[0] === 'string') out[field] = messages[0];
  }
  return out;
}

/** Retry-After is delta-seconds from the API (throttler); fall back to 60, the §10 window. */
function retrySeconds(retryAfter: string | null): number {
  const seconds = Number(retryAfter);
  return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60;
}

export function toFormError(
  form: FormKind,
  status: number,
  body: unknown,
  retryAfter: string | null,
  formFields: readonly string[],
): FormError {
  const parsed = asBody(body);

  if (status === 400) {
    const all = firstMessages(parsed.fieldErrors);
    const fieldErrors = Object.fromEntries(
      Object.entries(all).filter(([field]) => formFields.includes(field)),
    );
    const leftover = Object.entries(all).find(([field]) => !formFields.includes(field));
    const alert =
      leftover?.[1] ??
      (Object.keys(fieldErrors).length === 0 && typeof parsed.message === 'string'
        ? parsed.message
        : undefined);
    if (alert) return { fieldErrors, alert };
    // Nothing usable in the body (e.g. a proxy's non-JSON 400): never leave the user without feedback.
    return Object.keys(fieldErrors).length > 0
      ? { fieldErrors }
      : { fieldErrors, alert: DISPLAY.generic };
  }
  if (status === 401 && form === 'signin') {
    return { fieldErrors: {}, alert: DISPLAY.invalidCredentials };
  }
  if (status === 409 && form === 'signup') {
    return { fieldErrors: { email: DISPLAY.emailTaken } };
  }
  if (status === 429) {
    return { fieldErrors: {}, alert: DISPLAY.tooMany(retrySeconds(retryAfter)) };
  }
  return networkOrServerError(parsed.requestId);
}

/** 5xx, unexpected statuses and network failures. */
export function networkOrServerError(requestId?: unknown): FormError {
  return typeof requestId === 'string' && requestId !== ''
    ? { fieldErrors: {}, alert: DISPLAY.generic, reference: `Reference: ${requestId}` }
    : { fieldErrors: {}, alert: DISPLAY.generic };
}
