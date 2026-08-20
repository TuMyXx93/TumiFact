import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
export const redisClient: RedisClientType = createClient({ url: redisUrl });
redisClient.on('error', (error) => console.error('Redis error:', error.message));

export async function initRedis() {
  if (!redisClient.isOpen) await redisClient.connect();
  await redisClient.ping();
}

export async function redisSendCommand(...args: string[]): Promise<any> {
  if (!redisClient.isOpen) await redisClient.connect();
  return redisClient.sendCommand(args);
}

export async function closeRedis() {
  if (redisClient.isOpen) await redisClient.quit();
}
