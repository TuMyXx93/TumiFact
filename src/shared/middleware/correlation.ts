import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

declare global {
  namespace Express {
    interface Request {
      correlationId?: string;
    }
  }
}

export function correlationId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.get('x-correlation-id')?.trim();
  const id = incoming && incoming.length <= 128 ? incoming : randomUUID();
  req.correlationId = id;
  res.setHeader('x-correlation-id', id);
  next();
}
