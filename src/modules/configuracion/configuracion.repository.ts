import { db } from '../../db';
import { configuracionImpresion } from '../../db/schema/configuracion';
import type { ConfiguracionItem, NewConfiguracion } from '../../db/schema/configuracion';
import { eq } from 'drizzle-orm';

export class ConfiguracionRepository {
  async findFirst(): Promise<ConfiguracionItem | null> {
    const rows = await db.select().from(configuracionImpresion).limit(1);
    return rows[0] || null;
  }

  async save(data: NewConfiguracion): Promise<ConfiguracionItem> {
    const existing = await this.findFirst();
    if (!existing) {
      const inserted = await db.insert(configuracionImpresion).values(data).returning();
      return inserted[0];
    }
    const updated = await db
      .update(configuracionImpresion)
      .set({ ...data, updated_at: new Date() })
      .where(eq(configuracionImpresion.id, existing.id))
      .returning();
    return updated[0];
  }
}
