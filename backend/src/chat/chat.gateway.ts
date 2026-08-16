import {
  Logger,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { TokenService } from '../auth/token.service';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../database/prisma.service';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: AuthenticatedUser;
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/chat',
})
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly tokens: TokenService,
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly chatService: ChatService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // 1. Extract Bearer token from auth payload, headers, or query
      const authObj = client.handshake.auth as Record<string, unknown> | undefined;
      const headersObj = client.handshake.headers as Record<string, unknown> | undefined;
      const queryObj = client.handshake.query as Record<string, unknown> | undefined;

      let token: unknown =
        authObj?.token ??
        headersObj?.authorization ??
        queryObj?.token;

      if (!token && typeof client.handshake.auth === 'string') {
        token = client.handshake.auth;
      }

      if (typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.slice(7).trim();
      }

      if (!token || typeof token !== 'string') {
        this.logger.warn(`[Socket.IO] Connection rejected: Missing token from client ${client.id}`);
        client.disconnect(true);
        return;
      }

      // 2. Verify Access Token & Session
      const payload = await this.tokens.verifyAccessToken(token);
      const user = await this.auth.validateAccessSession(payload.sub, payload.sid);

      // 3. Attach authenticated user to socket data
      client.data.user = user;
      this.logger.log(`[Socket.IO] Authenticated connection: User ${user.username} (${user.id}) socket=${client.id}`);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`[Socket.IO] Connection auth failed: ${errMsg} socket=${client.id}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    const user = client.data?.user;
    if (user) {
      this.logger.log(`[Socket.IO] User ${user.username} disconnected socket=${client.id}`);
    }
  }

  @SubscribeMessage('join_conversation')
  async handleJoinConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    if (!data?.conversationId) {
      return { error: 'conversationId is required' };
    }

    // Verify user is an active member
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: {
          conversationId: data.conversationId,
          userId: user.id,
        },
      },
    });

    if (!member || !member.isActive) {
      return { error: 'Forbidden: You are not a member of this conversation' };
    }

    const room = `conversation:${data.conversationId}`;
    await client.join(room);
    this.logger.debug(`User ${user.username} joined room ${room}`);
    return { success: true, conversationId: data.conversationId };
  }

  @SubscribeMessage('leave_conversation')
  async handleLeaveConversation(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string },
  ) {
    if (data?.conversationId) {
      const room = `conversation:${data.conversationId}`;
      await client.leave(room);
      return { success: true, conversationId: data.conversationId };
    }
    return { success: true };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; text: string; clientMessageId?: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    if (!data?.conversationId || !data?.text?.trim()) {
      return { error: 'conversationId and text are required' };
    }

    try {
      // 1. Persist in PostgreSQL FIRST
      const dto: SendMessageDto = {
        text: data.text,
        clientMessageId: data.clientMessageId,
      };
      const message = await this.chatService.sendMessage(user, data.conversationId, dto);

      // 2. Emit Socket.IO event to conversation room
      const room = `conversation:${data.conversationId}`;
      this.server.to(room).emit('chat:message', message);

      // 3. Ack to sender
      return { success: true, message };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { error: errMsg || 'Failed to send message' };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { conversationId: string; messageId?: string },
  ) {
    const user = client.data?.user;
    if (!user) {
      return { error: 'Unauthorized' };
    }

    if (!data?.conversationId) {
      return { error: 'conversationId is required' };
    }

    try {
      await this.chatService.markRead(user, data.conversationId, data.messageId);

      const room = `conversation:${data.conversationId}`;
      this.server.to(room).emit('chat:read', {
        userId: user.id,
        conversationId: data.conversationId,
        messageId: data.messageId,
      });

      return { success: true };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return { error: errMsg || 'Failed to mark as read' };
    }
  }
}
