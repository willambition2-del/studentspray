import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

describe('RedisService Environment & Fallback Behavior', () => {
  describe('Production Environment (NODE_ENV=production)', () => {
    let service: RedisService;
    let mockConfig: ConfigService;

    beforeEach(() => {
      mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'production';
          if (key === 'REDIS_ALLOW_MEMORY_FALLBACK') return 'true'; // Attempting to force fallback in prod
          return undefined;
        }),
      } as unknown as ConfigService;

      service = new RedisService(mockConfig);
    });

    afterEach(async () => {
      await service.onApplicationShutdown();
    });

    it('strictly disables in-memory fallback even if REDIS_ALLOW_MEMORY_FALLBACK is set to true', () => {
      expect(service.isMemoryFallbackActive).toBe(false);
    });

    it('throws ServiceUnavailableException on operations when Redis is disconnected', async () => {
      await expect(service.get('any-key')).rejects.toThrow(ServiceUnavailableException);
      await expect(service.set('any-key', 'val')).rejects.toThrow(ServiceUnavailableException);
      await expect(service.del('any-key')).rejects.toThrow(ServiceUnavailableException);
      await expect(service.incrementWithExpiry('rate-key', 60)).rejects.toThrow(
        ServiceUnavailableException,
      );
    });

    it('throws error on ping() when disconnected to ensure health check reports down', async () => {
      await expect(service.ping()).rejects.toThrow('Redis is not connected');
    });
  });

  describe('Development Environment with Fallback Disabled (REDIS_ALLOW_MEMORY_FALLBACK=false)', () => {
    let service: RedisService;
    let mockConfig: ConfigService;

    beforeEach(() => {
      mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'development';
          if (key === 'REDIS_ALLOW_MEMORY_FALLBACK') return false;
          return undefined;
        }),
      } as unknown as ConfigService;

      service = new RedisService(mockConfig);
    });

    afterEach(async () => {
      await service.onApplicationShutdown();
    });

    it('disables in-memory fallback when explicitly configured as false', () => {
      expect(service.isMemoryFallbackActive).toBe(false);
    });

    it('throws ServiceUnavailableException on operations when disconnected', async () => {
      await expect(service.get('test')).rejects.toThrow(ServiceUnavailableException);
    });
  });

  describe('Development / Test Environment with Fallback Enabled', () => {
    let service: RedisService;
    let mockConfig: ConfigService;

    beforeEach(() => {
      mockConfig = {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return 'test';
          if (key === 'REDIS_ALLOW_MEMORY_FALLBACK') return 'true';
          return undefined;
        }),
      } as unknown as ConfigService;

      service = new RedisService(mockConfig);
    });

    afterEach(async () => {
      await service.onApplicationShutdown();
    });

    it('enables in-memory fallback when disconnected in test/development', () => {
      expect(service.isMemoryFallbackActive).toBe(true);
    });

    it('accurately reports ping() failure even when memory fallback is active', async () => {
      await expect(service.ping()).rejects.toThrow('Redis is not connected');
    });

    it('stores, retrieves, and deletes values in memory store', async () => {
      expect(await service.get('key1')).toBeNull();
      expect(await service.set('key1', 'hello')).toBe('OK');
      expect(await service.get('key1')).toBe('hello');
      expect(await service.del('key1')).toBe(1);
      expect(await service.get('key1')).toBeNull();
    });

    it('supports rate-limiting counter with incrementWithExpiry in memory', async () => {
      expect(await service.incrementWithExpiry('rate:123', 60)).toBe(1);
      expect(await service.incrementWithExpiry('rate:123', 60)).toBe(2);
      expect(await service.incrementWithExpiry('rate:123', 60)).toBe(3);
    });

    it('expires keys based on TTL in memory store', async () => {
      await service.set('tempKey', 'tempVal', 0.05); // 50ms TTL
      expect(await service.get('tempKey')).toBe('tempVal');
      await new Promise((resolve) => setTimeout(resolve, 80));
      expect(await service.get('tempKey')).toBeNull();
    });
  });
});
