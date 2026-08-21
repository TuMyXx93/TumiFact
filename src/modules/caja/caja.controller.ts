import { Router } from 'express';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { validateDTO } from '../../shared/middleware/validate';
import { AbrirCajaDTO, CerrarCajaDTO } from './caja.dto';
import { CajaService } from './caja.service';

export const cajaRouter = Router();
const service = new CajaService();

// POST /api/caja/abrir — Abrir sesión de caja
cajaRouter.post('/abrir', verifyAuth, validateDTO(AbrirCajaDTO), async (req, res, next) => {
  try {
    const result = await service.abrirCaja(req.user!.id, req.body, req);
    res.status(201).json({
      message: 'Caja abierta exitosamente',
      sesion: result,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/caja/estado — Estado actual de la caja del usuario
cajaRouter.get('/estado', verifyAuth, async (req, res, next) => {
  try {
    const result = await service.getActiveSession(req.user!.id);
    res.json({
      abierta: !!result,
      sesion: result,
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/caja/cerrar — Cerrar sesión de caja con arqueo y balance
cajaRouter.post('/cerrar', verifyAuth, validateDTO(CerrarCajaDTO), async (req, res, next) => {
  try {
    const result = await service.cerrarCaja(req.user!.id, req.body, req);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// GET /api/caja/historial — Historial de sesiones de caja (Gerente / Admin)
cajaRouter.get(
  '/historial',
  verifyAuth,
  requireRole('gerente', 'admin'),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const history = await service.getRecentSessions(limit);
      res.json(history);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/caja/activas — Todas las cajas abiertas con métricas en tiempo real (Gerente / Admin)
cajaRouter.get('/activas', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const activeSessions = await service.getAllActiveSessions();
    res.json(activeSessions);
  } catch (error) {
    next(error);
  }
});

// GET /api/caja/:id — Detalle de una sesión específica
cajaRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const session = await service.getSessionById(id);
    if (!session) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (req.user!.rol_nombre === 'cajero' && session.usuario_id !== req.user!.id)
      return res.status(404).json({ error: 'Sesión no encontrada' });
    res.json(session);
  } catch (error) {
    next(error);
  }
});
