import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { CookieOptions, Response } from 'express';
import type { RequestWithId } from '../common/types/request-with-id';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { WebOriginGuard } from './guards/web-origin.guard';
import { authContext, readCookie } from './http-auth-context';

@ApiTags('Authentication — Web')
@Public()
@Controller('auth/web')
export class WebAuthController {
  constructor(private readonly auth: AuthService, private readonly config: ConfigService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a web session and set its HttpOnly refresh cookie' })
  async login(@Body() dto: LoginDto, @Req() request: RequestWithId, @Res({ passthrough: true }) response: Response) {
    const result = await this.auth.login(dto, 'WEB', authContext(request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt };
  }

  @Post('refresh')
  @UseGuards(WebOriginGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotate the web refresh cookie and issue a new access token' })
  async refresh(@Req() request: RequestWithId, @Res({ passthrough: true }) response: Response) {
    const cookieName = this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
    const token = readCookie(request, cookieName);
    if (!token) return this.auth.refresh('', 'WEB', authContext(request));
    const result = await this.auth.refresh(token, 'WEB', authContext(request));
    this.setRefreshCookie(response, result.refreshToken, result.refreshTokenExpiresAt);
    return { accessToken: result.accessToken, accessTokenExpiresAt: result.accessTokenExpiresAt };
  }

  @Post('logout')
  @UseGuards(WebOriginGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204 })
  async logout(@Req() request: RequestWithId, @Res({ passthrough: true }) response: Response): Promise<void> {
    const cookieName = this.config.getOrThrow<string>('AUTH_COOKIE_NAME');
    await this.auth.logout(readCookie(request, cookieName), 'WEB', authContext(request));
    response.clearCookie(cookieName, this.cookieOptions());
  }

  private setRefreshCookie(response: Response, token: string, expires: Date): void {
    response.cookie(this.config.getOrThrow<string>('AUTH_COOKIE_NAME'), token, {
      ...this.cookieOptions(),
      expires,
    });
  }

  private cookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.getOrThrow<string>('NODE_ENV') === 'production',
      sameSite: this.config.getOrThrow<'strict' | 'lax' | 'none'>('AUTH_COOKIE_SAME_SITE'),
      path: '/api/v1/auth/web',
    };
  }
}
