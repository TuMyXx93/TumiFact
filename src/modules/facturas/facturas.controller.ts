import { Request, Response, Router } from 'express';
import { FacturasService } from './facturas.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateFacturaDTO } from './facturas.dto';

export const facturasRouter = Router();
const service = new FacturasService();

facturasRouter.post('/', validateDTO(CreateFacturaDTO), async (req: Request, res: Response) => {
  try {
    const result = await service.createFactura(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    if (error.statusCode === 400) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Error al crear la factura' });
  }
});

facturasRouter.get('/:id/imprimir', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await service.getFacturaWithDetails(id);
    if (!data) return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener datos de factura' });
  }
});

facturasRouter.get('/:id/detalles', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const data = await service.getFacturaDetailsOnly(id);
    if (!data) return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener detalles de la factura' });
  }
});

export const ventasRouter = Router();
ventasRouter.get('/', async (req: Request, res: Response) => {
  try {
    const desde = req.query.desde ? String(req.query.desde) : undefined;
    const hasta = req.query.hasta ? String(req.query.hasta) : undefined;
    const data = await service.getSalesHistory(desde, hasta);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al cargar el historial de ventas' });
  }
});
