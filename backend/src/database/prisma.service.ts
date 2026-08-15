import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(PrismaService.name);

  constructor(@Optional() @Inject(ConfigService) config?: ConfigService) {
    const connectionString = config?.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL;
    if (!connectionString) throw new Error('DATABASE_URL is not configured');
    super({ adapter: new PrismaPg({ connectionString }) });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log('PostgreSQL connection established');
  }

  async onApplicationShutdown(): Promise<void> {
    await this.$disconnect();
  }
}
