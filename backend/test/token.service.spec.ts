import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { TokenService } from '../src/auth/token.service';

describe('TokenService', () => {
  const config = new ConfigService({
    JWT_ACCESS_SECRET: 'unit-test-access-secret-at-least-thirty-two-characters',
    JWT_ACCESS_TTL: '15m',
    JWT_ISSUER: 'quran-forum-api-test',
    JWT_AUDIENCE: 'quran-forum-test-clients',
    REFRESH_TOKEN_HASH_SECRET: 'unit-test-refresh-secret-at-least-thirty-two-characters',
  });
  const service = new TokenService(new JwtService(), config);

  it('issues and verifies minimal access claims', async () => {
    const issued = await service.issueAccessToken('user-id', 'session-id');
    await expect(service.verifyAccessToken(issued.accessToken)).resolves.toEqual(expect.objectContaining({ sub: 'user-id', sid: 'session-id' }));
  });

  it('creates opaque refresh tokens and stable non-plaintext hashes', () => {
    const sessionId = '6ff3e124-cd6f-488f-a8cf-bb378c2db33c';
    const token = service.createRefreshToken(sessionId);
    expect(service.parseRefreshSessionId(token)).toBe(sessionId);
    expect(service.hashRefreshToken(token)).toMatch(/^[a-f0-9]{64}$/);
    expect(service.hashRefreshToken(token)).not.toContain(token);
  });

  it('rejects a modified access token', async () => {
    const issued = await service.issueAccessToken('user-id', 'session-id');
    await expect(service.verifyAccessToken(`${issued.accessToken}x`)).rejects.toThrow('Invalid or expired');
  });
});
