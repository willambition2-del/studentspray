import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AccessScopeService } from '../authorization/access-scope.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';
import { EducationalPlanStatus, Prisma } from '../generated/prisma/client';
import {
  CreateEducationalPlanDto,
  CreatePlanItemDto,
  EducationalPlanQueryDto,
  UpdateEducationalPlanDto,
  UpdatePlanItemDto,
} from './dto/educational-plan.dto';

@Injectable()
export class EducationalPlansService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly accessScope: AccessScopeService,
  ) {}

  async list(user: AuthenticatedUser, query: EducationalPlanQueryDto) {
    const where: Prisma.EducationalPlanWhereInput = {
      forumId: user.forumId,
      deletedAt: null,
      ...(query.branchId ? { branchId: query.branchId } : {}),
      ...(query.halaqaId ? { halaqaId: query.halaqaId } : {}),
      ...(query.studentId ? { studentId: query.studentId } : {}),
      ...(query.termId ? { termId: query.termId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.type ? { type: query.type } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    if (query.branchId && !(await this.accessScope.canAccessBranch(user, query.branchId))) {
      throw new ForbiddenException('Cannot access requested branch plans');
    }
    if (query.halaqaId && !(await this.accessScope.canAccessHalaqa(user, query.halaqaId))) {
      throw new ForbiddenException('Cannot access requested halaqa plans');
    }
    if (query.studentId && !(await this.accessScope.canAccessStudent(user, query.studentId))) {
      throw new ForbiddenException('Cannot access requested student plans');
    }

    const [items, total] = await Promise.all([
      this.prisma.educationalPlan.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ createdAt: 'desc' }],
        include: {
          halaqa: { select: { id: true, name: true, code: true } },
          student: {
            select: {
              id: true,
              studentNumber: true,
              user: { select: { displayName: true, username: true } },
            },
          },
          term: { select: { id: true, name: true } },
          items: { orderBy: { order: 'asc' } },
        },
      }),
      this.prisma.educationalPlan.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async get(user: AuthenticatedUser, id: string) {
    const plan = await this.prisma.educationalPlan.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        halaqa: { select: { id: true, name: true, code: true } },
        student: {
          select: {
            id: true,
            studentNumber: true,
            user: { select: { displayName: true, username: true } },
          },
        },
        term: { select: { id: true, name: true } },
        items: { orderBy: { order: 'asc' } },
      },
    });
    if (!plan) throw new NotFoundException('Educational plan not found');

    if (plan.branchId && !(await this.accessScope.canAccessBranch(user, plan.branchId))) {
      throw new ForbiddenException('Cannot access this plan');
    }
    if (plan.halaqaId && !(await this.accessScope.canAccessHalaqa(user, plan.halaqaId))) {
      throw new ForbiddenException('Cannot access this plan');
    }
    if (plan.studentId && !(await this.accessScope.canAccessStudent(user, plan.studentId))) {
      throw new ForbiddenException('Cannot access this plan');
    }

    return plan;
  }

  async create(user: AuthenticatedUser, dto: CreateEducationalPlanDto, ctx: AuthContext) {
    if (dto.branchId && !(await this.accessScope.canAccessBranch(user, dto.branchId))) {
      throw new ForbiddenException('Cannot create plan in requested branch');
    }
    if (dto.halaqaId && !(await this.accessScope.canAccessHalaqa(user, dto.halaqaId))) {
      throw new ForbiddenException('Cannot create plan in requested halaqa');
    }
    if (dto.studentId && !(await this.accessScope.canAccessStudent(user, dto.studentId))) {
      throw new ForbiddenException('Cannot create plan for requested student');
    }

    let branchId = dto.branchId;
    if (dto.halaqaId && !branchId) {
      const halaqa = await this.prisma.halaqa.findUnique({
        where: { id: dto.halaqaId },
        select: { branchId: true },
      });
      if (halaqa) branchId = halaqa.branchId;
    }

    return this.prisma.$transaction(async (tx) => {
      const created = await tx.educationalPlan.create({
        data: {
          forumId: user.forumId,
          branchId,
          halaqaId: dto.halaqaId,
          studentId: dto.studentId,
          termId: dto.termId,
          name: dto.name,
          type: dto.type,
          status: dto.status ?? EducationalPlanStatus.DRAFT,
          startDate: dto.startDate ? new Date(dto.startDate) : null,
          endDate: dto.endDate ? new Date(dto.endDate) : null,
          notes: dto.notes,
          createdById: user.id,
        },
        include: { items: true },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'EDUCATIONAL_PLAN_CREATED',
          entityType: 'EducationalPlan',
          entityId: created.id,
          after: created,
        },
        tx,
      );

      return created;
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateEducationalPlanDto, ctx: AuthContext) {
    const plan = await this.get(user, id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.educationalPlan.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          ...(dto.type ? { type: dto.type } : {}),
          ...(dto.status ? { status: dto.status } : {}),
          ...(dto.branchId !== undefined ? { branchId: dto.branchId } : {}),
          ...(dto.halaqaId !== undefined ? { halaqaId: dto.halaqaId } : {}),
          ...(dto.studentId !== undefined ? { studentId: dto.studentId } : {}),
          ...(dto.termId !== undefined ? { termId: dto.termId } : {}),
          ...(dto.startDate !== undefined
            ? { startDate: dto.startDate ? new Date(dto.startDate) : null }
            : {}),
          ...(dto.endDate !== undefined
            ? { endDate: dto.endDate ? new Date(dto.endDate) : null }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
        },
        include: { items: { orderBy: { order: 'asc' } } },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'EDUCATIONAL_PLAN_UPDATED',
          entityType: 'EducationalPlan',
          entityId: id,
          before: plan,
          after: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async activate(user: AuthenticatedUser, id: string, ctx: AuthContext) {
    const plan = await this.get(user, id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.educationalPlan.update({
        where: { id },
        data: { status: EducationalPlanStatus.ACTIVE },
        include: { items: { orderBy: { order: 'asc' } } },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'EDUCATIONAL_PLAN_ACTIVATED',
          entityType: 'EducationalPlan',
          entityId: id,
          before: plan,
          after: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async archive(user: AuthenticatedUser, id: string, ctx: AuthContext) {
    const plan = await this.get(user, id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.educationalPlan.update({
        where: { id },
        data: { status: EducationalPlanStatus.ARCHIVED },
        include: { items: { orderBy: { order: 'asc' } } },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'EDUCATIONAL_PLAN_ARCHIVED',
          entityType: 'EducationalPlan',
          entityId: id,
          before: plan,
          after: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async addItem(user: AuthenticatedUser, planId: string, dto: CreatePlanItemDto, ctx: AuthContext) {
    await this.get(user, planId);

    const item = await this.prisma.educationalPlanItem.create({
      data: {
        planId,
        type: dto.type,
        targetType: dto.targetType,
        surahNumber: dto.surahNumber,
        fromAyah: dto.fromAyah,
        toAyah: dto.toAyah,
        pageFrom: dto.pageFrom,
        pageTo: dto.pageTo,
        juzNumber: dto.juzNumber,
        targetDate: dto.targetDate ? new Date(dto.targetDate) : null,
        order: dto.order ?? 1,
        notes: dto.notes,
      },
    });

    await this.audit.record({
      ...ctx,
      actorUserId: user.id,
      action: 'EDUCATIONAL_PLAN_ITEM_ADDED',
      entityType: 'EducationalPlanItem',
      entityId: item.id,
      after: item,
    });

    return item;
  }

  async updateItem(user: AuthenticatedUser, itemId: string, dto: UpdatePlanItemDto, ctx: AuthContext) {
    const item = await this.prisma.educationalPlanItem.findUnique({
      where: { id: itemId },
      include: { plan: true },
    });
    if (!item || item.plan.forumId !== user.forumId) {
      throw new NotFoundException('Plan item not found');
    }

    await this.get(user, item.planId);

    const updated = await this.prisma.educationalPlanItem.update({
      where: { id: itemId },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.targetType ? { targetType: dto.targetType } : {}),
        ...(dto.surahNumber !== undefined ? { surahNumber: dto.surahNumber } : {}),
        ...(dto.fromAyah !== undefined ? { fromAyah: dto.fromAyah } : {}),
        ...(dto.toAyah !== undefined ? { toAyah: dto.toAyah } : {}),
        ...(dto.pageFrom !== undefined ? { pageFrom: dto.pageFrom } : {}),
        ...(dto.pageTo !== undefined ? { pageTo: dto.pageTo } : {}),
        ...(dto.juzNumber !== undefined ? { juzNumber: dto.juzNumber } : {}),
        ...(dto.targetDate !== undefined
          ? { targetDate: dto.targetDate ? new Date(dto.targetDate) : null }
          : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    await this.audit.record({
      ...ctx,
      actorUserId: user.id,
      action: 'EDUCATIONAL_PLAN_ITEM_UPDATED',
      entityType: 'EducationalPlanItem',
      entityId: item.id,
      before: item,
      after: updated,
    });

    return updated;
  }

  async deleteItem(user: AuthenticatedUser, itemId: string, ctx: AuthContext) {
    const item = await this.prisma.educationalPlanItem.findUnique({
      where: { id: itemId },
      include: {
        plan: true,
        memorizationRecords: { select: { id: true }, take: 1 },
        revisionRecords: { select: { id: true }, take: 1 },
      },
    });
    if (!item || item.plan.forumId !== user.forumId) {
      throw new NotFoundException('Plan item not found');
    }

    if (item.memorizationRecords.length > 0 || item.revisionRecords.length > 0) {
      throw new BadRequestException(
        'Cannot delete plan item with linked recitation records. Please update its status instead.',
      );
    }

    await this.get(user, item.planId);
    await this.prisma.educationalPlanItem.delete({ where: { id: itemId } });

    await this.audit.record({
      ...ctx,
      actorUserId: user.id,
      action: 'EDUCATIONAL_PLAN_ITEM_DELETED',
      entityType: 'EducationalPlanItem',
      entityId: item.id,
      before: item,
    });

    return { success: true };
  }
}
