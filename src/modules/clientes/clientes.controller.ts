import { Request, Response, Router } from 'express';
import { ClientesService } from './clientes.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateClienteDTO, UpdateClienteDTO } from './clientes.dto';

export const clientesRouter = Router();
const service = new ClientesService();

clientesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const data = await service.getClientes();
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
});

clientesRouter.get('/buscar', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const data = await service.searchClientes(q);
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al buscar clientes' });
  }
});

clientesRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const item = await service.getClienteById(id);
    if (!item) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(item);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener cliente' });
  }
});

clientesRouter.post('/', validateDTO(CreateClienteDTO), async (req: Request, res: Response) => {
  try {
    const created = await service.createCliente(req.body);
    res.status(201).json(created);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear cliente' });
  }
});

clientesRouter.put('/:id', validateDTO(UpdateClienteDTO), async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await service.updateCliente(id, req.body);
    if (!updated) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar cliente' });
  }
});

clientesRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    const success = await service.deleteCliente(id);
    if (!success) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado exitosamente', id });
  } catch (error: any) {
    const code = error?.code || error?.cause?.code || error?.driverError?.code || error?.originalError?.code;
    const isFkError = code === '23503' || /foreign key constraint/i.test(error?.message || '') || /foreign key constraint/i.test(error?.cause?.message || '');

    if (isFkError) {
      return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene facturas asociadas' });
    }
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
});
