import type { Request } from 'express';
import { recordAudit } from '../../shared/utils/audit';
import type { CreateProductoInput, UpdateProductoInput } from './productos.dto';
import { ProductosRepository } from './productos.repository';

export class ProductosService {
  constructor(private repo: ProductosRepository = new ProductosRepository()) {}

  async getAllProductos() {
    const list = await this.repo.findAll();
    return list.map((p) => ({
      ...p,
      precio_kg: parseFloat(p.precio_kg),
      precio_unidad: parseFloat(p.precio_unidad),
      precio_libra: parseFloat(p.precio_libra),
      precio_detal: parseFloat(p.precio_detal || '0'),
      precio_mayorista: parseFloat(p.precio_mayorista || '0'),
      stock_actual: parseFloat(p.stock_actual || '0'),
      stock_minimo: parseFloat(p.stock_minimo || '0'),
    }));
  }

  async searchProductos(query: string) {
    const list = await this.repo.search(query);
    return list.map((p) => ({
      ...p,
      precio_kg: parseFloat(p.precio_kg),
      precio_unidad: parseFloat(p.precio_unidad),
      precio_libra: parseFloat(p.precio_libra),
      precio_detal: parseFloat(p.precio_detal || '0'),
      precio_mayorista: parseFloat(p.precio_mayorista || '0'),
      stock_actual: parseFloat(p.stock_actual || '0'),
      stock_minimo: parseFloat(p.stock_minimo || '0'),
    }));
  }

  async getProductoById(id: number) {
    const p = await this.repo.findById(id);
    if (!p) return null;
    return {
      ...p,
      precio_kg: parseFloat(p.precio_kg),
      precio_unidad: parseFloat(p.precio_unidad),
      precio_libra: parseFloat(p.precio_libra),
      precio_detal: parseFloat(p.precio_detal || '0'),
      precio_mayorista: parseFloat(p.precio_mayorista || '0'),
      stock_actual: parseFloat(p.stock_actual || '0'),
      stock_minimo: parseFloat(p.stock_minimo || '0'),
    };
  }

  async createProducto(input: CreateProductoInput, req?: Request) {
    const existing = await this.repo.findByCodigo(input.codigo);
    if (existing) {
      const error: any = new Error(`Ya existe un producto con el código '${input.codigo}'`);
      error.statusCode = 409;
      throw error;
    }

    const created = await this.repo.create({
      codigo: input.codigo,
      nombre: input.nombre,
      descripcion: input.descripcion || null,
      categoria_id: input.categoria_id || null,
      proveedor_id: input.proveedor_id || null, // Optional provider
      precio_kg: (input.precio_kg || 0).toString(),
      precio_unidad: (input.precio_unidad || 0).toString(),
      precio_libra: (input.precio_libra || 0).toString(),
      precio_detal: (input.precio_detal || input.precio_unidad || 0).toString(),
      precio_mayorista: (input.precio_mayorista || 0).toString(),
      cantidad_mayorista: input.cantidad_mayorista || 10,
      stock_actual: (input.stock_actual || 0).toString(),
      stock_minimo: (input.stock_minimo || 5).toString(),
      atributos: input.atributos || {},
      activo: true,
    });

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'PRODUCTO_CREADO',
      entidad: 'productos',
      entidadId: created.id,
      datosNuevos: input,
      req,
    });

    return created;
  }

  async updateProducto(id: number, input: UpdateProductoInput, req?: Request) {
    const existing = await this.repo.findById(id);
    if (!existing) return null;

    const dataToUpdate: any = {};
    if (input.codigo !== undefined) dataToUpdate.codigo = input.codigo;
    if (input.nombre !== undefined) dataToUpdate.nombre = input.nombre;
    if (input.descripcion !== undefined) dataToUpdate.descripcion = input.descripcion;
    if (input.categoria_id !== undefined) dataToUpdate.categoria_id = input.categoria_id;
    if (input.proveedor_id !== undefined) dataToUpdate.proveedor_id = input.proveedor_id;
    if (input.precio_kg !== undefined) dataToUpdate.precio_kg = input.precio_kg.toString();
    if (input.precio_unidad !== undefined)
      dataToUpdate.precio_unidad = input.precio_unidad.toString();
    if (input.precio_libra !== undefined) dataToUpdate.precio_libra = input.precio_libra.toString();
    if (input.precio_detal !== undefined) dataToUpdate.precio_detal = input.precio_detal.toString();
    if (input.precio_mayorista !== undefined)
      dataToUpdate.precio_mayorista = input.precio_mayorista.toString();
    if (input.cantidad_mayorista !== undefined)
      dataToUpdate.cantidad_mayorista = input.cantidad_mayorista;
    if (input.stock_actual !== undefined) dataToUpdate.stock_actual = input.stock_actual.toString();
    if (input.stock_minimo !== undefined) dataToUpdate.stock_minimo = input.stock_minimo.toString();
    if (input.atributos !== undefined) dataToUpdate.atributos = input.atributos;

    const updated = await this.repo.update(id, dataToUpdate);

    await recordAudit({
      usuarioId: req?.user?.id,
      accion: 'PRODUCTO_ACTUALIZADO',
      entidad: 'productos',
      entidadId: id,
      datosPrevios: existing,
      datosNuevos: input,
      req,
    });

    return updated;
  }

  async deleteProducto(id: number, req?: Request) {
    const ok = await this.repo.delete(id);
    if (ok) {
      await recordAudit({
        usuarioId: req?.user?.id,
        accion: 'PRODUCTO_ELIMINADO',
        entidad: 'productos',
        entidadId: id,
        req,
      });
    }
    return ok;
  }
}
