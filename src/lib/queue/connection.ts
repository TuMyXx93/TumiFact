import IORedis from 'ioredis';
import { logger } from '../logger';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6380';

if (!REDIS_URL && process.env.NODE_ENV === 'production') {
  throw new Error('REDIS_URL env var is required in production');
}

export const queueConnection = new IORedis(REDIS_URL, {
  maxRetriesPerRequest: null, // Requerido por BullMQ
  enableOfflineQueue: false,
  connectTimeout: 1000,
  lazyConnect: process.env.NODE_ENV === 'test',
  retryStrategy(times) {
    if (process.env.NODE_ENV === 'test') return null;
    return Math.min(times * 100, 3000);
  },
});

queueConnection.on('error', (err) => {
  // No crashear en test si Redis no está
  if (process.env.NODE_ENV !== 'test') {
    logger.error({ err: err.message }, 'Queue Redis error');
  }
});

queueConnection.on('connect', () => {
  if (process.env.NODE_ENV !== 'test') {
    logger.info('Queue Redis connected');
  }
});
