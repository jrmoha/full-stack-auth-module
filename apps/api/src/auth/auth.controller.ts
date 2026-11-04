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
import type { Request, Response } from 'express';
import type { PublicUser } from '../users/public-user.js';
import { AuthService } from './auth.service.js';
import { setAuthCookie } from './cookie.js';
import { SigninDto } from './dto/signin.dto.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
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

  @Post('signin')
  @HttpCode(HttpStatus.OK)
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
  me(@Req() req: Request & { user: PublicUser }): { user: PublicUser } {
    return { user: req.user };
  }
}
