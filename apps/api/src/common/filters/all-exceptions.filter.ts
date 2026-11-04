import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AppException } from '../errors/app.exception.js';
import type { ErrorBody, ErrorCode } from '../errors/error-codes.js';

const GENERIC_MESSAGE = 'Something went wrong. Try again.';

const MESSAGES = {
  NOT_FOUND: 'Not found.',
  UNAUTHENTICATED: 'Sign in to continue.',
  VALIDATION_FAILED: 'The request body could not be read.',
  RATE_LIMITED: 'Too many attempts. Try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Try again.',
} as const;

/** Mongo driver errors that mean the database cannot be reached (architecture §8: 503 at runtime). */
const MONGO_UNAVAILABLE = new Set([
  'MongoServerSelectionError',
  'MongooseServerSelectionError',
  'MongoNetworkError',
  'MongoNetworkTimeoutError',
  'MongoNotConnectedError',
]);

interface Mapped {
  status: number;
  code: ErrorCode;
  message: string;
  fieldErrors?: ErrorBody['fieldErrors'];
}

/**
 * The single error shape for every non-2xx response (architecture §4, §8). Messages are safe to display;
 * unknown errors become a generic 500 and their stack is logged with the request id, never returned.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request & { id?: unknown }>();
    const response = http.getResponse<Response>();
    const requestId =
      typeof request.id === 'string' || typeof request.id === 'number' ? String(request.id) : '';

    const mapped = this.map(exception);
    if (mapped.status >= 500) {
      // Stack and driver detail go to the log only, tagged with the request id.
      // Fixed message: the error text may hold secrets, so it is logged only through the scrubbed `err`.
      this.logger.error({ err: exception, requestId }, 'Unhandled error');
    }

    const body: ErrorBody = {
      statusCode: mapped.status,
      code: mapped.code,
      message: mapped.message,
      requestId,
      ...(mapped.fieldErrors ? { fieldErrors: mapped.fieldErrors } : {}),
    };
    response.status(mapped.status).json(body);
  }

  private map(exception: unknown): Mapped {
    if (exception instanceof AppException) {
      const status = exception.getStatus();
      return {
        status,
        code: exception.code,
        message: exception.message,
        ...(exception.fieldErrors ? { fieldErrors: exception.fieldErrors } : {}),
      };
    }
    if (exception instanceof ThrottlerException) {
      // ThrottlerGuard has already set Retry-After on the response (default throttler name).
      return {
        status: HttpStatus.TOO_MANY_REQUESTS,
        code: 'RATE_LIMITED',
        message: MESSAGES.RATE_LIMITED,
      };
    }
    if (exception instanceof HttpException) {
      const status: number = exception.getStatus();
      if (status === 404) {
        return { status, code: 'NOT_FOUND', message: MESSAGES.NOT_FOUND };
      }
      if (status === 401) {
        return { status, code: 'UNAUTHENTICATED', message: MESSAGES.UNAUTHENTICATED };
      }
      // Express 5 maps body-parser failures (invalid JSON 400, over 10 KB 413, bad charset 415) and bad
      // URLs to HttpExceptions; any other client error keeps its status (statusCode mirrors HTTP status).
      if (status >= 400 && status < 500) {
        return { status, code: 'VALIDATION_FAILED', message: MESSAGES.VALIDATION_FAILED };
      }
    }
    if (exception instanceof Error && MONGO_UNAVAILABLE.has(exception.name)) {
      return {
        status: HttpStatus.SERVICE_UNAVAILABLE,
        code: 'SERVICE_UNAVAILABLE',
        message: MESSAGES.SERVICE_UNAVAILABLE,
      };
    }
    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_ERROR',
      message: GENERIC_MESSAGE,
    };
  }
}
