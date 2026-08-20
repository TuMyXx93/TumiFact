import { Router } from 'express';
import { ClientesService } from './clientes.service';
import { validateDTO } from '../../shared/middleware/validate';
import { CreateClienteDTO, UpdateClienteDTO } from './clientes.dto';
import { verifyAuth } from '../../shared/middleware/auth';

export const clientesRouter = Router();
const service = new ClientesService();

// GET /api/clientes/buscar?q=... — Búsqueda de clientes para POS
clientesRouter.get('/buscar', verifyAuth, async (req, res, next) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      const all = await service.getAllClientes();
      return res.json(all);
    }
    const results = await service.searchClientes(query);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

// GET /api/clientes — Directorio de clientes
clientesRouter.get('/', verifyAuth, async (req, res, next) => {
  try {
    const data = await service.getAllClientes();
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/clientes/:id — Detalle de cliente
clientesRouter.get('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const data = await service.getClienteById(id);
    if (!data) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// POST /api/clientes — Crear cliente
clientesRouter.post('/', verifyAuth, validateDTO(CreateClienteDTO), async (req, res, next) => {
  try {
    const created = await service.createCliente(req.body, req);
    res.status(201).json(created);
  } catch (error) {
    next(error);
  }
});

// PUT /api/clientes/:id — Actualizar cliente
clientesRouter.put('/:id', verifyAuth, validateDTO(UpdateClienteDTO), async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const updated = await service.updateCliente(id, req.body, req);
    if (!updated) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json(updated);
  } catch (error) {
    next(error);
  }
});

// DELETE /api/clientes/:id — Eliminar cliente
clientesRouter.delete('/:id', verifyAuth, async (req, res, next) => {
  try {
    const id = parseInt(String(req.params.id), 10);
    const deleted = await service.deleteCliente(id, req);
    if (!deleted) return res.status(404).json({ error: 'Cliente no encontrado' });
    res.json({ message: 'Cliente eliminado exitosamente' });
  } catch (error) {
    next(error);
  }
});
