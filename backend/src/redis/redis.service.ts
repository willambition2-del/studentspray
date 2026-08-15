import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(@Optional() @Inject(ConfigService) config?: ConfigService) {
    this.client = new Redis({
      host: config?.get<string>('REDIS_HOST') ?? process.env.REDIS_HOST ?? 'localhost',
      port: config?.get<number>('REDIS_PORT') ?? (process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 56379),
      password: config?.get<string>('REDIS_PASSWORD') || process.env.REDIS_PASSWORD || undefined,
      db: config?.get<number>('REDIS_DB', 0) ?? (process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => Math.min(attempt * 200, 2_000),
    });
    this.client.on('error', (error) => this.logger.error(`Redis error: ${error.message}`));
  }

  async onModuleInit(): Promise<void> {
    await this.client.connect();
    await this.client.ping();
    this.logger.log('Redis connection established');
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.client.status === 'ready') await this.client.quit();
    else this.client.disconnect();
  }

  ping(): Promise<string> { return this.client.ping(); }
  get(key: string): Promise<string | null> { return this.client.get(key); }
  set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    return ttlSeconds ? this.client.set(key, value, 'EX', ttlSeconds) : this.client.set(key, value);
  }
  del(key: string): Promise<number> { return this.client.del(key); }

  async incrementWithExpiry(key: string, windowSeconds: number): Promise<number> {
    const result = await this.client.eval(
      "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return count",
      1,
      key,
      windowSeconds,
    );
    return Number(result);
  }
}
