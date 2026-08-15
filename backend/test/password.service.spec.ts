import { ConfigService } from '@nestjs/config';
import { PasswordService } from '../src/auth/password.service';

describe('PasswordService', () => {
  const service = new PasswordService(new ConfigService({
    ARGON2_MEMORY_COST: 19456,
    ARGON2_TIME_COST: 2,
    ARGON2_PARALLELISM: 1,
  }));

  it('hashes with Argon2id and verifies the correct password', async () => {
    const hash = await service.hashPassword('Valid-Test-Password-2026!');
    expect(hash).toMatch(/^\$argon2id\$/);
    await expect(service.verifyPassword(hash, 'Valid-Test-Password-2026!')).resolves.toBe(true);
    await expect(service.verifyPassword(hash, 'Wrong-Test-Password-2026!')).resolves.toBe(false);
  });

  it('rejects weak passwords', () => {
    expect(() => service.assertPolicy('password')).toThrow('Password must be between');
    expect(() => service.assertPolicy('aaaaaaaaaaaa')).toThrow('letters, numbers, and a symbol');
  });
});
