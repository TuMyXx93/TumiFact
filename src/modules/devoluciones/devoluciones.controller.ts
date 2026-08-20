import { Router } from 'express';
import { DevolucionesService } from './devoluciones.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateDevolucionDTO } from './devoluciones.dto';
import { verifyAuth, requireRole } from '../../shared/middleware/auth';
import { ensureIdempotencyKey } from '../../shared/middleware/idempotency';
import { CajaService } from '../caja/caja.service';

export const devolucionesRouter = Router();
const service = new DevolucionesService();
const cajaService = new CajaService();

// GET /api/devoluciones — Historial de devoluciones
devolucionesRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const list = await service.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/devoluciones/:id — Detalle de devolución
devolucionesRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const item = await service.getById(id);
    if (!item) return res.status(404).json({ error: 'Devolución no encontrada' });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/devoluciones — Registrar devolución o cambio de mercancía
devolucionesRouter.post(
  '/',
  verifyAuth,
  requireRole('gerente', 'admin'),
  ensureIdempotencyKey,
  validateDTO(CreateDevolucionDTO),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const activeCaja = await cajaService.getActiveSession(userId);

      const result = await service.create(req.body, userId, activeCaja?.id, req);
      res.status(201).json({
        message: 'Devolución procesada exitosamente',
        devolucion: result
      });
    } catch (error) {
      next(error);
    }
  }
);
