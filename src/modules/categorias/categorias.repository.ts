import { db } from '../../db';
import { categoriasProducto } from '../../db/schema/categorias';
import type { CategoriaProductoItem, NewCategoriaProducto } from '../../db/schema/categorias';
import { eq } from 'drizzle-orm';

export class CategoriasRepository {
  async findAll(): Promise<CategoriaProductoItem[]> {
    return await db.select().from(categoriasProducto).where(eq(categoriasProducto.activo, true)).orderBy(categoriasProducto.nombre);
  }

  async findById(id: number): Promise<CategoriaProductoItem | null> {
    const rows = await db.select().from(categoriasProducto).where(eq(categoriasProducto.id, id)).limit(1);
    return rows[0] || null;
  }

  async create(data: NewCategoriaProducto): Promise<CategoriaProductoItem> {
    const rows = await db.insert(categoriasProducto).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewCategoriaProducto>): Promise<CategoriaProductoItem | null> {
    const rows = await db.update(categoriasProducto).set(data).where(eq(categoriasProducto.id, id)).returning();
    return rows[0] || null;
  }
}
