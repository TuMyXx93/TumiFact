import 'dotenv/config';
import { randomBytes } from 'node:crypto';

const configuredJwtSecret = process.env.JWT_SECRET?.trim();

if (process.env.NODE_ENV === 'production' && !configuredJwtSecret) {
  throw new Error('JWT_SECRET es obligatorio en producción');
}

// Development/test-only ephemeral secret: it is never valid across restarts.
export const JWT_SECRET = configuredJwtSecret || randomBytes(32).toString('hex');

const configuredOrigins = process.env.CORS_ORIGIN
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (process.env.NODE_ENV === 'production' && (!configuredOrigins || configuredOrigins.length === 0)) {
  throw new Error('CORS_ORIGIN es obligatorio en producción');
}

export const CORS_ORIGINS = configuredOrigins?.length
  ? configuredOrigins
  : ['http://localhost:4321', 'http://127.0.0.1:4321'];

export function isAllowedOrigin(origin: string): boolean {
  return CORS_ORIGINS.includes(origin);
}
