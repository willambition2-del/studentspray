import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';

const COMMON_PASSWORDS = new Set([
  'password123!', 'qwerty123456!', 'admin123456!', '1234567890!a',
  'كلمةالمرور123!', 'quran123456!',
]);

@Injectable()
export class PasswordService {
  constructor(private readonly config: ConfigService) {}

  async hashPassword(password: string): Promise<string> {
    this.assertPolicy(password);
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: this.config.getOrThrow<number>('ARGON2_MEMORY_COST'),
      timeCost: this.config.getOrThrow<number>('ARGON2_TIME_COST'),
      parallelism: this.config.getOrThrow<number>('ARGON2_PARALLELISM'),
    });
  }

  verifyPassword(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }

  assertPolicy(password: string): void {
    if (password.length < 12 || password.length > 128) {
      throw new BadRequestException({ code: 'PASSWORD_POLICY', message: 'Password must be between 12 and 128 characters' });
    }
    const classes = [/[\p{L}]/u, /[\p{N}]/u, /[^\p{L}\p{N}\s]/u].filter((pattern) => pattern.test(password)).length;
    if (classes < 3 || /^(.)\1+$/u.test(password) || COMMON_PASSWORDS.has(password.toLocaleLowerCase('en-US'))) {
      throw new BadRequestException({ code: 'PASSWORD_POLICY', message: 'Password must include letters, numbers, and a symbol and must not be commonly used' });
    }
  }
}
