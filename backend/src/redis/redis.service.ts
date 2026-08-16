import { Inject, Injectable, Logger, OnApplicationShutdown, OnModuleInit, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

interface MemoryEntry {
  value: string;
  expiresAt?: number;
}

@Injectable()
export class RedisService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private isConnected = false;
  private readonly memoryStore = new Map<string, MemoryEntry>();

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
    this.client.on('error', (error) => {
      this.isConnected = false;
      this.logger.debug(`Redis client status: ${error.message}`);
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('Redis connection established');
    } catch {
      this.isConnected = false;
      this.logger.log('Using in-memory store fallback');
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.isConnected && this.client.status === 'ready') {
      await this.client.quit();
    } else {
      this.client.disconnect();
    }
  }

  async ping(): Promise<string> {
    if (this.isConnected) {
      try {
        return await this.client.ping();
      } catch {
        this.isConnected = false;
      }
    }
    return 'PONG';
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected) {
      try {
        return await this.client.get(key);
      } catch {
        this.isConnected = false;
      }
    }
    const entry = this.memoryStore.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<'OK'> {
    if (this.isConnected) {
      try {
        return ttlSeconds ? await this.client.set(key, value, 'EX', ttlSeconds) : await this.client.set(key, value);
      } catch {
        this.isConnected = false;
      }
    }
    this.memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
    return 'OK';
  }

  async del(key: string): Promise<number> {
    if (this.isConnected) {
      try {
        return await this.client.del(key);
      } catch {
        this.isConnected = false;
      }
    }
    return this.memoryStore.delete(key) ? 1 : 0;
  }

  async incrementWithExpiry(key: string, windowSeconds: number): Promise<number> {
    if (this.isConnected) {
      try {
        const result = await this.client.eval(
          "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]) end; return count",
          1,
          key,
          windowSeconds,
        );
        return Number(result);
      } catch {
        this.isConnected = false;
      }
    }

    const entry = this.memoryStore.get(key);
    let count = 1;
    if (entry && (!entry.expiresAt || Date.now() <= entry.expiresAt)) {
      count = parseInt(entry.value, 10) + 1;
      this.memoryStore.set(key, {
        value: count.toString(),
        expiresAt: entry.expiresAt,
      });
    } else {
      this.memoryStore.set(key, {
        value: '1',
        expiresAt: Date.now() + windowSeconds * 1000,
      });
    }
    return count;
  }
}
