import { Body, Controller, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithId } from '../common/types/request-with-id';
import { AuthService } from './auth.service';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { authContext } from './http-auth-context';

@ApiTags('Authentication — Mobile')
@Public()
@Controller('auth/mobile')
export class MobileAuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a mobile session; store the returned refresh token only in secure storage' })
  login(@Body() dto: LoginDto, @Req() request: RequestWithId) {
    return this.auth.login(dto, 'MOBILE', authContext(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(@Body() dto: RefreshDto, @Req() request: RequestWithId) {
    return this.auth.refresh(dto.refreshToken, 'MOBILE', authContext(request));
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Body() dto: RefreshDto, @Req() request: RequestWithId): Promise<void> {
    await this.auth.logout(dto.refreshToken, 'MOBILE', authContext(request));
  }
}
