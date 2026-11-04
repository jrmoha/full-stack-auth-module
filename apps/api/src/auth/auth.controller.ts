import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import type { PublicUser } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { setAuthCookie } from './cookie.js';
import { SignupDto } from './dto/signup.dto.js';

/** HTTP only: validated DTO in, service call, cookie and `{ user }` out (architecture §3). */
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ user: PublicUser }> {
    const { user, token } = await this.auth.signup(dto);
    setAuthCookie(res, token, this.auth.cookieConfig);
    return { user };
  }
}
