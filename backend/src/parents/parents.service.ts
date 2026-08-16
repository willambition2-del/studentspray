/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access */
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import type { AuthContext } from "../auth/types/auth-context";
import type { AuthenticatedUser } from "../auth/types/authenticated-user";
import { AuditService } from "../audit/audit.service";
import { AccessScopeService } from "../authorization/access-scope.service";
import { PrismaService } from "../database/prisma.service";
import type {
  CreateParentDto,
  ProfileQueryDto,
  UpdateParentDto,
} from "../profiles/dto/profile.dto";
import { ProfilesService } from "../profiles/profiles.service";
import type {
  GuardianLinkDto,
  UpdateGuardianLinkDto,
} from "./dto/guardian-link.dto";
@Injectable()
export class ParentsService {
  constructor(
    private readonly p: PrismaService,
    private readonly profiles: ProfilesService,
    private readonly scopes: AccessScopeService,
    private readonly audit: AuditService,
  ) {}
  list(u: AuthenticatedUser, q: ProfileQueryDto) {
    return this.profiles.list("parent", u, q);
  }
  get(u: AuthenticatedUser, id: string) {
    return this.profiles.get("parent", u, id);
  }
  create(u: AuthenticatedUser, d: CreateParentDto, c: AuthContext) {
    return this.profiles.create(
      "parent",
      u,
      d,
      { occupation: d.occupation },
      c,
    );
  }
  update(u: AuthenticatedUser, id: string, d: UpdateParentDto, c: AuthContext) {
    return this.profiles.update(
      "parent",
      u,
      id,
      d,
      { occupation: d.occupation },
      c,
    );
  }
  async students(u: AuthenticatedUser, id: string) {
    const parent = await this.get(u, id);
    return parent.students;
  }
  async link(
    u: AuthenticatedUser,
    parentId: string,
    studentId: string,
    d: GuardianLinkDto,
    c: AuthContext,
  ) {
    await this.get(u, parentId);
    if (!(await this.scopes.canAccessStudent(u, studentId)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    try {
      return await this.p.$transaction(async (tx) => {
        if (d.isPrimary)
          await tx.studentGuardian.updateMany({
            where: { studentId, isPrimary: true },
            data: { isPrimary: false },
          });
        const link = await tx.studentGuardian.create({
          data: {
            parentId,
            studentId,
            relationship: d.relationship,
            isPrimary: d.isPrimary ?? false,
            receivesAcademicReports: d.canReceiveNotifications ?? true,
          },
        });
        await this.audit.record(
          {
            ...c,
            actorUserId: u.id,
            action: "PARENT_LINKED",
            entityType: "StudentGuardian",
            entityId: link.id,
            metadata: { parentId, studentId },
          },
          tx,
        );
        return link;
      });
    } catch (e) {
      if ((e as { code?: string }).code === "P2002")
        throw new ConflictException({
          code: "GUARDIAN_ALREADY_LINKED",
          message: "Parent is already linked to this student",
        });
      throw e;
    }
  }
  async updateLink(
    u: AuthenticatedUser,
    parentId: string,
    studentId: string,
    d: UpdateGuardianLinkDto,
    c: AuthContext,
  ) {
    await this.get(u, parentId);
    if (!(await this.scopes.canAccessStudent(u, studentId)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    return this.p.$transaction(async (tx) => {
      const before = await tx.studentGuardian.findUnique({
        where: { studentId_parentId: { studentId, parentId } },
      });
      if (!before)
        throw new NotFoundException({
          code: "GUARDIAN_LINK_NOT_FOUND",
          message: "Guardian link not found",
        });
      if (d.isPrimary)
        await tx.studentGuardian.updateMany({
          where: { studentId, isPrimary: true, NOT: { id: before.id } },
          data: { isPrimary: false },
        });
      const after = await tx.studentGuardian.update({
        where: { id: before.id },
        data: d,
      });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: "PARENT_LINK_UPDATED",
          entityType: "StudentGuardian",
          entityId: after.id,
          before,
          after,
        },
        tx,
      );
      return after;
    });
  }
  async unlink(
    u: AuthenticatedUser,
    parentId: string,
    studentId: string,
    c: AuthContext,
  ) {
    await this.get(u, parentId);
    if (!(await this.scopes.canAccessStudent(u, studentId)))
      throw new NotFoundException({
        code: "STUDENT_NOT_FOUND",
        message: "Student not found",
      });
    return this.p.$transaction(async (tx) => {
      const link = await tx.studentGuardian.findUnique({
        where: { studentId_parentId: { studentId, parentId } },
      });
      if (!link)
        throw new NotFoundException({
          code: "GUARDIAN_LINK_NOT_FOUND",
          message: "Guardian link not found",
        });
      await tx.studentGuardian.delete({ where: { id: link.id } });
      await this.audit.record(
        {
          ...c,
          actorUserId: u.id,
          action: "PARENT_UNLINKED",
          entityType: "StudentGuardian",
          entityId: link.id,
          before: link,
        },
        tx,
      );
      return { unlinked: true };
    });
  }
}
