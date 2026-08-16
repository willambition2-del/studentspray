import {
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { PaginationQueryDto, pageArgs, paginated } from '../common/dto/pagination-query.dto';
import {
  ChatMessageType,
  ConversationType,
  NotificationType,
  Prisma,
} from '../generated/prisma/client';
import { SendMessageDto } from './dto/chat.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
  ) {}

  // 1. Ensure / Synchronize conversations based on business roles
  async syncUserConversations(user: AuthenticatedUser) {
    const roles = user.roles.map((r) => r.name);
    const isStaff = roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER', 'TECHNICAL_SUPERVISOR', 'TEACHER'].includes(r),
    );

    // A. Staff Group for forum
    if (isStaff) {
      let staffConv = await this.prisma.conversation.findFirst({
        where: { forumId: user.forumId, type: ConversationType.STAFF, deletedAt: null },
      });
      if (!staffConv) {
        staffConv = await this.prisma.conversation.create({
          data: {
            forumId: user.forumId,
            type: ConversationType.STAFF,
            title: 'مجموعة الطاقم التعليمي والإداري',
          },
        });
      }
      await this.prisma.conversationMember.upsert({
        where: {
          conversationId_userId: { conversationId: staffConv.id, userId: user.id },
        },
        update: { isActive: true },
        create: {
          conversationId: staffConv.id,
          userId: user.id,
          role: roles[0] || 'STAFF',
        },
      });
    }

    // B. Teacher Halaqa Groups
    if (roles.includes('TEACHER')) {
      const teacherProfile = await this.prisma.teacherProfile.findUnique({
        where: { userId: user.id },
      });
      if (teacherProfile) {
        const assignments = await this.prisma.halaqaTeacher.findMany({
          where: { teacherId: teacherProfile.id, isActive: true },
          include: { halaqa: true },
        });
        for (const assign of assignments) {
          if (!assign.halaqa || assign.halaqa.deletedAt) continue;
          let halaqaConv = await this.prisma.conversation.findFirst({
            where: {
              forumId: user.forumId,
              type: ConversationType.HALAQA,
              halaqaId: assign.halaqaId,
              deletedAt: null,
            },
          });
          if (!halaqaConv) {
            halaqaConv = await this.prisma.conversation.create({
              data: {
                forumId: user.forumId,
                type: ConversationType.HALAQA,
                halaqaId: assign.halaqaId,
                title: `مجموعة ${assign.halaqa.name}`,
              },
            });
          }
          await this.prisma.conversationMember.upsert({
            where: {
              conversationId_userId: { conversationId: halaqaConv.id, userId: user.id },
            },
            update: { isActive: true },
            create: {
              conversationId: halaqaConv.id,
              userId: user.id,
              role: 'TEACHER',
            },
          });
        }
      }
    }

    // C. Student Halaqa Group
    if (roles.includes('STUDENT')) {
      const studentProfile = await this.prisma.studentProfile.findUnique({
        where: { userId: user.id },
      });
      if (studentProfile) {
        const memberships = await this.prisma.halaqaMember.findMany({
          where: { studentId: studentProfile.id, isActive: true },
          include: { halaqa: true },
        });
        for (const mem of memberships) {
          if (!mem.halaqa || mem.halaqa.deletedAt) continue;
          let halaqaConv = await this.prisma.conversation.findFirst({
            where: {
              forumId: user.forumId,
              type: ConversationType.HALAQA,
              halaqaId: mem.halaqaId,
              deletedAt: null,
            },
          });
          if (!halaqaConv) {
            halaqaConv = await this.prisma.conversation.create({
              data: {
                forumId: user.forumId,
                type: ConversationType.HALAQA,
                halaqaId: mem.halaqaId,
                title: `مجموعة ${mem.halaqa.name}`,
              },
            });
          }
          await this.prisma.conversationMember.upsert({
            where: {
              conversationId_userId: { conversationId: halaqaConv.id, userId: user.id },
            },
            update: { isActive: true },
            create: {
              conversationId: halaqaConv.id,
              userId: user.id,
              role: 'STUDENT',
            },
          });
        }
      }
    }

    // D. Parent Channels
    if (roles.includes('PARENT')) {
      const parentProfile = await this.prisma.parentProfile.findUnique({
        where: { userId: user.id },
      });
      if (parentProfile) {
        const guardians = await this.prisma.studentGuardian.findMany({
          where: { parentId: parentProfile.id, receivesAcademicReports: true },
          include: {
            student: {
              include: {
                user: true,
                halaqaMemberships: {
                  where: { isActive: true },
                  include: {
                    halaqa: {
                      include: {
                        teachers: {
                          where: { isActive: true },
                          include: { teacher: { include: { user: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        for (const g of guardians) {
          const student = g.student;
          if (!student || student.deletedAt) continue;
          const studentName = student.user?.displayName || student.user?.username || 'الطالب';

          let parentConv = await this.prisma.conversation.findFirst({
            where: {
              forumId: user.forumId,
              type: ConversationType.PARENT_STUDENT_CHANNEL,
              studentId: student.id,
              deletedAt: null,
            },
          });
          if (!parentConv) {
            parentConv = await this.prisma.conversation.create({
              data: {
                forumId: user.forumId,
                type: ConversationType.PARENT_STUDENT_CHANNEL,
                studentId: student.id,
                title: `قناة التواصل: ${studentName}`,
              },
            });
          }

          // Add parent
          await this.prisma.conversationMember.upsert({
            where: {
              conversationId_userId: { conversationId: parentConv.id, userId: user.id },
            },
            update: { isActive: true },
            create: {
              conversationId: parentConv.id,
              userId: user.id,
              role: 'PARENT',
            },
          });

          // Add current halaqa teachers to child's channel
          for (const mem of student.halaqaMemberships) {
            for (const ht of mem.halaqa.teachers) {
              if (ht.teacher?.user?.id) {
                await this.prisma.conversationMember.upsert({
                  where: {
                    conversationId_userId: {
                      conversationId: parentConv.id,
                      userId: ht.teacher.user.id,
                    },
                  },
                  update: { isActive: true },
                  create: {
                    conversationId: parentConv.id,
                    userId: ht.teacher.user.id,
                    role: 'TEACHER',
                  },
                });
              }
            }
          }
        }
      }
    }
  }

  // 2. List user conversations with last message and unread count
  async getUserConversations(user: AuthenticatedUser) {
    await this.syncUserConversations(user);

    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId: user.id, isActive: true },
      include: {
        conversation: {
          include: {
            halaqa: { select: { id: true, name: true, code: true } },
            student: {
              select: {
                id: true,
                user: { select: { displayName: true, username: true } },
              },
            },
            messages: {
              where: { deletedAt: null },
              take: 1,
              orderBy: { createdAt: 'desc' },
              include: {
                sender: { select: { id: true, displayName: true, username: true } },
              },
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    const result = await Promise.all(
      memberships.map(async (m) => {
        const conv = m.conversation;
        const lastMsg = conv.messages[0] || null;

        // Calculate unread count
        const unreadCount = await this.prisma.chatMessage.count({
          where: {
            conversationId: conv.id,
            deletedAt: null,
            senderId: { not: user.id },
            ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
          },
        });

        let title = conv.title || 'محادثة';
        if (conv.type === ConversationType.HALAQA && conv.halaqa) {
          title = `حلقة ${conv.halaqa.name}`;
        } else if (conv.type === ConversationType.PARENT_STUDENT_CHANNEL && conv.student) {
          const sName = conv.student.user?.displayName || conv.student.user?.username || '';
          title = `تواصل: ${sName}`;
        } else if (conv.type === ConversationType.STAFF) {
          title = 'مجموعة الطاقم التعليمي والإداري';
        }

        return {
          id: conv.id,
          type: conv.type,
          title,
          halaqaId: conv.halaqaId,
          studentId: conv.studentId,
          lastMessage: lastMsg
            ? {
                id: lastMsg.id,
                text: lastMsg.text,
                senderId: lastMsg.senderId,
                senderName: lastMsg.sender?.displayName || lastMsg.sender?.username || 'مستخدم',
                createdAt: lastMsg.createdAt,
              }
            : null,
          unreadCount,
          lastReadAt: m.lastReadAt,
          updatedAt: conv.updatedAt,
        };
      }),
    );

    return result;
  }

  // 3. Get messages for conversation (with membership authorization)
  async getConversationMessages(
    user: AuthenticatedUser,
    conversationId: string,
    query: PaginationQueryDto,
  ) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('You are not an authorized member of this conversation');
    }

    const where: Prisma.ChatMessageWhereInput = {
      conversationId,
      deletedAt: null,
    };

    const [items, total] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where,
        ...pageArgs(query),
        orderBy: { createdAt: 'desc' },
        include: {
          sender: { select: { id: true, displayName: true, username: true } },
        },
      }),
      this.prisma.chatMessage.count({ where }),
    ]);

    const mapped = items.map((msg) => ({
      id: msg.id,
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderName: msg.sender?.displayName || msg.sender?.username || 'مستخدم',
      isMe: msg.senderId === user.id,
      clientMessageId: msg.clientMessageId,
      type: msg.type,
      text: msg.text,
      createdAt: msg.createdAt,
    }));

    return paginated(mapped, total, query);
  }

  // 4. Send Message (Idempotent & Persist before emit)
  async sendMessage(user: AuthenticatedUser, conversationId: string, dto: SendMessageDto) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
      include: { conversation: true },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('You are not authorized to send messages in this conversation');
    }

    // Idempotency check via clientMessageId
    if (dto.clientMessageId) {
      const existing = await this.prisma.chatMessage.findUnique({
        where: { clientMessageId: dto.clientMessageId },
        include: {
          sender: { select: { id: true, displayName: true, username: true } },
        },
      });
      if (existing) {
        return {
          id: existing.id,
          conversationId: existing.conversationId,
          senderId: existing.senderId,
          senderName: existing.sender?.displayName || existing.sender?.username || 'مستخدم',
          isMe: true,
          clientMessageId: existing.clientMessageId,
          type: existing.type,
          text: existing.text,
          createdAt: existing.createdAt,
        };
      }
    }

    // Persist in PostgreSQL BEFORE emit
    const created = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: user.id,
        clientMessageId: dto.clientMessageId,
        type: ChatMessageType.TEXT,
        text: dto.text.trim(),
      },
      include: {
        sender: { select: { id: true, displayName: true, username: true } },
      },
    });

    // Update conversation and member timestamps
    await Promise.all([
      this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      }),
      this.prisma.conversationMember.update({
        where: { id: member.id },
        data: { lastReadMessageId: created.id, lastReadAt: created.createdAt },
      }),
    ]);

    // Send push notification to other active members
    this.notifyConversationMembers(conversationId, user, created).catch(() => {});

    return {
      id: created.id,
      conversationId: created.conversationId,
      senderId: created.senderId,
      senderName: created.sender?.displayName || created.sender?.username || 'مستخدم',
      isMe: true,
      clientMessageId: created.clientMessageId,
      type: created.type,
      text: created.text,
      createdAt: created.createdAt,
    };
  }

  // 5. Mark Conversation as Read
  async markRead(user: AuthenticatedUser, conversationId: string, messageId?: string) {
    const member = await this.prisma.conversationMember.findUnique({
      where: {
        conversationId_userId: { conversationId, userId: user.id },
      },
    });

    if (!member || !member.isActive) {
      throw new ForbiddenException('Not a member of this conversation');
    }

    await this.prisma.conversationMember.update({
      where: { id: member.id },
      data: {
        lastReadMessageId: messageId ?? member.lastReadMessageId,
        lastReadAt: new Date(),
      },
    });

    return { success: true };
  }

  // 6. Total Unread Across All Chats
  async getTotalUnreadCount(user: AuthenticatedUser) {
    const memberships = await this.prisma.conversationMember.findMany({
      where: { userId: user.id, isActive: true },
    });

    let totalUnread = 0;
    for (const m of memberships) {
      const count = await this.prisma.chatMessage.count({
        where: {
          conversationId: m.conversationId,
          deletedAt: null,
          senderId: { not: user.id },
          ...(m.lastReadAt ? { createdAt: { gt: m.lastReadAt } } : {}),
        },
      });
      totalUnread += count;
    }

    return { unreadCount: totalUnread };
  }

  // Helper: notify conversation members of new message
  private async notifyConversationMembers(
    conversationId: string,
    sender: AuthenticatedUser,
    message: { id: string; text: string },
  ) {
    try {
      const otherMembers = await this.prisma.conversationMember.findMany({
        where: {
          conversationId,
          userId: { not: sender.id },
          isActive: true,
        },
        select: { userId: true },
      });

      if (otherMembers.length === 0) return;

      const conv = await this.prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { title: true, type: true },
      });

      const senderName = sender.username || 'عضو';
      const convTitle = conv?.title || 'محادثة';

      await this.notifications.notifyUsers({
        userIds: otherMembers.map((m) => m.userId),
        type: NotificationType.NEW_MESSAGE,
        title: `رسالة جديدة في (${convTitle})`,
        body: `${senderName}: ${message.text.substring(0, 100)}`,
        data: {
          type: 'NEW_MESSAGE',
          conversationId,
          messageId: message.id,
        },
      });
    } catch {
      // Non-blocking
    }
  }
}
