import { HttpException } from '@nestjs/common';
import type { ErrorCode, FieldErrors } from './error-codes.js';

/** An error with a known §4 code and a message that is safe to show to the user. */
export class AppException extends HttpException {
  constructor(
    status: number,
    readonly code: ErrorCode,
    message: string,
    readonly fieldErrors?: FieldErrors,
  ) {
    super(message, status);
  }
}
