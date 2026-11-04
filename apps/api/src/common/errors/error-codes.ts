/** Error codes from the architecture §4 error shape. */
export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'EMAIL_TAKEN',
  'INVALID_CREDENTIALS',
  'UNAUTHENTICATED',
  'RATE_LIMITED',
  'NOT_FOUND',
  'SERVICE_UNAVAILABLE',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Keys are form field names; values are §4 messages, in check order. */
export type FieldErrors = Record<string, string[]>;

/** The §4 error body. Every non-2xx response has exactly this shape. */
export interface ErrorBody {
  statusCode: number;
  code: ErrorCode;
  message: string;
  requestId: string;
  fieldErrors?: FieldErrors;
}
