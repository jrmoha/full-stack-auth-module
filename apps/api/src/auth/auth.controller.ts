import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiServiceUnavailableResponse,
  ApiTags,
  ApiTooManyRequestsResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { ErrorResponseDto } from '../common/docs/error-response.dto.js';
import { ClientIpThrottlerGuard } from '../common/throttle/client-ip-throttler.guard.js';
import type { PublicUser } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { clearAuthCookie, setAuthCookie } from './cookie.js';
import { SigninDto } from './dto/signin.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { SignupDto } from './dto/signup.dto.js';

const SESSION_COOKIE =
  'Sets the httpOnly `access_token` cookie (HS256 JWT, SameSite=Lax, Path=/). Never in the body.';
const RATE_LIMIT =
  'Rate limited per client IP (THROTTLE_AUTH_LIMIT per THROTTLE_AUTH_TTL_SECONDS, 10 per 60 s by default); past that 429 with Retry-After.';
/** Only routes that query the database can return 503; logout cannot. */
const DB_DOWN = {
  type: ErrorResponseDto,
  description: 'SERVICE_UNAVAILABLE (database unreachable)',
};

@ApiTags('auth')
@ApiInternalServerErrorResponse({ type: ErrorResponseDto, description: 'INTERNAL_ERROR' })
/** HTTP only: validated DTO in, service call, cookie and `{ user }` out (architecture §3). */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create an account and start a session',
    description: `${SESSION_COOKIE} ${RATE_LIMIT}`,
  })
  @ApiBody({ type: SignupDto })
  @ApiCreatedResponse({ type: UserResponseDto, description: 'Account created; session cookie set' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'VALIDATION_FAILED with fieldErrors (§4 messages)',
  })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'EMAIL_TAKEN with fieldErrors.email',
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'RATE_LIMITED; Retry-After in seconds',
  })
  @ApiServiceUnavailableResponse(DB_DOWN)
  @UseGuards(ClientIpThrottlerGuard)
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, token } = await this.auth.signup(dto);
    setAuthCookie(res, token, this.auth.cookieConfig);
    return { user };
  }

  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Sign in and start a session',
    description: `${SESSION_COOKIE} ${RATE_LIMIT}`,
  })
  @ApiBody({ type: SigninDto })
  @ApiOkResponse({ type: UserResponseDto, description: 'Signed in; session cookie set' })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: 'VALIDATION_FAILED with fieldErrors (§4 messages)',
  })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description: 'INVALID_CREDENTIALS, identical for unknown email and wrong password',
  })
  @ApiTooManyRequestsResponse({
    type: ErrorResponseDto,
    description: 'RATE_LIMITED; Retry-After in seconds',
  })
  @ApiServiceUnavailableResponse(DB_DOWN)
  @UseGuards(ClientIpThrottlerGuard)
  async signin(
    @Body() dto: SigninDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, token } = await this.auth.signin(dto);
    setAuthCookie(res, token, this.auth.cookieConfig);
    return { user };
  }

  /** The session check the web app runs server-side on every protected render (architecture §6). */
  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'The signed-in user',
    description: 'Reads only the `access_token` cookie. Not rate limited.',
  })
  @ApiCookieAuth('session')
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({
    type: ErrorResponseDto,
    description:
      'UNAUTHENTICATED: missing, malformed, expired or bad-signature token, or the user no longer exists',
  })
  @ApiServiceUnavailableResponse(DB_DOWN)
  me(@Req() req: Request & { user: PublicUser }): { user: PublicUser } {
    return { user: req.user };
  }

  /**
   * Anonymous and idempotent: clears the cookie whether or not one was sent (architecture §5). The token itself
   * stays valid until it expires (no revocation, see the session ADR).
   */
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'End the session',
    description:
      'Anonymous and idempotent: clears the cookie (Max-Age 0) with or without one. Not rate limited.',
  })
  @ApiNoContentResponse({ description: 'Cookie cleared' })
  logout(@Res({ passthrough: true }) res: Response): void {
    clearAuthCookie(res, this.auth.cookieConfig);
  }
}
