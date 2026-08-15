import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { PasswordService } from './password.service';
import { normalizeEmail, normalizeUsername } from './utils/identifier';

export type BootstrapGeneralManagerInput = {
  forumSlug: string;
  username: string;
  email?: string;
  password: string;
  branchCode?: string;
};

@Injectable()
export class BootstrapGeneralManagerService {
  constructor(private readonly prisma: PrismaService, private readonly passwords: PasswordService) {}

  async createFirst(input: BootstrapGeneralManagerInput): Promise<{ id: string }> {
    const forum = await this.prisma.forum.findFirst({ where: { slug: input.forumSlug, isActive: true, deletedAt: null } });
    if (!forum) throw new Error('Forum not found or inactive');
    const role = await this.prisma.role.findUnique({ where: { forumId_name: { forumId: forum.id, name: 'GENERAL_MANAGER' } } });
    if (!role) throw new Error('GENERAL_MANAGER role is missing; run the Prisma seed first');
    const existingManager = await this.prisma.userRole.findFirst({
      where: { roleId: role.id, isActive: true, user: { isActive: true, deletedAt: null } },
      select: { id: true },
    });
    if (existingManager) throw new Error('An active General Manager already exists for this forum');
    const branch = input.branchCode ? await this.prisma.branch.findUnique({
      where: { forumId_code: { forumId: forum.id, code: input.branchCode } },
    }) : null;
    if (input.branchCode && !branch) throw new Error('Requested branch was not found in the forum');
    const passwordHash = await this.passwords.hashPassword(input.password);
    const username = input.username.trim();
    const email = input.email?.trim() || undefined;
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.create({
        data: {
          forumId: forum.id,
          branchId: branch?.id,
          username,
          usernameNormalized: normalizeUsername(username),
          email,
          emailNormalized: email ? normalizeEmail(email) : undefined,
          passwordHash,
          passwordChangedAt: new Date(),
          mustChangePassword: true,
        },
        select: { id: true },
      });
      await transaction.userRole.create({ data: { userId: user.id, roleId: role.id, branchId: branch?.id } });
      return user;
    });
  }
}
