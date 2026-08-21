import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

export function ensureIdempotencyKey(req: Request, res: Response, next: NextFunction) {
  let key = (req.headers['idempotency-key'] as string) || req.body?.idempotency_key;

  if (key && !validateUuid(key)) {
    // If client sent non-UUID string, accept or convert or warn
  }

  if (!key) {
    key = uuidv4();
  }

  req.body = req.body || {};
  req.body.idempotency_key = key;
  res.setHeader('Idempotency-Key', key);
  next();
}
