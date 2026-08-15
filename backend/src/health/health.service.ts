import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

export type HealthResult = {
  status: 'ok' | 'error';
  services: { api: 'up'; database: 'up' | 'down'; redis: 'up' | 'down' };
  timestamp: string;
};

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService, private readonly redis: RedisService) {}

  async check(): Promise<HealthResult> {
    const [database, redis] = await Promise.allSettled([
      this.prisma.$queryRaw`SELECT 1`,
      this.redis.ping(),
    ]);
    const services = {
      api: 'up' as const,
      database: database.status === 'fulfilled' ? 'up' as const : 'down' as const,
      redis: redis.status === 'fulfilled' ? 'up' as const : 'down' as const,
    };
    return {
      status: services.database === 'up' && services.redis === 'up' ? 'ok' : 'error',
      services,
      timestamp: new Date().toISOString(),
    };
  }
}
