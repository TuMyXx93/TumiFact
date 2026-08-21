import type { NextFunction, Request, Response } from 'express';
import { logger } from '../../lib/logger';

export function requestLogging(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test') return next();
  const startedAt = Date.now();
  res.on('finish', () => {
    logger.info(
      {
        event: 'http.request',
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
        correlationId: req.correlationId,
      },
      `${req.method} ${req.originalUrl} → ${res.statusCode}`
    );
  });
  next();
}
