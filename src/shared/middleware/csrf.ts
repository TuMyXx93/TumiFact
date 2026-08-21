import type { NextFunction, Request, Response } from 'express';
import { isAllowedOrigin } from '../../config/security';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function csrfOriginGuard(req: Request, res: Response, next: NextFunction) {
  if (
    !MUTATING_METHODS.has(req.method) ||
    !req.cookies?.tumifact_token ||
    req.headers.authorization?.startsWith('Bearer ')
  )
    return next();
  const origin = req.get('origin');
  if (!origin || !isAllowedOrigin(origin))
    return res
      .status(403)
      .json({
        error: 'Solicitud CSRF rechazada',
        code: 'CSRF_ORIGIN_REJECTED',
        correlationId: req.correlationId,
      });
  next();
}
