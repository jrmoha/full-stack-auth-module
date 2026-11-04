import { HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppException } from './app.exception.js';
import type { FieldErrors } from './error-codes.js';

export const VALIDATION_MESSAGE = 'Some fields are invalid.';
export const FIELD_NOT_ALLOWED = 'Field is not allowed';

/** `rule<rank>:<name>` constraints (auth validators) sort by rank, so messages follow the §4 table order. */
const RANKED = /^rule(\d+):/;

function orderedMessages(constraints: Record<string, string>): string[] {
  const rank = (name: string) => {
    const match = RANKED.exec(name);
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };
  return Object.entries(constraints)
    .sort(([a], [b]) => rank(a) - rank(b))
    .map(([, message]) => message);
}

/**
 * ValidationPipe exceptionFactory (architecture §8): `fieldErrors` keyed by DTO property name, holding every
 * failing §4 message in §4 table order. A property rejected by `forbidNonWhitelisted` gets "Field is not allowed".
 */
export function validationExceptionFactory(errors: ValidationError[]): AppException {
  const fieldErrors: FieldErrors = {};
  for (const error of errors) {
    const constraints = error.constraints ?? {};
    const messages =
      'whitelistValidation' in constraints ? [FIELD_NOT_ALLOWED] : orderedMessages(constraints);
    if (error.property && messages.length > 0) {
      fieldErrors[error.property] = messages;
    }
  }
  return new AppException(
    HttpStatus.BAD_REQUEST,
    'VALIDATION_FAILED',
    VALIDATION_MESSAGE,
    fieldErrors,
  );
}
