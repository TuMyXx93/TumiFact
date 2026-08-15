import { db } from '../../db';
import { clientes } from '../../db/schema/clientes';
import type { ClienteItem, NewCliente } from '../../db/schema/clientes';
import { tiposIdentificacion } from '../../db/schema/tipos_identificacion';
import { eq, ilike, or, desc } from 'drizzle-orm';

export class ClientesRepository {
  async findAll() {
    return await db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        apellido: clientes.apellido,
        tipo_identificacion_id: clientes.tipo_identificacion_id,
        tipo_identificacion: tiposIdentificacion.codigo,
        numero_identificacion: clientes.numero_identificacion,
        email: clientes.email,
        telefono: clientes.telefono,
        telefono_secundario: clientes.telefono_secundario,
        direccion_texto: clientes.direccion_texto,
        tipo_cliente: clientes.tipo_cliente,
        notas: clientes.notas,
        total_compras: clientes.total_compras,
        numero_facturas: clientes.numero_facturas,
        ultima_compra: clientes.ultima_compra,
        activo: clientes.activo,
        created_at: clientes.created_at,
        updated_at: clientes.updated_at
      })
      .from(clientes)
      .leftJoin(tiposIdentificacion, eq(clientes.tipo_identificacion_id, tiposIdentificacion.id))
      .where(eq(clientes.activo, true))
      .orderBy(clientes.nombre);
  }

  async search(query: string) {
    const term = `%${query}%`;
    return await db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        apellido: clientes.apellido,
        tipo_identificacion_id: clientes.tipo_identificacion_id,
        tipo_identificacion: tiposIdentificacion.codigo,
        numero_identificacion: clientes.numero_identificacion,
        email: clientes.email,
        telefono: clientes.telefono,
        telefono_secundario: clientes.telefono_secundario,
        direccion_texto: clientes.direccion_texto,
        tipo_cliente: clientes.tipo_cliente,
        notas: clientes.notas,
        total_compras: clientes.total_compras,
        numero_facturas: clientes.numero_facturas,
        activo: clientes.activo
      })
      .from(clientes)
      .leftJoin(tiposIdentificacion, eq(clientes.tipo_identificacion_id, tiposIdentificacion.id))
      .where(
        or(
          ilike(clientes.nombre, term),
          ilike(clientes.apellido, term),
          ilike(clientes.numero_identificacion, term),
          ilike(clientes.telefono, term),
          ilike(clientes.email, term)
        )
      )
      .orderBy(clientes.nombre)
      .limit(15);
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: clientes.id,
        nombre: clientes.nombre,
        apellido: clientes.apellido,
        tipo_identificacion_id: clientes.tipo_identificacion_id,
        tipo_identificacion: tiposIdentificacion.codigo,
        numero_identificacion: clientes.numero_identificacion,
        email: clientes.email,
        telefono: clientes.telefono,
        telefono_secundario: clientes.telefono_secundario,
        direccion_texto: clientes.direccion_texto,
        tipo_cliente: clientes.tipo_cliente,
        notas: clientes.notas,
        total_compras: clientes.total_compras,
        numero_facturas: clientes.numero_facturas,
        ultima_compra: clientes.ultima_compra,
        activo: clientes.activo,
        created_at: clientes.created_at,
        updated_at: clientes.updated_at
      })
      .from(clientes)
      .leftJoin(tiposIdentificacion, eq(clientes.tipo_identificacion_id, tiposIdentificacion.id))
      .where(eq(clientes.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async create(data: NewCliente): Promise<ClienteItem> {
    const rows = await db.insert(clientes).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewCliente>): Promise<ClienteItem | null> {
    const rows = await db
      .update(clientes)
      .set({ ...data, updated_at: new Date() })
      .where(eq(clientes.id, id))
      .returning();
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db
      .update(clientes)
      .set({ activo: false, updated_at: new Date() })
      .where(eq(clientes.id, id))
      .returning({ id: clientes.id });
    return rows.length > 0;
  }
}
