import { db } from '../../db';
import { clientes, ClienteItem, NewCliente } from '../../db/schema/clientes';
import { eq, ilike, or } from 'drizzle-orm';

export class ClientesRepository {
  async findAll(): Promise<ClienteItem[]> {
    return await db.select().from(clientes).orderBy(clientes.nombre);
  }

  async search(query: string): Promise<ClienteItem[]> {
    const term = `%${query}%`;
    return await db
      .select()
      .from(clientes)
      .where(or(ilike(clientes.nombre, term), ilike(clientes.telefono, term), ilike(clientes.direccion, term)))
      .orderBy(clientes.nombre)
      .limit(10);
  }

  async findById(id: number): Promise<ClienteItem | null> {
    const rows = await db.select().from(clientes).where(eq(clientes.id, id)).limit(1);
    return rows[0] || null;
  }

  async create(data: NewCliente): Promise<ClienteItem> {
    const rows = await db.insert(clientes).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewCliente>): Promise<ClienteItem | null> {
    const rows = await db.update(clientes).set(data).where(eq(clientes.id, id)).returning();
    return rows[0] || null;
  }

  async delete(id: number): Promise<boolean> {
    const rows = await db.delete(clientes).where(eq(clientes.id, id)).returning({ id: clientes.id });
    return rows.length > 0;
  }
}
