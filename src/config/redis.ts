import 'dotenv/config';
import { createClient, type RedisClientType } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const redisConnectTimeoutMs = Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 1000);
export const redisClient: RedisClientType = createClient({
  url: redisUrl,
  socket: {
    connectTimeout: redisConnectTimeoutMs,
    reconnectStrategy: (retries) => Math.min(250 * 2 ** retries, 2000),
  },
  disableOfflineQueue: true,
});
redisClient.on('error', (error) => console.error('Redis error:', error.message));

let connectionPromise: Promise<void> | null = null;

async function ensureConnected(): Promise<void> {
  if (redisClient.isReady) return;
  if (!connectionPromise) {
    connectionPromise = redisClient
      .connect()
      .then(() => undefined)
      .finally(() => {
        connectionPromise = null;
      });
  }
  await connectionPromise;
}

export async function initRedis() {
  await ensureConnected();
  await redisClient.ping();
}

export async function checkRedis(timeoutMs = 1000): Promise<number> {
  const startedAt = Date.now();
  await Promise.race([
    initRedis(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Redis health timeout')), timeoutMs)
    ),
  ]);
  return Date.now() - startedAt;
}

export async function redisSendCommand(...args: string[]): Promise<any> {
  await ensureConnected();
  return redisClient.sendCommand(args);
}

export async function closeRedis() {
  if (redisClient.isOpen) await redisClient.quit();
}
