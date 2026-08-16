import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { AuthenticatedUser } from '../auth/types/authenticated-user';
import type { AuthContext } from '../auth/types/auth-context';
import { pageArgs, paginated } from '../common/dto/pagination-query.dto';
import {
  AcademicYearQueryDto,
  CreateAcademicYearDto,
  CreateTermDto,
  UpdateAcademicYearDto,
  UpdateTermDto,
} from './dto/academic-year.dto';

@Injectable()
export class AcademicYearsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, query: AcademicYearQueryDto) {
    const where = {
      forumId: user.forumId,
      deletedAt: null,
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? { name: { contains: query.search, mode: 'insensitive' as const } }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.academicYear.findMany({
        where,
        ...pageArgs(query),
        orderBy: [{ isActive: 'desc' }, { startsAt: 'desc' }],
        include: {
          terms: {
            where: { deletedAt: null },
            orderBy: { order: 'asc' },
          },
        },
      }),
      this.prisma.academicYear.count({ where }),
    ]);

    return paginated(items, total, query);
  }

  async get(user: AuthenticatedUser, id: string) {
    const year = await this.prisma.academicYear.findFirst({
      where: { id, forumId: user.forumId, deletedAt: null },
      include: {
        terms: {
          where: { deletedAt: null },
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!year) throw new NotFoundException('Academic year not found');
    return year;
  }

  async create(user: AuthenticatedUser, dto: CreateAcademicYearDto, ctx: AuthContext) {
    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);
    if (startsAt >= endsAt) {
      throw new BadRequestException('End date must be strictly after start date');
    }

    const existing = await this.prisma.academicYear.findUnique({
      where: { forumId_name: { forumId: user.forumId, name: dto.name } },
    });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('An academic year with this name already exists');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.academicYear.updateMany({
          where: { forumId: user.forumId, isActive: true },
          data: { isActive: false },
        });
      }

      const created = await tx.academicYear.create({
        data: {
          forumId: user.forumId,
          name: dto.name,
          startsAt,
          endsAt,
          isActive: dto.isActive ?? false,
        },
        include: { terms: true },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'ACADEMIC_YEAR_CREATED',
          entityType: 'AcademicYear',
          entityId: created.id,
          after: created,
        },
        tx,
      );

      return created;
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateAcademicYearDto, ctx: AuthContext) {
    const year = await this.get(user, id);

    let startsAt = year.startsAt;
    let endsAt = year.endsAt;

    if (dto.startsAt) startsAt = new Date(dto.startsAt);
    if (dto.endsAt) endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('End date must be strictly after start date');
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.isActive) {
        await tx.academicYear.updateMany({
          where: { forumId: user.forumId, isActive: true, id: { not: id } },
          data: { isActive: false },
        });
      }

      const updated = await tx.academicYear.update({
        where: { id },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          startsAt,
          endsAt,
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
        include: {
          terms: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'ACADEMIC_YEAR_UPDATED',
          entityType: 'AcademicYear',
          entityId: updated.id,
          before: year,
          after: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async activate(user: AuthenticatedUser, id: string, ctx: AuthContext) {
    const year = await this.get(user, id);

    return this.prisma.$transaction(async (tx) => {
      await tx.academicYear.updateMany({
        where: { forumId: user.forumId, isActive: true, id: { not: id } },
        data: { isActive: false },
      });

      const updated = await tx.academicYear.update({
        where: { id },
        data: { isActive: true },
        include: {
          terms: { where: { deletedAt: null }, orderBy: { order: 'asc' } },
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'ACADEMIC_YEAR_ACTIVATED',
          entityType: 'AcademicYear',
          entityId: id,
          before: year,
          after: updated,
        },
        tx,
      );

      return updated;
    });
  }

  async addTerm(user: AuthenticatedUser, academicYearId: string, dto: CreateTermDto, ctx: AuthContext) {
    const year = await this.get(user, academicYearId);

    const startsAt = new Date(dto.startsAt);
    const endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('Term end date must be after start date');
    }

    if (startsAt < year.startsAt || endsAt > year.endsAt) {
      throw new BadRequestException('Term dates must fall within the academic year dates');
    }

    return this.prisma.$transaction(async (tx) => {
      const term = await tx.term.create({
        data: {
          academicYearId,
          name: dto.name,
          startsAt,
          endsAt,
          order: dto.order ?? 1,
          isActive: dto.isActive ?? false,
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'TERM_CREATED',
          entityType: 'Term',
          entityId: term.id,
          after: term,
        },
        tx,
      );

      return term;
    });
  }

  async updateTerm(user: AuthenticatedUser, termId: string, dto: UpdateTermDto, ctx: AuthContext) {
    const term = await this.prisma.term.findFirst({
      where: { id: termId, academicYear: { forumId: user.forumId } },
      include: { academicYear: true },
    });
    if (!term) throw new NotFoundException('Term not found');

    let startsAt = term.startsAt;
    let endsAt = term.endsAt;

    if (dto.startsAt) startsAt = new Date(dto.startsAt);
    if (dto.endsAt) endsAt = new Date(dto.endsAt);

    if (startsAt >= endsAt) {
      throw new BadRequestException('Term end date must be after start date');
    }

    if (startsAt < term.academicYear.startsAt || endsAt > term.academicYear.endsAt) {
      throw new BadRequestException('Term dates must fall within the academic year dates');
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.term.update({
        where: { id: termId },
        data: {
          ...(dto.name ? { name: dto.name } : {}),
          startsAt,
          endsAt,
          ...(dto.order !== undefined ? { order: dto.order } : {}),
          ...(dto.isActive !== undefined ? { isActive: dto.isActive } : {}),
        },
      });

      await this.audit.record(
        {
          ...ctx,
          actorUserId: user.id,
          action: 'TERM_UPDATED',
          entityType: 'Term',
          entityId: termId,
          before: term,
          after: updated,
        },
        tx,
      );

      return updated;
    });
  }
}
