import { Injectable, Logger, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;

  constructor(config: ConfigService) {
    this.client = new Redis({
      host: config.getOrThrow<string>('REDIS_HOST'),
      port: config.getOrThrow<number>('REDIS_PORT'),
      password: config.get<string>('REDIS_PASSWORD') || undefined,
      db: config.get<number>('REDIS_DB', 0),
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
}
