import { desc, eq, ilike, or } from 'drizzle-orm';
import { db } from '../../db';
import { categoriasProducto } from '../../db/schema/categorias';
import type { NewProducto, ProductoItem } from '../../db/schema/productos';
import { productos } from '../../db/schema/productos';
import { proveedores } from '../../db/schema/proveedores';

export class ProductosRepository {
  async findAll() {
    return await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        descripcion: productos.descripcion,
        categoria_id: productos.categoria_id,
        categoria_nombre: categoriasProducto.nombre,
        categoria_tipo: categoriasProducto.tipo,
        proveedor_id: productos.proveedor_id,
        proveedor_nombre: proveedores.nombre,
        precio_kg: productos.precio_kg,
        precio_unidad: productos.precio_unidad,
        precio_libra: productos.precio_libra,
        precio_detal: productos.precio_detal,
        precio_mayorista: productos.precio_mayorista,
        cantidad_mayorista: productos.cantidad_mayorista,
        stock_actual: productos.stock_actual,
        stock_minimo: productos.stock_minimo,
        atributos: productos.atributos,
        activo: productos.activo,
        created_at: productos.created_at,
        updated_at: productos.updated_at,
      })
      .from(productos)
      .leftJoin(categoriasProducto, eq(productos.categoria_id, categoriasProducto.id))
      .leftJoin(proveedores, eq(productos.proveedor_id, proveedores.id))
      .where(eq(productos.activo, true))
      .orderBy(productos.nombre);
  }

  async search(query: string) {
    const searchTerm = `%${query}%`;
    return await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        descripcion: productos.descripcion,
        categoria_id: productos.categoria_id,
        categoria_nombre: categoriasProducto.nombre,
        categoria_tipo: categoriasProducto.tipo,
        proveedor_id: productos.proveedor_id,
        proveedor_nombre: proveedores.nombre,
        precio_kg: productos.precio_kg,
        precio_unidad: productos.precio_unidad,
        precio_libra: productos.precio_libra,
        precio_detal: productos.precio_detal,
        precio_mayorista: productos.precio_mayorista,
        cantidad_mayorista: productos.cantidad_mayorista,
        stock_actual: productos.stock_actual,
        stock_minimo: productos.stock_minimo,
        atributos: productos.atributos,
        activo: productos.activo,
      })
      .from(productos)
      .leftJoin(categoriasProducto, eq(productos.categoria_id, categoriasProducto.id))
      .leftJoin(proveedores, eq(productos.proveedor_id, proveedores.id))
      .where(
        or(
          ilike(productos.nombre, searchTerm),
          ilike(productos.codigo, searchTerm),
          ilike(categoriasProducto.nombre, searchTerm)
        )
      )
      .orderBy(productos.nombre)
      .limit(20);
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        descripcion: productos.descripcion,
        categoria_id: productos.categoria_id,
        categoria_nombre: categoriasProducto.nombre,
        categoria_tipo: categoriasProducto.tipo,
        proveedor_id: productos.proveedor_id,
        proveedor_nombre: proveedores.nombre,
        precio_kg: productos.precio_kg,
        precio_unidad: productos.precio_unidad,
        precio_libra: productos.precio_libra,
        precio_detal: productos.precio_detal,
        precio_mayorista: productos.precio_mayorista,
        cantidad_mayorista: productos.cantidad_mayorista,
        stock_actual: productos.stock_actual,
        stock_minimo: productos.stock_minimo,
        atributos: productos.atributos,
        activo: productos.activo,
        created_at: productos.created_at,
        updated_at: productos.updated_at,
      })
      .from(productos)
      .leftJoin(categoriasProducto, eq(productos.categoria_id, categoriasProducto.id))
      .leftJoin(proveedores, eq(productos.proveedor_id, proveedores.id))
      .where(eq(productos.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async findByCodigo(codigo: string): Promise<ProductoItem | null> {
    const rows = await db.select().from(productos).where(eq(productos.codigo, codigo)).limit(1);
    return rows[0] || null;
  }

  async create(data: NewProducto): Promise<ProductoItem> {
    const rows = await db.insert(productos).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewProducto>): Promise<ProductoItem | null> {
    const rows = await db
      .update(productos)
      .set({ ...data, updated_at: new Date() })
      .where(eq(productos.id, id))
      .returning();
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db
      .update(productos)
      .set({ activo: false, updated_at: new Date() })
      .where(eq(productos.id, id))
      .returning({ id: productos.id });
    return rows.length > 0;
  }
}
