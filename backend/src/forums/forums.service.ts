import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import type { AuthContext } from "../auth/types/auth-context";
import { AuditService } from "../audit/audit.service";
import { PrismaService } from "../database/prisma.service";
import type { UpdateForumDto } from "./dto/update-forum.dto";

@Injectable()
export class ForumsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async current(user: AuthenticatedUser) {
    const forum = await this.prisma.forum.findFirst({
      where: { id: user.forumId, deletedAt: null },
    });
    if (!forum)
      throw new NotFoundException({
        code: "FORUM_NOT_FOUND",
        message: "Forum not found",
      });
    return forum;
  }

  async update(
    user: AuthenticatedUser,
    dto: UpdateForumDto,
    context: AuthContext,
  ) {
    if (!user.roles.some((role) => role.name === "GENERAL_MANAGER")) {
      throw new ForbiddenException({
        code: "FORUM_MANAGEMENT_FORBIDDEN",
        message: "General manager access is required",
      });
    }
    return this.prisma.$transaction(async (tx) => {
      const before = await tx.forum.findFirst({
        where: { id: user.forumId, deletedAt: null },
      });
      if (!before)
        throw new NotFoundException({
          code: "FORUM_NOT_FOUND",
          message: "Forum not found",
        });
      const after = await tx.forum.update({
        where: { id: before.id },
        data: dto,
      });
      await this.audit.record(
        {
          ...context,
          actorUserId: user.id,
          action: "FORUM_UPDATED",
          entityType: "Forum",
          entityId: after.id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
}
