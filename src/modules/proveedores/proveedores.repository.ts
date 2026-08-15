import { db } from '../../db';
import { proveedores } from '../../db/schema/proveedores';
import type { ProveedorItem, NewProveedor } from '../../db/schema/proveedores';
import { tiposIdentificacion } from '../../db/schema/tipos_identificacion';
import { eq, ilike, or, desc } from 'drizzle-orm';

export class ProveedoresRepository {
  async findAll(): Promise<ProveedorItem[]> {
    return await db
      .select()
      .from(proveedores)
      .where(eq(proveedores.activo, true))
      .orderBy(proveedores.nombre);
  }

  async search(query: string) {
    const term = `%${query}%`;
    return await db
      .select()
      .from(proveedores)
      .where(
        or(
          ilike(proveedores.nombre, term),
          ilike(proveedores.numero_identificacion, term),
          ilike(proveedores.contacto_nombre, term)
        )
      )
      .orderBy(proveedores.nombre)
      .limit(15);
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: proveedores.id,
        nombre: proveedores.nombre,
        razon_social: proveedores.razon_social,
        tipo_identificacion_id: proveedores.tipo_identificacion_id,
        tipo_identificacion: tiposIdentificacion.codigo,
        numero_identificacion: proveedores.numero_identificacion,
        contacto_nombre: proveedores.contacto_nombre,
        email: proveedores.email,
        telefono: proveedores.telefono,
        telefono_secundario: proveedores.telefono_secundario,
        website: proveedores.website,
        plazo_pago_dias: proveedores.plazo_pago_dias,
        moneda: proveedores.moneda,
        notas: proveedores.notas,
        activo: proveedores.activo,
        created_at: proveedores.created_at,
        updated_at: proveedores.updated_at
      })
      .from(proveedores)
      .leftJoin(tiposIdentificacion, eq(proveedores.tipo_identificacion_id, tiposIdentificacion.id))
      .where(eq(proveedores.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async create(data: NewProveedor): Promise<ProveedorItem> {
    const rows = await db.insert(proveedores).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewProveedor>): Promise<ProveedorItem | null> {
    const rows = await db
      .update(proveedores)
      .set({ ...data, updated_at: new Date() })
      .where(eq(proveedores.id, id))
      .returning();
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db
      .update(proveedores)
      .set({ activo: false, updated_at: new Date() })
      .where(eq(proveedores.id, id))
      .returning();
    return rows.length > 0;
  }
}
