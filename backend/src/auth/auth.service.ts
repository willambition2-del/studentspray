import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { AuthClient, User } from '../generated/prisma/client';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';
import { AuthAuditService } from './auth-audit.service';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';
import type { AuthContext } from './types/auth-context';
import type { AuthenticatedUser } from './types/authenticated-user';
import { classifyAndNormalizeIdentifier } from './utils/identifier';

type LoginInput = { forumSlug: string; identifier: string; password: string };
type SessionUser = User;

const INVALID_CREDENTIALS = 'Invalid credentials';

@Injectable()
export class AuthService {
  private readonly dummyHash: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly passwords: PasswordService,
    private readonly tokens: TokenService,
    private readonly audit: AuthAuditService,
  ) {
    this.dummyHash = this.passwords.hashPassword('Dummy-Password-Only-2026!');
  }

  async login(input: LoginInput, client: AuthClient, context: AuthContext) {
    const identifier = classifyAndNormalizeIdentifier(input.identifier);
    await this.enforceAttemptRate(`${input.forumSlug}:${identifier.value}`, context.ipAddress);

    const forum = await this.prisma.forum.findFirst({
      where: { slug: input.forumSlug.trim().toLocaleLowerCase('en-US'), isActive: true, deletedAt: null },
      select: { id: true },
    });
    const user = forum ? await this.prisma.user.findFirst({
      where: { forumId: forum.id, [identifier.field]: identifier.value },
    }) : null;

    if (!user?.passwordHash) {
      await this.passwords.verifyPassword(await this.dummyHash, input.password).catch(() => false);
      await this.audit.record('LOGIN_FAILED', false, context);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const now = new Date();
    if (!user.isActive || user.deletedAt || (user.lockedUntil && user.lockedUntil > now)) {
      await this.audit.record(user.lockedUntil && user.lockedUntil > now ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED', false, {
        ...context,
        actorUserId: user.id,
      });
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const validPassword = await this.passwords.verifyPassword(user.passwordHash, input.password);
    if (!validPassword) {
      await this.recordFailedLogin(user, context);
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: now },
    });
    const result = await this.createSession(user, client, context);
    await this.audit.record('LOGIN_SUCCESS', true, { ...context, actorUserId: user.id });
    return result;
  }

  async refresh(refreshToken: string, expectedClient: AuthClient, context: AuthContext) {
    const sessionId = this.tokens.parseRefreshSessionId(refreshToken);
    if (!sessionId) throw new UnauthorizedException('Invalid refresh token');
    const presentedHash = this.tokens.hashRefreshToken(refreshToken);

    const existing = await this.prisma.authSession.findUnique({ where: { id: sessionId }, include: { user: true } });
    if (!existing || !this.hashesEqual(existing.refreshTokenHash, presentedHash) || existing.client !== expectedClient) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (existing.revokedAt) {
      if (existing.revokedReason === 'ROTATED') {
        await this.revokeFamilyForReuse(existing.tokenFamilyId, existing.userId, context);
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
    if (existing.expiresAt <= new Date() || !existing.user.isActive || existing.user.deletedAt) {
      await this.prisma.authSession.updateMany({
        where: { id: existing.id, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: existing.user.isActive ? 'EXPIRED' : 'ACCOUNT_DISABLED' },
      });
      throw new UnauthorizedException('Invalid refresh token');
    }

    const newSessionId = randomUUID();
    const newRefreshToken = this.tokens.createRefreshToken(newSessionId);
    const newHash = this.tokens.hashRefreshToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS') * 86_400_000);

    try {
      await this.prisma.$transaction(async (transaction) => {
        await transaction.authSession.create({
          data: {
            id: newSessionId,
            userId: existing.userId,
            tokenFamilyId: existing.tokenFamilyId,
            refreshTokenHash: newHash,
            client: expectedClient,
            expiresAt,
            ipAddress: context.ipAddress?.slice(0, 45),
            userAgent: context.userAgent?.slice(0, 512),
          },
        });
        const rotated = await transaction.authSession.updateMany({
          where: { id: existing.id, refreshTokenHash: presentedHash, revokedAt: null },
          data: {
            revokedAt: new Date(),
            revokedReason: 'ROTATED',
            replacedBySessionId: newSessionId,
            lastUsedAt: new Date(),
          },
        });
        if (rotated.count !== 1) throw new Error('CONCURRENT_REFRESH');
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'CONCURRENT_REFRESH') {
        await this.revokeFamilyForReuse(existing.tokenFamilyId, existing.userId, context);
        throw new UnauthorizedException('Invalid refresh token');
      }
      throw error;
    }

    return {
      ...(await this.tokens.issueAccessToken(existing.userId, newSessionId)),
      refreshToken: newRefreshToken,
      refreshTokenExpiresAt: expiresAt,
      sessionId: newSessionId,
    };
  }

  async logout(refreshToken: string | undefined, client: AuthClient, context: AuthContext): Promise<void> {
    if (!refreshToken) return;
    const sessionId = this.tokens.parseRefreshSessionId(refreshToken);
    if (!sessionId) return;
    const session = await this.prisma.authSession.findUnique({ where: { id: sessionId } });
    if (!session || session.client !== client || !this.hashesEqual(session.refreshTokenHash, this.tokens.hashRefreshToken(refreshToken))) return;
    const result = await this.prisma.authSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'LOGOUT' },
    });
    if (result.count) await this.audit.record('LOGOUT', true, { ...context, actorUserId: session.userId });
  }

  async logoutAll(user: AuthenticatedUser, context: AuthContext): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'LOGOUT_ALL' },
    });
    await this.audit.record('LOGOUT_ALL', true, { ...context, actorUserId: user.id });
  }

  async changePassword(user: AuthenticatedUser, currentPassword: string, newPassword: string, context: AuthContext): Promise<void> {
    const account = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!account?.passwordHash || !(await this.passwords.verifyPassword(account.passwordHash, currentPassword))) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }
    const passwordHash = await this.passwords.hashPassword(newPassword);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash, passwordChangedAt: new Date(), mustChangePassword: false },
      }),
      this.prisma.authSession.updateMany({
        where: { userId: user.id, id: { not: user.sessionId }, revokedAt: null },
        data: { revokedAt: new Date(), revokedReason: 'PASSWORD_CHANGED' },
      }),
    ]);
    await this.audit.record('PASSWORD_CHANGED', true, { ...context, actorUserId: user.id });
  }

  async me(user: AuthenticatedUser) {
    const account = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        mustChangePassword: true,
        forum: { select: { id: true, name: true, slug: true } },
        branch: { select: { id: true, name: true, code: true } },
      },
    });
    return { ...account, roles: user.roles, permissions: user.permissions };
  }

  async validateAccessSession(userId: string, sessionId: string): Promise<AuthenticatedUser> {
    const now = new Date();
    const session = await this.prisma.authSession.findFirst({
      where: { id: sessionId, userId, revokedAt: null, expiresAt: { gt: now } },
      include: {
        user: {
          include: {
            roles: {
              where: { isActive: true, startsAt: { lte: now }, OR: [{ endsAt: null }, { endsAt: { gt: now } }] },
              include: { role: { include: { permissions: { include: { permission: true } } } } },
            },
          },
        },
      },
    });
    if (!session || !session.user.isActive || session.user.deletedAt) throw new UnauthorizedException('Session is not active');
    const roles = session.user.roles.filter((assignment) => assignment.role.isActive).map((assignment) => ({
      id: assignment.role.id,
      name: assignment.role.name,
      branchId: assignment.branchId,
    }));
    const permissions = [...new Set(session.user.roles.flatMap((assignment) =>
      assignment.role.isActive ? assignment.role.permissions.map((item) => item.permission.code) : []))];
    return {
      id: session.user.id,
      sessionId: session.id,
      forumId: session.user.forumId,
      branchId: session.user.branchId,
      username: session.user.username,
      mustChangePassword: session.user.mustChangePassword,
      roles,
      permissions,
    };
  }

  private async createSession(user: SessionUser, client: AuthClient, context: AuthContext) {
    const sessionId = randomUUID();
    const refreshToken = this.tokens.createRefreshToken(sessionId);
    const refreshTokenExpiresAt = new Date(Date.now() + this.config.getOrThrow<number>('REFRESH_TOKEN_TTL_DAYS') * 86_400_000);
    await this.prisma.authSession.create({
      data: {
        id: sessionId,
        userId: user.id,
        tokenFamilyId: randomUUID(),
        refreshTokenHash: this.tokens.hashRefreshToken(refreshToken),
        client,
        expiresAt: refreshTokenExpiresAt,
        ipAddress: context.ipAddress?.slice(0, 45),
        userAgent: context.userAgent?.slice(0, 512),
      },
    });
    return {
      ...(await this.tokens.issueAccessToken(user.id, sessionId)),
      refreshToken,
      refreshTokenExpiresAt,
      sessionId,
    };
  }

  private async recordFailedLogin(user: User, context: AuthContext): Promise<void> {
    const maxAttempts = this.config.getOrThrow<number>('AUTH_MAX_FAILED_ATTEMPTS');
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginAttempts: { increment: 1 } },
      select: { failedLoginAttempts: true, lockedUntil: true },
    });
    const locked = updated.failedLoginAttempts >= maxAttempts || Boolean(updated.lockedUntil && updated.lockedUntil > new Date());
    if (updated.failedLoginAttempts >= maxAttempts) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          lockedUntil: new Date(Date.now() + this.config.getOrThrow<number>('AUTH_LOCK_MINUTES') * 60_000),
        },
      });
    }
    await this.audit.record(locked ? 'ACCOUNT_LOCKED' : 'LOGIN_FAILED', false, { ...context, actorUserId: user.id });
  }

  private async enforceAttemptRate(identifier: string, ipAddress?: string): Promise<void> {
    const keyMaterial = `${ipAddress ?? 'unknown'}:${identifier}`;
    const key = `auth:login:${createHash('sha256').update(keyMaterial).digest('hex')}`;
    const count = await this.redis.incrementWithExpiry(key, this.config.getOrThrow<number>('AUTH_RATE_LIMIT_WINDOW_SECONDS'));
    if (count > this.config.getOrThrow<number>('AUTH_RATE_LIMIT_ATTEMPTS')) {
      throw new HttpException('Too many login attempts', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  private async revokeFamilyForReuse(tokenFamilyId: string, userId: string, context: AuthContext): Promise<void> {
    await this.prisma.authSession.updateMany({
      where: { tokenFamilyId, revokedAt: null },
      data: { revokedAt: new Date(), revokedReason: 'REUSE_DETECTED' },
    });
    await this.audit.record('REFRESH_REUSE_DETECTED', false, { ...context, actorUserId: userId });
  }

  private hashesEqual(stored: string, presented: string): boolean {
    const left = Buffer.from(stored);
    const right = Buffer.from(presented);
    return left.length === right.length && timingSafeEqual(left, right);
  }
}
