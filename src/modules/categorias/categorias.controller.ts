import { Router } from 'express';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateCategoriaDTO, UpdateCategoriaDTO } from './categorias.dto';
import { CategoriasService } from './categorias.service';

export const categoriasRouter = Router();
const service = new CategoriasService();

// GET /api/categorias — Listar todas las categorías activas (Público/Autenticado)
categoriasRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const list = await service.getAll();
    res.json(list);
  } catch (error) {
    next(error);
  }
});

// GET /api/categorias/:id — Detalle de categoría
categoriasRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const cat = await service.getById(id);
    if (!cat) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json(cat);
  } catch (error) {
    next(error);
  }
});

// POST /api/categorias — Crear nueva categoría (Gerente / Admin)
categoriasRouter.post(
  '/',
  verifyAuth,
  requireRole('gerente', 'admin'),
  validateDTO(CreateCategoriaDTO),
  async (req, res, next) => {
    try {
      const created = await service.create(req.body, req);
      res.status(201).json({
        message: 'Categoría creada exitosamente',
        categoria: created,
      });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/categorias/:id — Actualizar categoría (Gerente / Admin)
categoriasRouter.put(
  '/:id',
  verifyAuth,
  requireRole('gerente', 'admin'),
  validateDTO(UpdateCategoriaDTO),
  async (req, res, next) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = await service.update(id, req.body, req);
      if (!updated) return res.status(404).json({ error: 'Categoría no encontrada' });
      res.json({
        message: 'Categoría actualizada exitosamente',
        categoria: updated,
      });
    } catch (error) {
      next(error);
    }
  }
);
