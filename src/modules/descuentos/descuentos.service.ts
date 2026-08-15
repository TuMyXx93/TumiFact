import { DescuentosRepository } from './descuentos.repository';
import type { CreateDescuentoInput, UpdateDescuentoInput } from './descuentos.dto';
import { recordAudit } from '../../shared/utils/audit';
import type { Request } from 'express';

export class DescuentosService {
  constructor(private repo: DescuentosRepository = new DescuentosRepository()) {}

  async getAll() {
    const list = await this.repo.findAll();
    return list.map((d) => ({
      ...d,
      valor: parseFloat(d.valor)
    }));
  }

  async getById(id: number) {
    const d = await this.repo.findById(id);
    if (!d) return null;
    return {
      ...d,
      valor: parseFloat(d.valor)
    };
  }

  async create(input: CreateDescuentoInput, req?: Request) {
    const created = await this.repo.create({
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      tipo: input.tipo,
      valor: input.valor.toString(),
      aplica_a: input.aplica_a || 'total',
      requiere_aprobacion: input.requiere_aprobacion || false,
      vigencia_desde: input.vigencia_desde || null,
      vigencia_hasta: input.vigencia_hasta || null,
      activo: true
    });

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'DESCUENTO_CREADO',
      entidad: 'descuentos',
      entidadId: created.id,
      datosNuevos: input,
      req
    });

    return created;
  }

  async update(id: number, input: UpdateDescuentoInput, req?: Request) {
    const dataToUpdate: any = {};
    if (input.nombre !== undefined) dataToUpdate.nombre = input.nombre;
    if (input.descripcion !== undefined) dataToUpdate.descripcion = input.descripcion;
    if (input.tipo !== undefined) dataToUpdate.tipo = input.tipo;
    if (input.valor !== undefined) dataToUpdate.valor = input.valor.toString();
    if (input.aplica_a !== undefined) dataToUpdate.aplica_a = input.aplica_a;
    if (input.requiere_aprobacion !== undefined) dataToUpdate.requiere_aprobacion = input.requiere_aprobacion;
    if (input.vigencia_desde !== undefined) dataToUpdate.vigencia_desde = input.vigencia_desde;
    if (input.vigencia_hasta !== undefined) dataToUpdate.vigencia_hasta = input.vigencia_hasta;

    const updated = await this.repo.update(id, dataToUpdate);

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'DESCUENTO_ACTUALIZADO',
      entidad: 'descuentos',
      entidadId: id,
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
        accion: 'DESCUENTO_ELIMINADO',
        entidad: 'descuentos',
        entidadId: id,
        req
      });
    }
    return ok;
  }
}
