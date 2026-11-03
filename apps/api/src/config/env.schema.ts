import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
  NotEquals,
  ValidateBy,
  type ValidationOptions,
} from 'class-validator';

/** Architecture §7 environment variables for the API. Validated once at boot. */

export const NODE_ENVS = ['development', 'test', 'production'] as const;
export type NodeEnv = (typeof NODE_ENVS)[number];

export const LOG_LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'] as const;
export type LogLevel = (typeof LOG_LEVELS)[number];

/** The §7 example value. It satisfies the length rule, so it is rejected explicitly. */
export const JWT_SECRET_PLACEHOLDER =
  'replace-with-64-random-hex-characters-0000000000000000000000000';

/**
 * Accept only plain decimal digits. Anything else (blank, whitespace, '1e3', '0x10', '1.5') stays a
 * string and fails @IsInt, instead of Number() quietly turning '' into 0.
 */
const toInteger = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : value;

/** Accept only the literal strings "true" / "false"; anything else stays a string and fails @IsBoolean. */
const toBoolean = ({ value }: { value: unknown }): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};

/** An http(s) URL that is exactly an origin (scheme, host, optional port), as CORS compares it verbatim. */
function IsOrigin(options?: ValidationOptions): PropertyDecorator {
  return ValidateBy(
    {
      name: 'isOrigin',
      validator: {
        validate: (value: unknown): boolean => {
          if (typeof value !== 'string') return false;
          try {
            const url = new URL(value);
            return (url.protocol === 'http:' || url.protocol === 'https:') && url.origin === value;
          } catch {
            return false;
          }
        },
      },
    },
    options,
  );
}

export class EnvironmentVariables {
  @IsIn(NODE_ENVS)
  NODE_ENV!: NodeEnv;

  @IsOptional()
  @Transform(toInteger)
  @IsInt()
  @Min(1)
  @Max(65535)
  PORT?: number;

  @IsString()
  @Matches(/^mongodb(\+srv)?:\/\/\S+$/)
  MONGODB_URI!: string;

  @IsString()
  @MinLength(32)
  @Matches(/^\S+$/)
  @NotEquals(JWT_SECRET_PLACEHOLDER)
  JWT_SECRET!: string;

  @IsOptional()
  @Transform(toInteger)
  @IsInt()
  @Min(1)
  JWT_TTL_SECONDS?: number;

  @IsNotEmpty()
  @IsOrigin()
  WEB_ORIGIN!: string;

  @IsOptional()
  @Transform(toBoolean)
  @IsBoolean()
  COOKIE_SECURE?: boolean;

  @IsOptional()
  @Transform(toInteger)
  @IsInt()
  @Min(0)
  TRUST_PROXY_HOPS?: number;

  @IsOptional()
  @Transform(toInteger)
  @IsInt()
  @Min(1)
  THROTTLE_AUTH_LIMIT?: number;

  @IsOptional()
  @Transform(toInteger)
  @IsInt()
  @Min(1)
  THROTTLE_AUTH_TTL_SECONDS?: number;

  @IsOptional()
  @IsIn(LOG_LEVELS)
  LOG_LEVEL?: LogLevel;
}
