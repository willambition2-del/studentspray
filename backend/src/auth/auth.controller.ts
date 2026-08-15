import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RequestWithId } from '../common/types/request-with-id';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { ChangePasswordDto } from './dto/change-password.dto';
import { authContext } from './http-auth-context';
import type { AuthenticatedUser } from './types/authenticated-user';

@ApiTags('Authentication')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated user, roles, permissions, and basic scopes' })
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.auth.me(user);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @Req() request: RequestWithId,
  ): Promise<void> {
    await this.auth.changePassword(user, dto.currentPassword, dto.newPassword, authContext(request));
  }

  @Post('logout-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Revoke every session, including the current session' })
  async logoutAll(@CurrentUser() user: AuthenticatedUser, @Req() request: RequestWithId): Promise<void> {
    await this.auth.logoutAll(user, authContext(request));
  }
}
