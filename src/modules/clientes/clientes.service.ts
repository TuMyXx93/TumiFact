import type { Request } from 'express';
import { recordAudit } from '../../shared/utils/audit';
import type { CreateClienteInput, UpdateClienteInput } from './clientes.dto';
import { ClientesRepository } from './clientes.repository';

export class ClientesService {
  constructor(private repo: ClientesRepository = new ClientesRepository()) {}

  async getAllClientes() {
    const list = await this.repo.findAll();
    return list.map((c) => ({
      ...c,
      total_compras: parseFloat(c.total_compras || '0'),
    }));
  }

  async searchClientes(query: string) {
    const list = await this.repo.search(query);
    return list.map((c) => ({
      ...c,
      total_compras: parseFloat(c.total_compras || '0'),
    }));
  }

  async getClienteById(id: number) {
    const c = await this.repo.findById(id);
    if (!c) return null;
    return {
      ...c,
      total_compras: parseFloat(c.total_compras || '0'),
    };
  }

  async createCliente(input: CreateClienteInput, req?: Request) {
    const created = await this.repo.create({
      nombre: input.nombre,
      apellido: input.apellido || null,
      tipo_identificacion_id: input.tipo_identificacion_id || null,
      numero_identificacion: input.numero_identificacion || null,
      email: input.email || null,
      telefono: input.telefono || null,
      telefono_secundario: input.telefono_secundario || null,
      direccion_texto: input.direccion_texto || null,
      tipo_cliente: input.tipo_cliente || 'detal',
      notas: input.notas || null,
      activo: true,
    });

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'CLIENTE_CREADO',
      entidad: 'clientes',
      entidadId: created.id,
      datosNuevos: input,
      req,
    });

    return created;
  }

  async updateCliente(id: number, input: UpdateClienteInput, req?: Request) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const updated = await this.repo.update(id, input as any);

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'CLIENTE_ACTUALIZADO',
      entidad: 'clientes',
      entidadId: id,
      datosPrevios: existing,
      datosNuevos: input,
      req,
    });

    return updated;
  }

  async deleteCliente(id: number, req?: Request) {
    const ok = await this.repo.delete(id);
    if (ok) {
      await recordAudit({
        usuarioId: req?.user?.id,
        accion: 'CLIENTE_ELIMINADO',
        entidad: 'clientes',
        entidadId: id,
        req,
      });
    }
    return ok;
  }
}
