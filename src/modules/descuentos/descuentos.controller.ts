import { Router } from 'express';
import { DescuentosService } from './descuentos.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateDescuentoDTO, UpdateDescuentoDTO } from './descuentos.dto';
import { verifyAuth, requireRole } from '../../shared/middleware/auth';

export const descuentosRouter = Router();
const service = new DescuentosService();

// GET /api/descuentos — Listar descuentos activos para POS
descuentosRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const list = await service.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/descuentos/:id — Detalle de descuento
descuentosRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const d = await service.getById(id);
    if (!d) return res.status(404).json({ error: 'Descuento no encontrado' });
    res.json(d);
  } catch (error) {
    next(error);
  }
});

// POST /api/descuentos — Crear nuevo descuento (Gerente / Admin)
descuentosRouter.post('/', verifyAuth, requireRole('gerente', 'admin'), validateDTO(CreateDescuentoDTO), async (req, res, next) => {
  try {
    const created = await service.create(req.body, req);
    res.status(201).json({
      message: 'Descuento creado exitosamente',
      descuento: created
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/descuentos/:id — Actualizar descuento (Gerente / Admin)
descuentosRouter.put('/:id', verifyAuth, requireRole('gerente', 'admin'), validateDTO(UpdateDescuentoDTO), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const updated = await service.update(id, req.body, req);
    if (!updated) return res.status(404).json({ error: 'Descuento no encontrado' });
    res.json({
      message: 'Descuento actualizado exitosamente',
      descuento: updated
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/descuentos/:id — Desactivar descuento (Gerente / Admin)
descuentosRouter.delete('/:id', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const ok = await service.delete(id, req);
    if (!ok) return res.status(404).json({ error: 'Descuento no encontrado' });
    res.json({ message: 'Descuento eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});
