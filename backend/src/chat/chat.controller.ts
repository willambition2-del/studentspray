import {
  Body,
  Controller,
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
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { ChatService } from './chat.service';
import { MarkReadDto, SendMessageDto } from './dto/chat.dto';

@ApiTags('Realtime Chat & Channels')
@ApiBearerAuth()
@Controller('chat')
export class ChatController {
  constructor(private readonly service: ChatService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'Get all authorized conversations for current user' })
  async getConversations(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getUserConversations(user);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'Get paginated message history for a conversation' })
  async getMessages(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Query() query: PaginationQueryDto,
  ) {
    return this.service.getConversationMessages(user, id, query);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({ summary: 'Send a message to a conversation via REST' })
  async sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.service.sendMessage(user, id, dto);
  }

  @Post('conversations/:id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark conversation messages as read' })
  async markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: MarkReadDto,
  ) {
    return this.service.markRead(user, id, dto.messageId);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get total unread message count across all conversations' })
  async getUnreadCount(@CurrentUser() user: AuthenticatedUser) {
    return this.service.getTotalUnreadCount(user);
  }
}
