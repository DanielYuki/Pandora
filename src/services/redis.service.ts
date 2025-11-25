import { createClient, RedisClientType } from 'redis';
import logger from '@/utils/logger';
import config from '@/utils/config';

export class RedisService {
  private static instance: RedisService;
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private isConnecting: boolean = false;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): RedisService {
    if (!RedisService.instance) {
      RedisService.instance = new RedisService();
    }
    return RedisService.instance;
  }

  /**
   * Initialize and connect to Redis
   */
  public async connect(): Promise<void> {
    if (this.isConnected || this.isConnecting) {
      return;
    }

    try {
      this.isConnecting = true;

      const redisUrl = config.REDIS_URL;
      if (!redisUrl) {
        logger.warn('⚠️ Redis URL not configured, Redis features will be disabled');
        return;
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000,
          reconnectStrategy: (retries: number) => {
            if (retries > 5) {
              logger.error('❌ Redis connection failed after 5 retries');
              return new Error('Too many Redis connection retries');
            }
            const delay = Math.min(retries * 100, 3000);
            logger.info(`🔄 Retrying Redis connection in ${delay}ms (attempt ${retries + 1})`);
            return delay;
          },
        },
      });

      // Set up event listeners
      this.client.on('error', (err: Error) => {
        logger.error('❌ Redis client error:', err);
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('🔗 Redis client connecting...');
      });

      this.client.on('ready', () => {
        logger.info('✅ Redis client ready');
        this.isConnected = true;
      });

      this.client.on('end', () => {
        logger.warn('🔚 Redis connection ended');
        this.isConnected = false;
      });

      this.client.on('reconnecting', () => {
        logger.info('🔄 Redis reconnecting...');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('🚀 Redis service initialized');
    } catch (error) {
      logger.error('❌ Failed to connect to Redis:', error);
      this.isConnected = false;
      this.client = null;
    } finally {
      this.isConnecting = false;
    }
  }

  /**
   * Disconnect from Redis
   */
  public async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      try {
        await this.client.quit();
        logger.info('👋 Redis disconnected gracefully');
      } catch (error) {
        logger.error('❌ Error disconnecting from Redis:', error);
      } finally {
        this.isConnected = false;
        this.client = null;
      }
    }
  }

  /**
   * Check if Redis is available
   */
  public isAvailable(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get Redis client
   */
  public getClient(): RedisClientType | null {
    if (!this.isAvailable()) {
      logger.warn('⚠️ Redis client requested but not available');
      return null;
    }
    return this.client;
  }

  /**
   * Set a key-value pair with optional expiration
   */
  public async set(key: string, value: string, expirationInSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      if (!client) return false;

      if (expirationInSeconds) {
        await client.setEx(key, expirationInSeconds, value);
      } else {
        await client.set(key, value);
      }

      return true;
    } catch (error) {
      logger.error(`❌ Redis SET error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Get value by key
   */
  public async get(key: string): Promise<string | null> {
    if (!this.isAvailable()) {
      return null;
    }

    try {
      const client = this.getClient();
      if (!client) return null;

      return await client.get(key);
    } catch (error) {
      logger.error(`❌ Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete a key
   */
  public async del(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      if (!client) return false;

      const result = await client.del(key);
      return result > 0;
    } catch (error) {
      logger.error(`❌ Redis DEL error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Check if key exists
   */
  public async exists(key: string): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      if (!client) return false;

      const result = await client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error(`❌ Redis EXISTS error for key ${key}:`, error);
      return false;
    }
  }

  /**
   * Set key with expiration (NX - only if not exists)
   */
  public async setNX(key: string, value: string, expirationInSeconds?: number): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      const client = this.getClient();
      if (!client) return false;

      let result;
      if (expirationInSeconds) {
        result = await client.set(key, value, {
          NX: true,
          EX: expirationInSeconds,
        });
      } else {
        result = await client.set(key, value, { NX: true });
      }

      return result === 'OK';
    } catch (error) {
      logger.error(`❌ Redis SETNX error for key ${key}:`, error);
      return false;
    }
  }
}
