import type { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4, validate as validateUuid } from 'uuid';

export function ensureIdempotencyKey(req: Request, res: Response, next: NextFunction) {
  const rawKey = (req.headers['idempotency-key'] as string) || req.body?.idempotency_key;
  let key = rawKey;

  // Claves no UUID se descartan y se genera una clave válida (R-006).
  if (rawKey && !validateUuid(rawKey)) {
    key = undefined;
  }

  const generatedByServer = !key;
  if (!key) {
    key = uuidv4();
  }

  req.body = req.body || {};
  req.body.idempotency_key = key;
  req.body.idempotency_key_origin = generatedByServer ? 'server-generated' : 'client-provided';
  res.setHeader('Idempotency-Key', key);
  next();
}
