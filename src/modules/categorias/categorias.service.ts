import type { Request } from 'express';
import { recordAudit } from '../../shared/utils/audit';
import type { CreateCategoriaInput, UpdateCategoriaInput } from './categorias.dto';
import { CategoriasRepository } from './categorias.repository';

export class CategoriasService {
  constructor(private repo: CategoriasRepository = new CategoriasRepository()) {}

  async getAll() {
    return await this.repo.findAll();
  }

  async getById(id: number) {
    return await this.repo.findById(id);
  }

  async create(input: CreateCategoriaInput, req?: Request) {
    const created = await this.repo.create({
      nombre: input.nombre,
      tipo: input.tipo || 'generico',
      descripcion: input.descripcion || null,
      campos_extra: input.campos_extra || [],
      aplica_inventario: input.aplica_inventario !== undefined ? input.aplica_inventario : true,
      activo: true,
    });

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'CATEGORIA_CREADA',
      entidad: 'categorias_producto',
      entidadId: created.id,
      datosNuevos: input,
      req,
    });

    return created;
  }

  async update(id: number, input: UpdateCategoriaInput, req?: Request) {
    const updated = await this.repo.update(id, input as any);
    if (updated) {
      await recordAudit({
        usuarioId: req?.user?.id,
        accion: 'CATEGORIA_ACTUALIZADA',
        entidad: 'categorias_producto',
        entidadId: id,
        datosNuevos: input,
        req,
      });
    }
    return updated;
  }
}
