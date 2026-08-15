import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";
import type { BusinessAuditInput } from "./audit.types";

type AuditWriter = Pick<PrismaService, "auditLog">;

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async record(
    input: BusinessAuditInput,
    writer: AuditWriter = this.prisma,
  ): Promise<void> {
    await writer.auditLog.create({
      data: {
        actorUserId: input.actorUserId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        before: input.before as never,
        after: input.after as never,
        metadata: input.metadata as never,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        requestId: input.requestId ?? null,
      },
    });
  }
}
