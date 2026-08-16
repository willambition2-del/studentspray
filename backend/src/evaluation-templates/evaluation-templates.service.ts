import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import {
  CreateEvaluationTemplateDto,
  EvaluationTemplateQueryDto,
  UpdateEvaluationTemplateDto,
} from './dto/evaluation-template.dto';

import { Prisma } from '../generated/prisma/client';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';

@Injectable()
export class EvaluationTemplatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, query: EvaluationTemplateQueryDto) {
    const where: Prisma.EvaluationTemplateWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
    };
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [items, total] = await Promise.all([
      this.prisma.evaluationTemplate.findMany({
        where,
        ...pageArgs(query),
        include: {
          axes: {
            where: { isActive: true },
            include: {
              criteria: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
          _count: { select: { evaluations: true } },
        },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.evaluationTemplate.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async getActiveTemplate(user: AuthenticatedUser) {
    let template = await this.prisma.evaluationTemplate.findFirst({
      where: {
        forumId: user.forumId,
        isActive: true,
        isDefault: true,
        deletedAt: null,
      },
      include: {
        axes: {
          where: { isActive: true },
          include: {
            criteria: {
              where: { isActive: true },
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!template) {
      template = await this.prisma.evaluationTemplate.findFirst({
        where: {
          forumId: user.forumId,
          isActive: true,
          deletedAt: null,
        },
        include: {
          axes: {
            where: { isActive: true },
            include: {
              criteria: {
                where: { isActive: true },
                orderBy: { order: 'asc' },
              },
            },
            orderBy: { order: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!template) {
      throw new NotFoundException('No active evaluation template found');
    }

    return template;
  }

  async getById(user: AuthenticatedUser, id: string) {
    const template = await this.prisma.evaluationTemplate.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        axes: {
          include: {
            criteria: {
              orderBy: { order: 'asc' },
            },
          },
          orderBy: { order: 'asc' },
        },
        _count: { select: { evaluations: true } },
      },
    });

    if (!template) {
      throw new NotFoundException('Evaluation template not found');
    }

    return template;
  }

  async create(
    user: AuthenticatedUser,
    dto: CreateEvaluationTemplateDto,
    context: AuthContext,
  ) {
    // Validate axis weights sum to ~100 if specified
    const totalWeight = dto.axes.reduce((sum, a) => sum + Number(a.weight), 0);
    if (Math.abs(totalWeight - 100) > 0.01 && dto.axes.length > 0) {
      throw new BadRequestException(`Sum of axis weights must equal 100%. Current sum: ${totalWeight}%`);
    }

    return await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.evaluationTemplate.updateMany({
          where: { forumId: user.forumId, isDefault: true },
          data: { isDefault: false },
        });
      }

      const template = await tx.evaluationTemplate.create({
        data: {
          forumId: user.forumId,
          name: dto.name,
          description: dto.description,
          isActive: dto.isActive ?? true,
          isDefault: dto.isDefault ?? false,
          version: 1,
          axes: {
            create: dto.axes.map((axis, aIdx) => ({
              name: axis.name,
              description: axis.description,
              weight: axis.weight,
              order: axis.order ?? aIdx,
              isActive: axis.isActive ?? true,
              criteria: {
                create: axis.criteria.map((c, cIdx) => ({
                  name: c.name,
                  description: c.description,
                  type: c.type ?? 'SCALE_5',
                  maxScore: c.maxScore ?? 5.0,
                  weight: c.weight,
                  isRequired: c.isRequired ?? true,
                  order: c.order ?? cIdx,
                  isActive: c.isActive ?? true,
                })),
              },
            })),
          },
        },
        include: {
          axes: {
            include: { criteria: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      });

      await this.audit.record(
        {
          actorUserId: user.id,
          action: 'EVALUATION_TEMPLATE_CREATED',
          entityType: 'EvaluationTemplate',
          entityId: template.id,
          after: { name: template.name, axesCount: template.axes.length },
          ...context,
        },
        tx,
      );

      return template;
    });
  }

  async update(
    user: AuthenticatedUser,
    id: string,
    dto: UpdateEvaluationTemplateDto,
    context: AuthContext,
  ) {
    const existing = await this.prisma.evaluationTemplate.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        axes: { include: { criteria: true } },
        _count: { select: { evaluations: true } },
      },
    });
    if (!existing) throw new NotFoundException('Evaluation template not found');

    if (dto.axes && dto.axes.length > 0) {
      const totalWeight = dto.axes.reduce((sum, a) => sum + Number(a.weight), 0);
      if (Math.abs(totalWeight - 100) > 0.01) {
        throw new BadRequestException(`Sum of axis weights must equal 100%. Current sum: ${totalWeight}%`);
      }
    }

    return await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.evaluationTemplate.updateMany({
          where: { forumId: user.forumId, isDefault: true, id: { not: id } },
          data: { isDefault: false },
        });
      }

      // If template has evaluations and axes/criteria are being modified, bump version
      const hasEvaluations = existing._count.evaluations > 0;
      const nextVersion = hasEvaluations && dto.axes ? existing.version + 1 : existing.version;

      if (dto.axes) {
        // Delete old axes and recreate with new version
        await tx.evaluationAxis.deleteMany({ where: { templateId: id } });
      }

      const updated = await tx.evaluationTemplate.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
          isActive: dto.isActive,
          isDefault: dto.isDefault,
          version: nextVersion,
          ...(dto.axes
            ? {
                axes: {
                  create: dto.axes.map((axis, aIdx) => ({
                    name: axis.name,
                    description: axis.description,
                    weight: axis.weight,
                    order: axis.order ?? aIdx,
                    isActive: axis.isActive ?? true,
                    criteria: {
                      create: axis.criteria.map((c, cIdx) => ({
                        name: c.name,
                        description: c.description,
                        type: c.type ?? 'SCALE_5',
                        maxScore: c.maxScore ?? 5.0,
                        weight: c.weight,
                        isRequired: c.isRequired ?? true,
                        order: c.order ?? cIdx,
                        isActive: c.isActive ?? true,
                      })),
                    },
                  })),
                },
              }
            : {}),
        },
        include: {
          axes: {
            include: { criteria: { orderBy: { order: 'asc' } } },
            orderBy: { order: 'asc' },
          },
        },
      });

      await this.audit.record(
        {
          actorUserId: user.id,
          action: 'EVALUATION_TEMPLATE_UPDATED',
          entityType: 'EvaluationTemplate',
          entityId: updated.id,
          before: { name: existing.name, version: existing.version },
          after: { name: updated.name, version: updated.version },
          ...context,
        },
        tx,
      );

      return updated;
    });
  }

  async activate(user: AuthenticatedUser, id: string, context: AuthContext) {
    const existing = await this.prisma.evaluationTemplate.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Evaluation template not found');

    return await this.prisma.$transaction(async (tx) => {
      await tx.evaluationTemplate.updateMany({
        where: { forumId: user.forumId, isDefault: true },
        data: { isDefault: false },
      });

      const updated = await tx.evaluationTemplate.update({
        where: { id },
        data: { isActive: true, isDefault: true },
      });

      await this.audit.record(
        {
          actorUserId: user.id,
          action: 'EVALUATION_TEMPLATE_ACTIVATED',
          entityType: 'EvaluationTemplate',
          entityId: id,
          ...context,
        },
        tx,
      );

      return updated;
    });
  }

  async remove(user: AuthenticatedUser, id: string, context: AuthContext) {
    const existing = await this.prisma.evaluationTemplate.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Evaluation template not found');

    const updated = await this.prisma.evaluationTemplate.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, isDefault: false },
    });

    await this.audit.record({
      actorUserId: user.id,
      action: 'EVALUATION_TEMPLATE_ARCHIVED',
      entityType: 'EvaluationTemplate',
      entityId: id,
      ...context,
    });

    return updated;
  }
}
