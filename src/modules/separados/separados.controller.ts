import { Router } from 'express';
import { verifyAuth } from '../../shared/middleware/auth';
import { ensureIdempotencyKey } from '../../shared/middleware/idempotency';
import { validateDTO } from '../../shared/middleware/validate';
import { CajaService } from '../caja/caja.service';
import { CreateSeparadoDTO, RegistrarAbonoDTO } from './separados.dto';
import { SeparadosService } from './separados.service';

export const separadosRouter = Router();
const service = new SeparadosService();
const cajaService = new CajaService();

// GET /api/separados — Listar todos los separados (filtros por estado)
separadosRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const estado = req.query.estado as string;
    const scopedUserId = req.user!.rol_nombre === 'cajero' ? req.user!.id : undefined;
    const list = await service.getAllSeparados(estado, scopedUserId);
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/separados/:id — Detalle del separado con productos e historial de abonos
separadosRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const item = await service.getSeparadoById(id);
    if (!item) return res.status(404).json({ error: 'Separado no encontrado' });
    if (req.user!.rol_nombre === 'cajero' && item.usuario_apertura_id !== req.user!.id)
      return res.status(404).json({ error: 'Separado no encontrado' });
    res.json(item);
  } catch (error) {
    next(error);
  }
});

// POST /api/separados — Crear nuevo separado (con abono inicial y reserva de inventario)
separadosRouter.post(
  '/',
  verifyAuth,
  ensureIdempotencyKey,
  validateDTO(CreateSeparadoDTO),
  async (req, res, next) => {
    try {
      const userId = req.user!.id;
      const activeCaja = await cajaService.getActiveSession(userId);

      const result = await service.createSeparado(req.body, userId, activeCaja?.id, req);
      res.status(201).json({
        message: 'Separado creado exitosamente',
        separado: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// POST /api/separados/:id/abonos — Registrar abono en efectivo/tarjeta/transferencia
separadosRouter.post(
  '/:id/abonos',
  verifyAuth,
  ensureIdempotencyKey,
  validateDTO(RegistrarAbonoDTO),
  async (req, res, next) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const existing = await service.getSeparadoById(id);
      if (
        !existing ||
        (req.user!.rol_nombre === 'cajero' && existing.usuario_apertura_id !== req.user!.id)
      )
        return res.status(404).json({ error: 'Separado no encontrado' });
      const userId = req.user!.id;
      const activeCaja = await cajaService.getActiveSession(userId);

      const result = await service.registrarAbono(id, req.body, userId, activeCaja?.id, req);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }
);
