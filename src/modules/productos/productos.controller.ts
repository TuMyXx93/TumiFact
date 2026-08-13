import { Request, Response, Router } from 'express';
import { ProductosService } from './productos.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateProductoDTO, UpdateProductoDTO } from './productos.dto';

export const productosRouter = Router();
const service = new ProductosService();

productosRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await service.getProductos();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener productos', message: error.message });
  }
});

productosRouter.get('/buscar', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const data = await service.searchProductos(q);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al buscar productos' });
  }
});

productosRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await service.getProductoById(id);
    if (!item) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener producto' });
  }
});

productosRouter.post('/', validateDTO(CreateProductoDTO), async (req: Request, res: Response) => {
  try {
    const created = await service.createProducto(req.body);
    res.status(201).json({ message: 'Producto creado exitosamente', ...created });
  } catch (error: any) {
    if (error.statusCode === 400 || error.code === '23505') {
      return res.status(400).json({ error: error.message || 'Ya existe un producto con ese código' });
    }
    res.status(500).json({ error: 'Error al crear producto' });
  }
});

productosRouter.put('/:id', validateDTO(UpdateProductoDTO), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await service.updateProducto(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto actualizado exitosamente', ...updated });
  } catch (error: any) {
    if (error.statusCode === 400 || error.code === '23505') {
      return res.status(400).json({ error: error.message || 'Ya existe un producto con ese código' });
    }
    res.status(500).json({ error: 'Error al actualizar producto' });
  }
});

productosRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await service.deleteProducto(id);
    if (!success) return res.status(404).json({ error: 'Producto no encontrado' });
    res.json({ message: 'Producto eliminado exitosamente', id });
  } catch (error: any) {
    const code = error?.code || error?.cause?.code || error?.driverError?.code || error?.originalError?.code;
    const isFkError = code === '23503' || /foreign key constraint/i.test(error?.message || '') || /foreign key constraint/i.test(error?.cause?.message || '');

    if (isFkError) {
      return res.status(400).json({ error: 'No se puede eliminar el producto porque está referenciado en facturas' });
    }
    res.status(500).json({ error: 'Error al eliminar producto' });
  }
});
