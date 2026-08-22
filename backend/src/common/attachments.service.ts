import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';

export interface AttachmentRecord {
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedById: string;
  forumId: string;
  createdAt: Date;
}

@Injectable()
export class AttachmentsService {
  private readonly registry = new Map<string, AttachmentRecord>();

  constructor(private readonly prisma: PrismaService) {}

  registerUpload(record: AttachmentRecord): void {
    this.registry.set(record.filename, record);
  }

  getRecord(filename: string): AttachmentRecord | undefined {
    return this.registry.get(filename);
  }

  /**
   * Verifies that the requesting user has authorization to access the specific attachment.
   * Checks:
   * 1. Forum isolation (must belong to same forum)
   * 2. Direct uploader access
   * 3. General manager / admin role access
   * 4. Chat conversation membership access
   * 5. Parent request access (owner parent or assigned teacher/manager)
   * 6. Teacher administrative request access (owner teacher or admin)
   */
  async authorizeAttachmentAccess(filename: string, user: AuthenticatedUser): Promise<void> {
    const record = this.registry.get(filename);

    // 1. Forum Isolation check
    if (record && record.forumId !== user.forumId) {
      throw new ForbiddenException('غير مسموح بالوصول لمرفقات منتدى آخر (Cross-Forum Blocked)');
    }

    // 2. Direct Uploader Access
    if (record && record.uploadedById === user.id) {
      return;
    }

    // 3. System Managers Access within same forum
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER', 'SUPER_ADMIN'].includes(r.name),
    );
    if (isManager) {
      return;
    }

    // 4. Chat Conversation Membership Verification
    const message = await this.prisma.chatMessage.findFirst({
      where: {
        text: { contains: filename },
      },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
      },
    });

    if (message) {
      const membership = await this.prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: {
            conversationId: message.conversationId,
            userId: user.id,
          },
        },
      });

      if (!membership && message.senderId !== user.id) {
        throw new ForbiddenException('غير مسموح بتحميل مرفقات محادثة لست عضواً فيها (Cross-Conversation Blocked)');
      }
      return;
    }

    // 5. Administrative / Parent Request Ownership Verification
    const req = await this.prisma.administrativeRequest.findFirst({
      where: {
        forumId: user.forumId,
        description: { contains: filename },
      },
      select: {
        id: true,
        requestedById: true,
        type: true,
      },
    });

    if (req) {
      const isRequester = req.requestedById === user.id;
      const hasReqManage = user.permissions.includes('administrative.manage') || user.permissions.includes('admin_tasks.manage');
      if (!isRequester && !hasReqManage) {
        throw new ForbiddenException('غير مسموح بالوصول لمرفقات طلبات مستخدمين آخرين (Cross-Request Blocked)');
      }
      return;
    }

    // 6. If registered by another user with no shared context
    if (record && record.uploadedById !== user.id && !isManager) {
      throw new ForbiddenException('ليس لديك صلاحية الوصول لهذا المرفق (Resource Access Denied)');
    }
  }
}
