import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { FcmService } from './fcm.service';
import { RegisterDeviceTokenDto } from './dto/device-token.dto';
import { NotificationQueryDto } from './dto/notification-query.dto';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';
import { DevicePlatform, NotificationType, Prisma } from '../generated/prisma/client';

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

export interface NotifyUsersParams {
  userIds: string[];
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(FcmService) private readonly fcmService: FcmService,
  ) {}

  // 1. Device Token Management
  async registerDeviceToken(userId: string, dto: RegisterDeviceTokenDto) {
    const platform = dto.platform ?? DevicePlatform.ANDROID;
    const tokenRecord = await this.prisma.deviceToken.upsert({
      where: { token: dto.token },
      update: {
        userId,
        platform,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
        isActive: true,
        lastSeenAt: new Date(),
      },
      create: {
        userId,
        token: dto.token,
        platform,
        deviceId: dto.deviceId,
        appVersion: dto.appVersion,
        isActive: true,
        lastSeenAt: new Date(),
      },
    });

    this.logger.debug(
      `Device token registered for user ${userId} [${platform}]`,
    );
    return { success: true, id: tokenRecord.id };
  }

  async unregisterDeviceToken(userId: string, token: string) {
    await this.prisma.deviceToken.updateMany({
      where: { token, userId },
      data: { isActive: false, updatedAt: new Date() },
    });
    return { success: true };
  }

  // 2. Notification Center APIs
  async getUserNotifications(userId: string, query: NotificationQueryDto) {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query.unreadOnly ? { readAt: null } : {}),
      ...(query.type ? { type: query.type } : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        ...pageArgs(query),
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, readAt: null },
    });
    return { unreadCount: count };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.readAt) {
      return this.prisma.notification.update({
        where: { id: notificationId },
        data: { readAt: new Date() },
      });
    }

    return notification;
  }

  async markAllAsRead(userId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true, count: result.count };
  }

  // 3. Central Notification Delivery
  async createNotification(params: CreateNotificationParams) {
    const { userId, type, title, body, data } = params;

    // Persist in database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
      },
    });

    // Send push notification to active device tokens
    const activeTokens = await this.prisma.deviceToken.findMany({
      where: { userId, isActive: true },
      select: { token: true },
    });

    if (activeTokens.length > 0) {
      const tokens = activeTokens.map((t) => t.token);
      const stringifiedData: Record<string, string> = {
        notificationId: notification.id,
        type,
      };
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined && v !== null) {
            stringifiedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
          }
        }
      }

      await this.fcmService.sendPush({
        tokens,
        title,
        body,
        data: stringifiedData,
      });
    }

    return notification;
  }

  async notifyUsers(params: NotifyUsersParams) {
    const { userIds, type, title, body, data } = params;
    if (!userIds || userIds.length === 0) return [];

    const uniqueUserIds = Array.from(new Set(userIds));

    // Batch create database records
    const createdList = await Promise.all(
      uniqueUserIds.map((uid) =>
        this.prisma.notification.create({
          data: {
            userId: uid,
            type,
            title,
            body,
            data: data ? (data as Prisma.InputJsonValue) : Prisma.JsonNull,
          },
        }),
      ),
    );

    // Collect device tokens for all target users
    const tokens = await this.prisma.deviceToken.findMany({
      where: { userId: { in: uniqueUserIds }, isActive: true },
      select: { token: true },
    });

    if (tokens.length > 0) {
      const stringifiedData: Record<string, string> = { type };
      if (data) {
        for (const [k, v] of Object.entries(data)) {
          if (v !== undefined && v !== null) {
            stringifiedData[k] = typeof v === 'string' ? v : JSON.stringify(v);
          }
        }
      }

      await this.fcmService.sendPush({
        tokens: tokens.map((t) => t.token),
        title,
        body,
        data: stringifiedData,
      });
    }

    return createdList;
  }
}
