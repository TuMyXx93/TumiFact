import { ProveedoresRepository } from './proveedores.repository';
import type { CreateProveedorInput, UpdateProveedorInput } from './proveedores.dto';
import { recordAudit } from '../../shared/utils/audit';
import type { Request } from 'express';

export class ProveedoresService {
  constructor(private repo: ProveedoresRepository = new ProveedoresRepository()) {}

  async getAll() {
    return await this.repo.findAll();
  }

  async search(query: string) {
    return await this.repo.search(query);
  }

  async getById(id: number) {
    return await this.repo.findById(id);
  }

  async create(input: CreateProveedorInput, req?: Request) {
    const created = await this.repo.create({
      nombre: input.nombre,
      razon_social: input.razon_social || null,
      tipo_identificacion_id: input.tipo_identificacion_id || null,
      numero_identificacion: input.numero_identificacion || null,
      contacto_nombre: input.contacto_nombre || null,
      email: input.email || null,
      telefono: input.telefono || null,
      telefono_secundario: input.telefono_secundario || null,
      website: input.website || null,
      plazo_pago_dias: input.plazo_pago_dias || 30,
      moneda: input.moneda || 'COP',
      notas: input.notas || null,
      activo: true
    });

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'PROVEEDOR_CREADO',
      entidad: 'proveedores',
      entidadId: created.id,
      datosNuevos: input,
      req
    });

    return created;
  }

  async update(id: number, input: UpdateProveedorInput, req?: Request) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const updated = await this.repo.update(id, input as any);

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'PROVEEDOR_ACTUALIZADO',
      entidad: 'proveedores',
      entidadId: id,
      datosPrevios: existing,
      datosNuevos: input,
      req
    });

    return updated;
  }

  async delete(id: number, req?: Request) {
    const ok = await this.repo.delete(id);
    if (ok) {
      await recordAudit({
        usuarioId: req?.user?.id,
        accion: 'PROVEEDOR_ELIMINADO',
        entidad: 'proveedores',
        entidadId: id,
        req
      });
    }
    return ok;
  }
}
