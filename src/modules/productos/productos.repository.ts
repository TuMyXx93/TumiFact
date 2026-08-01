import { db } from '../../db';
import { productos, ProductoItem, NewProducto } from '../../db/schema/productos';
import { eq, ilike, or } from 'drizzle-orm';

export class ProductosRepository {
  async findAll(): Promise<ProductoItem[]> {
    return await db.select().from(productos).orderBy(productos.nombre);
  }

  async search(query: string): Promise<ProductoItem[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(productos)
      .where(or(ilike(productos.nombre, searchTerm), ilike(productos.codigo, searchTerm)))
      .orderBy(productos.nombre)
      .limit(10);
  }

  async findById(id: number): Promise<ProductoItem | null> {
    const rows = await db.select().from(productos).where(eq(productos.id, id)).limit(1);
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
    const rows = await db.delete(productos).where(eq(productos.id, id)).returning({ id: productos.id });
    return rows.length > 0;
  }
}
