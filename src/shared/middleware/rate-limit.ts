import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisSendCommand } from '../../config/redis';
import { ipKeyGenerator } from 'express-rate-limit';

const apiStore = new RedisStore({
  prefix: 'tumifact:rl:',
  sendCommand: redisSendCommand
});
const refreshStore = new RedisStore({ prefix: 'tumifact:rl:refresh:', sendCommand: redisSendCommand });

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: apiStore,
  message: { error: 'Límite de solicitudes excedido', code: 'RATE_LIMITED' }
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.REFRESH_RATE_LIMIT || 20),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  store: refreshStore,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || 'unknown')}:refresh`,
  message: { error: 'Demasiadas renovaciones de sesión', code: 'RATE_LIMITED' }
});
