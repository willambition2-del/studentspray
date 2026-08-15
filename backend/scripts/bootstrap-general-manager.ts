import 'reflect-metadata';
import 'dotenv/config';
import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { BootstrapGeneralManagerService } from '../src/auth/bootstrap-general-manager.service';

const logger = new Logger('BootstrapGeneralManager');

async function bootstrap(): Promise<void> {
  const forumSlug = process.env.BOOTSTRAP_FORUM_SLUG?.trim();
  const username = process.env.BOOTSTRAP_USERNAME?.trim();
  const email = process.env.BOOTSTRAP_EMAIL?.trim() || undefined;
  const password = process.env.BOOTSTRAP_PASSWORD;
  const branchCode = process.env.BOOTSTRAP_BRANCH_CODE?.trim() || undefined;
  if (!forumSlug || !username || !password) {
    throw new Error('BOOTSTRAP_FORUM_SLUG, BOOTSTRAP_USERNAME, and BOOTSTRAP_PASSWORD are required');
  }

  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['error', 'warn'] });
  try {
    const service = app.get(BootstrapGeneralManagerService);
    const user = await service.createFirst({ forumSlug, username, email, password, branchCode });
    logger.log(`General Manager created safely: ${user.id}`);
  } finally {
    await app.close();
  }
}

void bootstrap().catch((error: unknown) => {
  logger.error(error instanceof Error ? error.message : 'Bootstrap failed');
  process.exitCode = 1;
});
