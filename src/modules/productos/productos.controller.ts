import { Router } from 'express';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateProductoDTO, UpdateProductoDTO } from './productos.dto';
import { ProductosService } from './productos.service';

export const productosRouter = Router();
const service = new ProductosService();

// GET /api/productos/buscar?q=... — Búsqueda predictiva para el POS
productosRouter.get('/buscar', verifyAuth, async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      const all = await service.getAllProductos();
      return res.json(all);
    }
    const results = await service.searchProductos(query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/productos — Catálogo completo
productosRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const data = await service.getAllProductos();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/productos/:id — Detalle de producto
productosRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const data = await service.getProductoById(id);
    if (!data) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/productos — Crear producto (Gerente / Admin)
productosRouter.post(
  '/',
  verifyAuth,
  requireRole('gerente', 'admin'),
  validateDTO(CreateProductoDTO),
  async (req, res, next) => {
    try {
      const created = await service.createProducto(req.body, req);
      res.status(201).json(created);
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/productos/:id — Actualizar producto (Gerente / Admin)
productosRouter.put(
  '/:id',
  verifyAuth,
  requireRole('gerente', 'admin'),
  validateDTO(UpdateProductoDTO),
  async (req, res, next) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const updated = await service.updateProducto(id, req.body, req);
      if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json(updated);
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/productos/:id — Desactivar producto (Gerente / Admin)
productosRouter.delete(
  '/:id',
  verifyAuth,
  requireRole('gerente', 'admin'),
  async (req, res, next) => {
    try {
      const id = parseInt(String(req.params.id), 10);
      const deleted = await service.deleteProducto(id, req);
      if (!deleted) return res.status(404).json({ error: 'Producto no encontrado' });
      res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
);
