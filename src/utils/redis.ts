import { Redis } from 'ioredis';
import { createLogger } from './logger';

const logger = createLogger('redis');

export function createRedisClient() {
  // Choose Redis URL based on environment
  const isProduction = process.env.REDIS_ENV === 'production';
  const url = isProduction 
    ? process.env.UPSTASH_REDIS_URL 
    : process.env.REDIS_URL;
  
  if (!url) {
    logger.warn('No Redis URL provided, using fallback memory store');
    return null;
  }

  const client = new Redis(url, {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    }
  });

  client.on('error', (error) => {
    logger.error('Redis connection error:', error);
  });

  client.on('connect', () => {
    logger.info(`Redis connected successfully to ${isProduction ? 'production' : 'local'} instance`);
  });

  return client;
}

// Singleton instance
let redisClient: Redis | null = null;

export function getRedisClient() {
  if (!redisClient) {
    redisClient = createRedisClient();
  }
  return redisClient;
}