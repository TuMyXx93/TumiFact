import { Router } from 'express';
import { ProveedoresService } from './proveedores.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateProveedorDTO, UpdateProveedorDTO } from './proveedores.dto';
import { verifyAuth, requireRole, optionalAuth } from '../../shared/middleware/auth';

export const proveedoresRouter = Router();
const service = new ProveedoresService();

// GET /api/proveedores — Directorio de proveedores
proveedoresRouter.get('/', optionalAuth, async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (query && query.trim()) {
      const results = await service.search(query.trim());
      return res.json(results);
    }
    const list = await service.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/proveedores/:id — Detalle de proveedor
proveedoresRouter.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const p = await service.getById(id);
    if (!p) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json(p);
  } catch (error) {
    next(error);
  }
});

// POST /api/proveedores — Crear proveedor (Gerente / Admin)
proveedoresRouter.post('/', verifyAuth, requireRole('gerente', 'admin'), validateDTO(CreateProveedorDTO), async (req, res, next) => {
  try {
    const created = await service.create(req.body, req);
    res.status(201).json({
      message: 'Proveedor registrado exitosamente',
      proveedor: created
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/proveedores/:id — Actualizar proveedor (Gerente / Admin)
proveedoresRouter.put('/:id', verifyAuth, requireRole('gerente', 'admin'), validateDTO(UpdateProveedorDTO), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const updated = await service.update(id, req.body, req);
    if (!updated) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({
      message: 'Proveedor actualizado exitosamente',
      proveedor: updated
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/proveedores/:id — Desactivar proveedor (Admin)
proveedoresRouter.delete('/:id', verifyAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const ok = await service.delete(id, req);
    if (!ok) return res.status(404).json({ error: 'Proveedor no encontrado' });
    res.json({ message: 'Proveedor eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});
