import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';

@ApiTags('Notifications & Push Tokens')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Post('devices')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register or update FCM device token for current user' })
  async registerDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    return this.service.registerDeviceToken(user.id, dto);
  }

  @Delete('devices/:token')
  @ApiOperation({ summary: 'Deactivate FCM device token on logout' })
  async unregisterDevice(
    @CurrentUser() user: AuthenticatedUser,
    @Param('token') token: string,
  ) {
    return this.service.unregisterDeviceToken(user.id, token);
  }

  @Get()
  @ApiOperation({ summary: 'Get current user notifications list' })
  async getNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: NotificationQueryDto,
  ) {
    return this.service.getUserNotifications(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count for current user' })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getUnreadCount(user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark single notification as read' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.markAsRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark all notifications as read for current user' })
  async markAllRead(@CurrentUser() user: AuthenticatedUser) {
    return this.service.markAllAsRead(user.id);
  }
}
