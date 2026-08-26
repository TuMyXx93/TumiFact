import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisSendCommand } from '../../config/redis';

const apiStore = new RedisStore({
  prefix: 'tumifact:rl:',
  sendCommand: redisSendCommand,
});
const refreshStore = new RedisStore({
  prefix: 'tumifact:rl:refresh:',
  sendCommand: redisSendCommand,
});

export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: true,
  store: apiStore,
  // Readiness probes are infrastructure traffic, not business API usage.
  // Exempting this endpoint prevents browser/container health checks from
  // exhausting the user-facing quota and returning false 429 outages.
  skip: (req) => req.method === 'GET' && req.path === '/health/db',
  message: { error: 'Límite de solicitudes excedido', code: 'RATE_LIMITED' },
});

export const refreshRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.REFRESH_RATE_LIMIT || 20),
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  passOnStoreError: true,
  store: refreshStore,
  keyGenerator: (req) => `${ipKeyGenerator(req.ip || 'unknown')}:refresh`,
  message: { error: 'Demasiadas renovaciones de sesión', code: 'RATE_LIMITED' },
});
