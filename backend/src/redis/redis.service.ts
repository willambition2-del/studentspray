import {
  Inject,
  Injectable,
  Logger,
  OnApplicationShutdown,
  OnModuleInit,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
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
  private readonly isProduction: boolean;
  private readonly allowMemoryFallback: boolean;
  private readonly memoryStore = new Map<string, MemoryEntry>();

  constructor(@Optional() @Inject(ConfigService) config?: ConfigService) {
    const nodeEnv = config?.get<string>('NODE_ENV') ?? process.env.NODE_ENV ?? 'development';
    this.isProduction = nodeEnv === 'production';

    // In production, in-memory fallback is strictly forbidden
    if (this.isProduction) {
      this.allowMemoryFallback = false;
    } else {
      const fallbackConfig =
        config?.get<string | boolean>('REDIS_ALLOW_MEMORY_FALLBACK') ??
        process.env.REDIS_ALLOW_MEMORY_FALLBACK;
      if (fallbackConfig !== undefined) {
        this.allowMemoryFallback =
          fallbackConfig === true || fallbackConfig === 'true' || fallbackConfig === '1';
      } else {
        // Default to true in development/test to allow local iteration without Redis
        this.allowMemoryFallback = true;
      }
    }

    this.client = new Redis({
      host: config?.get<string>('REDIS_HOST') ?? process.env.REDIS_HOST ?? 'localhost',
      port:
        config?.get<number>('REDIS_PORT') ??
        (process.env.REDIS_PORT ? Number(process.env.REDIS_PORT) : 56379),
      password: config?.get<string>('REDIS_PASSWORD') || process.env.REDIS_PASSWORD || undefined,
      db: config?.get<number>('REDIS_DB', 0) ?? (process.env.REDIS_DB ? Number(process.env.REDIS_DB) : 0),
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 1,
      retryStrategy: (attempt) => (this.isProduction ? Math.min(attempt * 200, 2_000) : null),
    });

    this.client.on('error', (error) => {
      this.isConnected = false;
      if (this.isProduction || !this.allowMemoryFallback) {
        this.logger.error(`Redis connection error: ${error.message}`);
      } else {
        this.logger.debug(`Redis client status: ${error.message}`);
      }
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      this.logger.log('Redis connected successfully');
    });

    this.client.on('close', () => {
      this.isConnected = false;
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.client.connect();
      await this.client.ping();
      this.isConnected = true;
      this.logger.log('Redis connection established');
    } catch (err: unknown) {
      this.isConnected = false;
      const msg = err instanceof Error ? err.message : String(err);
      if (this.allowMemoryFallback) {
        this.logger.warn(
          `Redis is unreachable (${msg}). Active in-memory fallback store enabled (DEV/TEST ONLY).`,
        );
      } else {
        this.logger.error(
          `Redis is unreachable (${msg}). In-memory fallback is disabled in ${this.isProduction ? 'PRODUCTION' : 'current environment'}.`,
        );
      }
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.isConnected && this.client.status === 'ready') {
      await this.client.quit();
    } else {
      this.client.disconnect();
    }
  }

  /**
   * Pings the actual Redis server.
   * If Redis is unavailable, throws an error so that /health accurately reports "redis: down".
   */
  async ping(): Promise<string> {
    if (!this.isConnected || this.client.status !== 'ready') {
      throw new Error('Redis is not connected');
    }
    return await this.client.ping();
  }

  get isLive(): boolean {
    return this.isConnected;
  }

  get isMemoryFallbackActive(): boolean {
    return !this.isConnected && this.allowMemoryFallback;
  }

  private handleUnavailable(operation: string): void {
    if (!this.allowMemoryFallback) {
      throw new ServiceUnavailableException(
        `Redis service is unavailable for operation '${operation}' and in-memory fallback is disabled.`,
      );
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.isConnected) {
      try {
        return await this.client.get(key);
      } catch (err: unknown) {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis GET failed: ${msg}`);
      }
    }

    this.handleUnavailable('GET');

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
        return ttlSeconds
          ? await this.client.set(key, value, 'EX', ttlSeconds)
          : await this.client.set(key, value);
      } catch (err: unknown) {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis SET failed: ${msg}`);
      }
    }

    this.handleUnavailable('SET');

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
      } catch (err: unknown) {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis DEL failed: ${msg}`);
      }
    }

    this.handleUnavailable('DEL');

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
      } catch (err: unknown) {
        this.isConnected = false;
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.warn(`Redis INCR failed: ${msg}`);
      }
    }

    this.handleUnavailable('INCR_WITH_EXPIRY');

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
