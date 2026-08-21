import { eq } from 'drizzle-orm';
import { db } from '../../db';
import type { DescuentoItem, NewDescuento } from '../../db/schema/descuentos';
import { descuentos } from '../../db/schema/descuentos';

export class DescuentosRepository {
  async findAll(): Promise<DescuentoItem[]> {
    return await db
      .select()
      .from(descuentos)
      .where(eq(descuentos.activo, true))
      .orderBy(descuentos.nombre);
  }

  async findById(id: number): Promise<DescuentoItem | null> {
    const rows = await db.select().from(descuentos).where(eq(descuentos.id, id)).limit(1);
    return rows[0] || null;
  }

  async create(data: NewDescuento): Promise<DescuentoItem> {
    const rows = await db.insert(descuentos).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewDescuento>): Promise<DescuentoItem | null> {
    const rows = await db
      .update(descuentos)
      .set({ ...data, updated_at: new Date() })
      .where(eq(descuentos.id, id))
      .returning();
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db
      .update(descuentos)
      .set({ activo: false, updated_at: new Date() })
      .where(eq(descuentos.id, id))
      .returning();
    return rows.length > 0;
  }
}
