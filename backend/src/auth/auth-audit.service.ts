import { Inject, Injectable } from '@nestjs/common';
import type { Prisma, SecurityAuditEvent } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';

export type SecurityEventContext = {
  actorUserId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  requestId?: string | null;
  metadata?: Prisma.InputJsonValue;
};

@Injectable()
export class AuthAuditService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async record(event: SecurityAuditEvent, success: boolean, context: SecurityEventContext): Promise<void> {
    await this.prisma.securityAuditLog.create({
      data: {
        event,
        success,
        actorUserId: context.actorUserId,
        ipAddress: context.ipAddress?.slice(0, 45),
        userAgent: context.userAgent?.slice(0, 512),
        requestId: context.requestId?.slice(0, 128),
        metadata: context.metadata,
      },
    });
  }
}
