import { HttpStatus } from '@nestjs/common';
import type { ValidationError } from 'class-validator';
import { AppException } from './app.exception.js';
import type { FieldErrors } from './error-codes.js';

export const VALIDATION_MESSAGE = 'Some fields are invalid.';
export const FIELD_NOT_ALLOWED = 'Field is not allowed';

/**
 * ValidationPipe exceptionFactory (architecture §8): `fieldErrors` keyed by DTO property name, holding every
 * failing §4 message in decorator order. A property rejected by `forbidNonWhitelisted` gets "Field is not allowed".
 */
export function validationExceptionFactory(errors: ValidationError[]): AppException {
  const fieldErrors: FieldErrors = {};
  for (const error of errors) {
    const constraints = error.constraints ?? {};
    const messages =
      'whitelistValidation' in constraints ? [FIELD_NOT_ALLOWED] : Object.values(constraints);
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
