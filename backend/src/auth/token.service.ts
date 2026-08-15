import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { createHmac, randomBytes } from 'node:crypto';

export type AccessTokenPayload = { sub: string; sid: string };

function durationSeconds(value: string): number {
  const match = /^(\d+)([smhd])$/.exec(value);
  if (!match) throw new Error('Invalid JWT_ACCESS_TTL');
  const factors = { s: 1, m: 60, h: 3600, d: 86400 } as const;
  return Number(match[1]) * factors[match[2] as keyof typeof factors];
}

@Injectable()
export class TokenService {
  constructor(private readonly jwt: JwtService, private readonly config: ConfigService) {}

  async issueAccessToken(userId: string, sessionId: string) {
    const ttlSeconds = durationSeconds(this.config.getOrThrow<string>('JWT_ACCESS_TTL'));
    const accessToken = await this.jwt.signAsync({ sub: userId, sid: sessionId } satisfies AccessTokenPayload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
      audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      expiresIn: ttlSeconds,
    });
    return { accessToken, accessTokenExpiresAt: new Date(Date.now() + ttlSeconds * 1000) };
  }

  async verifyAccessToken(token: string): Promise<AccessTokenPayload> {
    try {
      const payload = await this.jwt.verifyAsync<AccessTokenPayload>(token, {
        secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
        issuer: this.config.getOrThrow<string>('JWT_ISSUER'),
        audience: this.config.getOrThrow<string>('JWT_AUDIENCE'),
      });
      if (!payload.sub || !payload.sid) throw new Error('Missing token claims');
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token');
    }
  }

  createRefreshToken(sessionId: string): string {
    return `${sessionId}.${randomBytes(48).toString('base64url')}`;
  }

  parseRefreshSessionId(token: string): string | null {
    const [sessionId, secret, extra] = token.split('.');
    return !extra && secret && /^[0-9a-f-]{36}$/i.test(sessionId) ? sessionId : null;
  }

  hashRefreshToken(token: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('REFRESH_TOKEN_HASH_SECRET'))
      .update(token, 'utf8').digest('hex');
  }
}
