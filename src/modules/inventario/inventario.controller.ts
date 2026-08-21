import { Router } from 'express';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { ensureIdempotencyKey } from '../../shared/middleware/idempotency';
import { validateDTO } from '../../shared/middleware/validate';
import { AjusteStockRapidoDTO, MovimientoInventarioDTO } from './inventario.dto';
import { InventarioService } from './inventario.service';

export const inventarioRouter = Router();
const service = new InventarioService();

// GET /api/inventario/movimientos — Listado de kardex / movimientos
inventarioRouter.get(
  '/movimientos',
  verifyAuth,
  requireRole('gerente', 'admin'),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 50;
      const productoId = req.query.producto_id
        ? parseInt(req.query.producto_id as string, 10)
        : undefined;
      const list = await service.getMovimientos(limit, productoId);
      res.json(list);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/inventario/stock-critico — Alertas de productos bajo stock mínimo
inventarioRouter.get('/stock-critico', verifyAuth, async (req, res, next) => {
  try {
    const list = await service.getStockCritico();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// POST /api/inventario/movimientos — Registrar entrada / salida de stock (Gerente / Admin)
inventarioRouter.post(
  '/movimientos',
  verifyAuth,
  requireRole('gerente', 'admin'),
  ensureIdempotencyKey,
  validateDTO(MovimientoInventarioDTO),
  async (req, res, next) => {
    try {
      const result = await service.registrarMovimiento(req.body, req.user?.id, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/inventario/ajuste-rapido — Ajuste directo de stock (Gerente / Admin)
inventarioRouter.post(
  '/ajuste-rapido',
  verifyAuth,
  requireRole('gerente', 'admin'),
  validateDTO(AjusteStockRapidoDTO),
  async (req, res, next) => {
    try {
      const result = await service.ajusteStockRapido(req.body, req.user?.id, req);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
);
