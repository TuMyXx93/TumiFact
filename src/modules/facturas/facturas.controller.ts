import { Router } from 'express';
import { verifyAuth } from '../../shared/middleware/auth';
import { ensureIdempotencyKey } from '../../shared/middleware/idempotency';
import { validateDTO } from '../../shared/middleware/validate';
import { CajaService } from '../caja/caja.service';
import { CreateFacturaDTO } from './facturas.dto';
import { FacturasService } from './facturas.service';

export const facturasRouter = Router();
const service = new FacturasService();
const cajaService = new CajaService();

// POST /api/facturas — Crear nueva factura con cálculo de subtotales, descuentos e idempotencia
facturasRouter.post(
  '/',
  verifyAuth,
  ensureIdempotencyKey,
  validateDTO(CreateFacturaDTO),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const activeCaja = await cajaService.getActiveSession(userId);

      const result = await service.createFactura(req.body, userId, activeCaja?.id, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/facturas/:id/imprimir — Factura completa con detalles y configuración para tiquete térmico
facturasRouter.get('/:id/imprimir', verifyAuth, async (req, res, next) => {
  try {
    const data = await service.getFacturaWithDetails(parseInt(String(req.params.id), 10));
    if (!data) return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
    if (req.user!.rol_nombre === 'cajero' && data.factura.usuario_id !== req.user!.id)
      return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/facturas/:id/detalles — Solo líneas de productos
facturasRouter.get('/:id/detalles', verifyAuth, async (req, res, next) => {
  try {
    const data = await service.getFacturaDetailsOnly(parseInt(String(req.params.id), 10));
    if (!data) return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
    if (req.user!.rol_nombre === 'cajero' && data.factura.usuario_id !== req.user!.id)
      return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

export const ventasRouter = Router();

// GET /api/ventas — Historial de ventas con filtros de fecha, cajero y estado
ventasRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const desde = req.query.desde ? String(req.query.desde) : undefined;
    const hasta = req.query.hasta ? String(req.query.hasta) : undefined;
    const usuarioId = req.query.usuario_id
      ? parseInt(req.query.usuario_id as string, 10)
      : undefined;
    const estado = req.query.estado ? String(req.query.estado) : undefined;

    const scopedUserId = req.user!.rol_nombre === 'cajero' ? req.user!.id : usuarioId;
    const data = await service.getSalesHistory(desde, hasta, scopedUserId, estado);
    res.json(data);
  } catch (error) {
    next(error);
  }
});
