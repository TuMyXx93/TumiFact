import { Router } from 'express';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateEmpleadoDTO, UpdateEmpleadoDTO } from './empleados.dto';
import { EmpleadosService } from './empleados.service';

export const empleadosRouter = Router();
const service = new EmpleadosService();

// GET /api/empleados — Directorio de colaboradores (Gerente / Admin)
empleadosRouter.get('/', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const list = await service.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/empleados/metricas — Métricas y KPIs de rendimiento de colaboradores (Gerente / Admin)
empleadosRouter.get(
  '/metricas',
  verifyAuth,
  requireRole('gerente', 'admin'),
  async (req, res, next) => {
    try {
      const metricas = await service.getMetricas();
      res.json(metricas);
    } catch (error) {
      next(error);
    }
  }
);

// GET /api/empleados/auditoria — Logs de auditoría de actividad de empleados (Solo Admin)
empleadosRouter.get('/auditoria', verifyAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const userId = req.query.usuario_id ? parseInt(String(req.query.usuario_id), 10) : undefined;
    const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
    const logs = await service.getAuditLogs(userId, limit);
    res.json(logs);
  } catch (error) {
    next(error);
  }
});

// GET /api/empleados/:id — Detalle de colaborador
empleadosRouter.get('/:id', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
    const emp = await service.getById(id);
    if (!emp) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(emp);
  } catch (error) {
    next(error);
  }
});

// POST /api/empleados — Registrar nuevo colaborador (Solo Admin)
empleadosRouter.post(
  '/',
  verifyAuth,
  requireRole('admin'),
  validateDTO(CreateEmpleadoDTO),
  async (req, res, next) => {
    try {
      const newEmp = await service.create(req.body, req);
      res.status(201).json({
        message: 'Empleado creado exitosamente',
        empleado: newEmp,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/empleados/:id — Actualizar datos de colaborador (Solo Admin)
empleadosRouter.put(
  '/:id',
  verifyAuth,
  requireRole('admin'),
  validateDTO(UpdateEmpleadoDTO),
  async (req, res, next) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = await service.update(id, req.body, req);
      if (!updated) return res.status(404).json({ error: 'Empleado no encontrado' });
      res.json({
        message: 'Empleado actualizado exitosamente',
        empleado: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PATCH /api/empleados/:id/toggle-status — Activar/desactivar colaborador (Solo Admin)
empleadosRouter.patch(
  '/:id/toggle-status',
  verifyAuth,
  requireRole('admin'),
  async (req, res, next) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const result = await service.toggleActive(id, req);
      if (!result) return res.status(404).json({ error: 'Empleado no encontrado' });
      res.json({
        message: result.activo ? 'Empleado activado' : 'Empleado desactivado',
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/empleados/:id — Eliminar colaborador (Solo Admin)
empleadosRouter.delete('/:id', verifyAuth, requireRole('admin'), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const result = await service.delete(id, req);
    if (!result) return res.status(404).json({ error: 'Empleado no encontrado' });
    res.json(result);
  } catch (error) {
    next(error);
  }
});
