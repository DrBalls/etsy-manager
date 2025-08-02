import { type Redis } from 'ioredis';

import { type CacheProvider } from './cache-provider';

export interface RedisCacheConfig {
  keyPrefix?: string;
  defaultTTL?: number;
  scanCount?: number;
}

/**
 * Redis cache provider
 */
export class RedisCacheProvider implements CacheProvider {
  private redis: Redis;
  private config: Required<RedisCacheConfig>;

  constructor(redis: Redis, config: RedisCacheConfig = {}) {
    this.redis = redis;
    this.config = {
      keyPrefix: config.keyPrefix || 'etsy:cache:',
      defaultTTL: config.defaultTTL || 300,
      scanCount: config.scanCount || 100,
    };
  }

  private getKey(key: string): string {
    return `${this.config.keyPrefix}${key}`;
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(this.getKey(key));
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      const seconds = ttl || this.config.defaultTTL;
      await this.redis.setex(this.getKey(key), seconds, value);
    } catch (error) {
      console.error('Redis set error:', error);
      // Fail silently for caching
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      console.error('Redis delete error:', error);
    }
  }

  async clear(pattern?: string): Promise<void> {
    try {
      const searchPattern = pattern
        ? `${this.config.keyPrefix}*${pattern}*`
        : `${this.config.keyPrefix}*`;

      // Use SCAN to find keys (safer than KEYS for production)
      const stream = this.redis.scanStream({
        match: searchPattern,
        count: this.config.scanCount,
      });

      const pipeline = this.redis.pipeline();
      let keysToDelete = 0;

      stream.on('data', (keys: string[]) => {
        if (keys.length > 0) {
          keys.forEach((key) => pipeline.del(key));
          keysToDelete += keys.length;
        }
      });

      await new Promise<void>((resolve, reject) => {
        stream.on('end', () => {
          if (keysToDelete > 0) {
            pipeline
              .exec()
              .then(() => resolve())
              .catch(reject);
          } else {
            resolve();
          }
        });
        stream.on('error', reject);
      });
    } catch (error) {
      console.error('Redis clear error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(this.getKey(key));
      return result === 1;
    } catch (error) {
      console.error('Redis exists error:', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    connected: boolean;
    memoryUsage?: number;
    keys?: number;
  }> {
    try {
      const info = await this.redis.info('memory');
      const dbSize = await this.redis.dbsize();

      // Parse memory usage from info
      const memoryMatch = info.match(/used_memory:(\d+)/);
      const memoryUsage = memoryMatch?.[1] ? parseInt(memoryMatch[1], 10) : undefined;

      return {
        connected: this.redis.status === 'ready',
        memoryUsage,
        keys: dbSize,
      };
    } catch {
      return {
        connected: false,
      };
    }
  }

  /**
   * Health check
   */
  async ping(): Promise<boolean> {
    try {
      const result = await this.redis.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }
}
