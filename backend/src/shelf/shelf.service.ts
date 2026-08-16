import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';
import {
  NotificationType,
  Prisma,
  ShelfContentType,
  ShelfVisibility,
} from '../generated/prisma/client';
import {
  CreateShelfItemDto,
  CreateShelfSectionDto,
  SetPublisherRuleDto,
  ShelfItemQueryDto,
  UpdateShelfItemDto,
  UpdateShelfSectionDto,
} from './dto/shelf.dto';

interface ShelfItemSummary {
  id: string;
  title: string;
  content: string;
}

@Injectable()
export class ShelfService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(NotificationsService) private readonly notifications: NotificationsService,
    @Inject(AuditService) private readonly audit: AuditService,
  ) {}

  private getAllowedVisibilities(user: AuthenticatedUser): ShelfVisibility[] {
    const roles = user.roles.map((r) => r.name);
    if (roles.includes('GENERAL_MANAGER') || roles.includes('EXECUTIVE_MANAGER')) {
      return [
        ShelfVisibility.ALL_USERS,
        ShelfVisibility.STAFF_ONLY,
        ShelfVisibility.TEACHERS_ONLY,
        ShelfVisibility.STUDENTS_ONLY,
        ShelfVisibility.PARENTS_ONLY,
      ];
    }
    if (roles.includes('TEACHER')) {
      return [
        ShelfVisibility.ALL_USERS,
        ShelfVisibility.STAFF_ONLY,
        ShelfVisibility.TEACHERS_ONLY,
      ];
    }
    if (roles.includes('TECHNICAL_SUPERVISOR')) {
      return [ShelfVisibility.ALL_USERS, ShelfVisibility.STAFF_ONLY];
    }
    if (roles.includes('PARENT')) {
      return [ShelfVisibility.ALL_USERS, ShelfVisibility.PARENTS_ONLY];
    }
    if (roles.includes('STUDENT')) {
      return [ShelfVisibility.ALL_USERS, ShelfVisibility.STUDENTS_ONLY];
    }
    return [ShelfVisibility.ALL_USERS];
  }

  // 1. Create Shelf Section
  async createSection(user: AuthenticatedUser, dto: CreateShelfSectionDto) {
    const existing = await this.prisma.shelfSection.findUnique({
      where: {
        forumId_slug: {
          forumId: user.forumId,
          slug: dto.slug.trim().toLowerCase(),
        },
      },
    });
    if (existing) throw new BadRequestException('A section with this slug already exists');

    const section = await this.prisma.shelfSection.create({
      data: {
        forumId: user.forumId,
        name: dto.name.trim(),
        slug: dto.slug.trim().toLowerCase(),
        description: dto.description?.trim(),
        order: dto.order ?? 0,
        visibility: dto.visibility ?? ShelfVisibility.ALL_USERS,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'SHELF_SECTION_CREATED',
      entityType: 'ShelfSection',
      entityId: section.id,
      after: section as unknown as Record<string, unknown>,
    });

    return section;
  }

  // 2. Get Sections (filtered by visibility)
  async getSections(user: AuthenticatedUser) {
    const allowedVisibilities = this.getAllowedVisibilities(user);
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );

    return this.prisma.shelfSection.findMany({
      where: {
        forumId: user.forumId,
        deletedAt: null,
        ...(isManager ? {} : { isActive: true, visibility: { in: allowedVisibilities } }),
      },
      orderBy: { order: 'asc' },
      include: {
        _count: { select: { items: { where: { deletedAt: null, isPublished: true } } } },
        publisherRules: {
          include: {
            role: { select: { id: true, name: true, displayName: true } },
            user: { select: { id: true, displayName: true, username: true } },
          },
        },
      },
    });
  }

  // 3. Update Section
  async updateSection(user: AuthenticatedUser, id: string, dto: UpdateShelfSectionDto) {
    const existing = await this.prisma.shelfSection.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Section not found');

    const updated = await this.prisma.shelfSection.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        slug: dto.slug?.trim().toLowerCase(),
        description: dto.description?.trim(),
        order: dto.order,
        isActive: dto.isActive,
        visibility: dto.visibility,
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'SHELF_SECTION_UPDATED',
      entityType: 'ShelfSection',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  // 4. Set / Update Publisher Rule for Section
  async setPublisherRule(user: AuthenticatedUser, dto: SetPublisherRuleDto) {
    const section = await this.prisma.shelfSection.findFirst({
      where: { id: dto.sectionId, forumId: user.forumId, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Shelf section not found');

    if (!dto.roleId && !dto.userId) {
      throw new BadRequestException('Either roleId or userId must be specified for publisher rule');
    }

    const rule = await this.prisma.shelfPublisherRule.upsert({
      where: {
        sectionId_roleId_userId: {
          sectionId: dto.sectionId,
          roleId: dto.roleId ?? '',
          userId: dto.userId ?? '',
        },
      },
      create: {
        sectionId: dto.sectionId,
        roleId: dto.roleId,
        userId: dto.userId,
        canCreate: dto.canCreate ?? true,
        canPublish: dto.canPublish ?? true,
      },
      update: {
        canCreate: dto.canCreate ?? true,
        canPublish: dto.canPublish ?? true,
      },
      include: {
        role: { select: { id: true, name: true, displayName: true } },
        user: { select: { id: true, displayName: true, username: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'SHELF_PUBLISHER_PERMISSION_UPDATED',
      entityType: 'ShelfPublisherRule',
      entityId: rule.id,
      after: rule as unknown as Record<string, unknown>,
    });

    return rule;
  }

  // 5. Delete Publisher Rule
  async removePublisherRule(user: AuthenticatedUser, ruleId: string) {
    const rule = await this.prisma.shelfPublisherRule.findFirst({
      where: { id: ruleId, section: { forumId: user.forumId } },
    });
    if (!rule) throw new NotFoundException('Publisher rule not found');

    await this.prisma.shelfPublisherRule.delete({ where: { id: ruleId } });
    return { success: true };
  }

  // 6. Check if user has permission to publish in a section
  async canUserPublish(user: AuthenticatedUser, sectionId: string): Promise<boolean> {
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    if (isManager) return true;

    // Check user-specific rule
    const userRule = await this.prisma.shelfPublisherRule.findFirst({
      where: { sectionId, userId: user.id, canPublish: true },
    });
    if (userRule) return true;

    // Check role-specific rule
    const roleIds = user.roles.map((r) => r.id);
    const roleRule = await this.prisma.shelfPublisherRule.findFirst({
      where: { sectionId, roleId: { in: roleIds }, canPublish: true },
    });
    if (roleRule) return true;

    return false;
  }

  // 7. Create Shelf Item (Post)
  async createItem(user: AuthenticatedUser, dto: CreateShelfItemDto) {
    const section = await this.prisma.shelfSection.findFirst({
      where: { id: dto.sectionId, forumId: user.forumId, deletedAt: null },
    });
    if (!section) throw new NotFoundException('Shelf section not found');

    // Authorize publishing in this section
    const allowed = await this.canUserPublish(user, dto.sectionId);
    if (!allowed) {
      throw new ForbiddenException('You do not have publishing permission in this shelf section');
    }

    const item = await this.prisma.shelfItem.create({
      data: {
        forumId: user.forumId,
        sectionId: dto.sectionId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        type: dto.type ?? ShelfContentType.GENERAL,
        attachmentName: dto.attachmentName?.trim(),
        attachmentUrl: dto.attachmentUrl?.trim(),
        fileType: dto.fileType?.trim(),
        fileSize: dto.fileSize?.trim(),
        isPinned: dto.isPinned ?? false,
        isPublished: dto.isPublished ?? true,
        publishedAt: dto.isPublished !== false ? new Date() : null,
        targetAudience: dto.targetAudience ?? section.visibility,
        authorId: user.id,
        authorName: user.username,
        authorRole: user.roles[0]?.name || 'STAFF',
      },
      include: {
        section: { select: { id: true, name: true, slug: true } },
      },
    });

    // If announcement or important pinned post, notify forum members
    if (item.isPublished && (item.type === ShelfContentType.ANNOUNCEMENT || item.isPinned)) {
      await this.notifyShelfItemPublished(user.forumId, item);
    }

    await this.audit.record({
      actorUserId: user.id,
      action: 'SHELF_ITEM_CREATED',
      entityType: 'ShelfItem',
      entityId: item.id,
      after: item as unknown as Record<string, unknown>,
    });

    return item;
  }

  // 8. Find Items (with visibility and section filtering)
  async findAllItems(user: AuthenticatedUser, query: ShelfItemQueryDto) {
    const allowedVisibilities = this.getAllowedVisibilities(user);
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );

    const where: Prisma.ShelfItemWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
      ...(isManager
        ? {}
        : {
            isPublished: true,
            targetAudience: { in: allowedVisibilities },
            section: { isActive: true, visibility: { in: allowedVisibilities }, deletedAt: null },
          }),
    };

    if (query.sectionId) where.sectionId = query.sectionId;
    if (query.type) where.type = query.type;
    if (query.isPinned !== undefined) where.isPinned = query.isPinned;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search.trim(), mode: 'insensitive' } },
        { content: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    const { skip, take } = pageArgs(query);

    const [total, items] = await Promise.all([
      this.prisma.shelfItem.count({ where }),
      this.prisma.shelfItem.findMany({
        where,
        skip,
        take,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
        include: {
          section: { select: { id: true, name: true, slug: true } },
          author: { select: { id: true, displayName: true, username: true } },
        },
      }),
    ]);

    return paginated(items, total, query);
  }

  // 9. Find One Item
  async findOneItem(user: AuthenticatedUser, id: string) {
    const allowedVisibilities = this.getAllowedVisibilities(user);
    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );

    const item = await this.prisma.shelfItem.findFirst({
      where: {
        id,
        forumId: user.forumId,
        deletedAt: null,
        ...(isManager ? {} : { isPublished: true, targetAudience: { in: allowedVisibilities } }),
      },
      include: {
        section: { select: { id: true, name: true, slug: true } },
        author: { select: { id: true, displayName: true, username: true } },
      },
    });

    if (!item) throw new NotFoundException('Shelf item not found');
    return item;
  }

  // 10. Update Item
  async updateItem(user: AuthenticatedUser, id: string, dto: UpdateShelfItemDto) {
    const existing = await this.prisma.shelfItem.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Shelf item not found');

    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    if (!isManager && existing.authorId !== user.id) {
      throw new ForbiddenException('Cannot edit an item created by another author');
    }

    const updated = await this.prisma.shelfItem.update({
      where: { id },
      data: {
        title: dto.title?.trim(),
        content: dto.content?.trim(),
        type: dto.type,
        attachmentName: dto.attachmentName?.trim(),
        attachmentUrl: dto.attachmentUrl?.trim(),
        fileType: dto.fileType?.trim(),
        fileSize: dto.fileSize?.trim(),
        isPinned: dto.isPinned,
        isPublished: dto.isPublished,
        publishedAt: dto.isPublished === true && !existing.publishedAt ? new Date() : undefined,
        targetAudience: dto.targetAudience,
      },
      include: {
        section: { select: { id: true, name: true, slug: true } },
      },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'SHELF_ITEM_UPDATED',
      entityType: 'ShelfItem',
      entityId: id,
      before: existing as unknown as Record<string, unknown>,
      after: updated as unknown as Record<string, unknown>,
    });

    return updated;
  }

  // 11. Soft Delete Item
  async deleteItem(user: AuthenticatedUser, id: string) {
    const existing = await this.prisma.shelfItem.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Shelf item not found');

    const isManager = user.roles.some((r) =>
      ['GENERAL_MANAGER', 'EXECUTIVE_MANAGER'].includes(r.name),
    );
    if (!isManager && existing.authorId !== user.id) {
      throw new ForbiddenException('Cannot delete an item created by another author');
    }

    await this.prisma.shelfItem.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'SHELF_ITEM_ARCHIVED',
      entityType: 'ShelfItem',
      entityId: id,
    });

    return { success: true };
  }

  // Helper: Notification Dispatch
  private async notifyShelfItemPublished(forumId: string, item: ShelfItemSummary) {
    try {
      const users = await this.prisma.user.findMany({
        where: { forumId, isActive: true, deletedAt: null },
        select: { id: true },
        take: 100,
      });

      const userIds = users.map((u) => u.id);
      if (userIds.length > 0) {
        await this.notifications.notifyUsers({
          userIds,
          type: NotificationType.SYSTEM,
          title: `إعلان جديد في الرف العام: ${item.title}`,
          body: item.content.slice(0, 120),
          data: { shelfItemId: item.id, type: 'SHELF_ITEM' },
        });
      }
    } catch {
      // Soft-fail notification dispatch
    }
  }
}
