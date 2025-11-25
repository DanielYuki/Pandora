import { RedisService } from '@/services/redis.service';
import { UserService } from '@/services/user.service';
import { User } from '@/core/entities';
import logger from '@/utils/logger';

export class UserCacheService {
  private redis: RedisService;
  private userService: UserService;
  private readonly CACHE_TTL = 3600; // 1 hour in seconds // TODO: 10 minutes might be better
  private readonly CACHE_PREFIX = 'user:phone:';

  constructor() {
    this.redis = RedisService.getInstance();
    this.userService = new UserService();
  }

  /**
   * Generate cache key for phone number
   */
  private getCacheKey(phoneNumber: string): string {
    return `${this.CACHE_PREFIX}${phoneNumber}`;
  }

  /**
   * Get user by phone number with caching
   * First checks Redis cache, if not found, fetches from GraphQL and caches result
   */
  async getUserByPhone(phoneNumber: string): Promise<User | null> {
    try {
      const cacheKey = this.getCacheKey(phoneNumber);

      // Try to get from cache first
      if (this.redis.isAvailable()) {
        const cachedData = await this.redis.get(cacheKey);
        if (cachedData) {
          try {
            const user = JSON.parse(cachedData) as User;
            logger.debug(`🎯 Cache HIT for user ${phoneNumber}`);
            return user;
          } catch (parseError) {
            logger.warn(`⚠️ Failed to parse cached user data for ${phoneNumber}:`, parseError);
            // Continue to fetch from source if cache data is corrupted
          }
        } else {
          logger.debug(`🎯 Cache MISS for user ${phoneNumber}`);
        }
      }

      // Cache miss or Redis unavailable - fetch from GraphQL
      logger.debug(`🔍 Fetching user from GraphQL: ${phoneNumber}`);
      const user = await this.userService.getUserByPhone(phoneNumber);

      // Cache the result if Redis is available
      if (this.redis.isAvailable() && user) {
        try {
          const serializedUser = JSON.stringify(user);
          const cached = await this.redis.set(cacheKey, serializedUser, this.CACHE_TTL);
          if (cached) {
            logger.debug(`💾 Cached user data for ${phoneNumber} (TTL: ${this.CACHE_TTL}s)`);
          } else {
            logger.warn(`⚠️ Failed to cache user data for ${phoneNumber}`);
          }
        } catch (serializeError) {
          logger.warn(`⚠️ Failed to serialize user data for caching:`, serializeError);
        }
      }

      return user;
    } catch (error) {
      logger.error(`❌ Error in getUserByPhone with caching for ${phoneNumber}:`, error);

      // Fallback to direct GraphQL call if everything fails
      try {
        logger.debug(`🔄 Fallback to direct GraphQL call for ${phoneNumber}`);
        return await this.userService.getUserByPhone(phoneNumber);
      } catch (fallbackError) {
        logger.error(`❌ Fallback GraphQL call failed for ${phoneNumber}:`, fallbackError);
        return null;
      }
    }
  }

  /**
   * Check if user is registered with caching
   */
  async isUserRegistered(phoneNumber: string): Promise<boolean> {
    const user = await this.getUserByPhone(phoneNumber);
    return user !== null;
  }

  /**
   * Invalidate cache for a specific user
   */
  async invalidateUser(phoneNumber: string): Promise<boolean> {
    if (!this.redis.isAvailable()) {
      logger.debug(`⚠️ Redis not available, cannot invalidate cache for ${phoneNumber}`);
      return false;
    }

    try {
      const cacheKey = this.getCacheKey(phoneNumber);
      const deleted = await this.redis.del(cacheKey);

      if (deleted) {
        logger.debug(`🗑️ Cache invalidated for user ${phoneNumber}`);
      } else {
        logger.debug(`🗑️ No cache to invalidate for user ${phoneNumber}`);
      }

      return deleted;
    } catch (error) {
      logger.error(`❌ Error invalidating cache for ${phoneNumber}:`, error);
      return false;
    }
  }

  /**
   * Clear all user cache entries
   * Note: This is a potentially expensive operation in production
   */
  async clearAllUserCache(): Promise<boolean> {
    if (!this.redis.isAvailable()) {
      logger.warn(`⚠️ Redis not available, cannot clear user cache`);
      return false;
    }

    try {
      const client = this.redis.getClient();
      if (!client) return false;

      // Get all keys matching the pattern
      const keys = await client.keys(`${this.CACHE_PREFIX}*`);

      if (keys.length === 0) {
        logger.debug(`🗑️ No user cache entries to clear`);
        return true;
      }

      // Delete all matching keys
      const deleted = await client.del(keys);
      logger.info(`🗑️ Cleared ${deleted} user cache entries`);

      return deleted > 0;
    } catch (error) {
      logger.error(`❌ Error clearing all user cache:`, error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ totalKeys: number; isRedisAvailable: boolean }> {
    const stats = {
      totalKeys: 0,
      isRedisAvailable: this.redis.isAvailable(),
    };

    if (!this.redis.isAvailable()) {
      return stats;
    }

    try {
      const client = this.redis.getClient();
      if (!client) return stats;

      const keys = await client.keys(`${this.CACHE_PREFIX}*`);
      stats.totalKeys = keys.length;

      return stats;
    } catch (error) {
      logger.error(`❌ Error getting cache stats:`, error);
      return stats;
    }
  }
}
