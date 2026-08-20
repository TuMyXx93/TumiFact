import type { Request, Response, NextFunction } from 'express';

export function requestLogging(req: Request, res: Response, next: NextFunction) {
  if (process.env.NODE_ENV === 'test') return next();
  const startedAt = Date.now();
  res.on('finish', () => {
    console.info(JSON.stringify({
      event: 'http.request', method: req.method, path: req.originalUrl,
      status: res.statusCode, durationMs: Date.now() - startedAt,
      correlationId: req.correlationId
    }));
  });
  next();
}
