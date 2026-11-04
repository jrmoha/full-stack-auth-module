import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ERROR_CODES } from '../errors/error-codes.js';

/** The §4 error shape, for the API docs only. */
export class ErrorResponseDto {
  @ApiProperty({ example: 400, description: 'Mirrors the HTTP status' })
  statusCode!: number;

  @ApiProperty({ enum: ERROR_CODES, example: 'VALIDATION_FAILED' })
  code!: string;

  @ApiProperty({ example: 'Some fields are invalid.', description: 'Safe to display' })
  message!: string;

  @ApiProperty({ format: 'uuid', description: 'Also sent as the x-request-id header and logged' })
  requestId!: string;

  @ApiPropertyOptional({
    type: 'object',
    additionalProperties: { type: 'array', items: { type: 'string' } },
    example: { email: ['Enter a valid email address'] },
    description: 'Field name to every failing §4 message, in table order',
  })
  fieldErrors?: Record<string, string[]>;
}
