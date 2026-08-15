import { db } from '../../db';
import { sesionesCaja } from '../../db/schema/sesiones_caja';
import type { SesionCajaItem, NewSesionCaja } from '../../db/schema/sesiones_caja';
import { usuarios } from '../../db/schema/usuarios';
import { eq, desc, and } from 'drizzle-orm';

export class CajaRepository {
  async findActiveByUserId(userId: number): Promise<SesionCajaItem | null> {
    const rows = await db
      .select()
      .from(sesionesCaja)
      .where(and(eq(sesionesCaja.usuario_id, userId), eq(sesionesCaja.estado, 'abierta')))
      .orderBy(desc(sesionesCaja.abierta_at))
      .limit(1);
    return rows[0] || null;
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: sesionesCaja.id,
        usuario_id: sesionesCaja.usuario_id,
        usuario_nombre: usuarios.nombre,
        usuario_apellido: usuarios.apellido,
        estado: sesionesCaja.estado,
        monto_apertura: sesionesCaja.monto_apertura,
        monto_cierre_declarado: sesionesCaja.monto_cierre_declarado,
        monto_cierre_calculado: sesionesCaja.monto_cierre_calculado,
        diferencia_caja: sesionesCaja.diferencia_caja,
        ventas_efectivo: sesionesCaja.ventas_efectivo,
        ventas_transferencia: sesionesCaja.ventas_transferencia,
        ventas_tarjeta: sesionesCaja.ventas_tarjeta,
        total_ventas: sesionesCaja.total_ventas,
        total_devoluciones: sesionesCaja.total_devoluciones,
        total_separados_abonos: sesionesCaja.total_separados_abonos,
        numero_transacciones: sesionesCaja.numero_transacciones,
        notas: sesionesCaja.notas,
        abierta_at: sesionesCaja.abierta_at,
        cerrada_at: sesionesCaja.cerrada_at
      })
      .from(sesionesCaja)
      .leftJoin(usuarios, eq(sesionesCaja.usuario_id, usuarios.id))
      .where(eq(sesionesCaja.id, id))
      .limit(1);
    return rows[0] || null;
  }

  async findRecent(limit = 20) {
    return await db
      .select({
        id: sesionesCaja.id,
        usuario_id: sesionesCaja.usuario_id,
        usuario_nombre: usuarios.nombre,
        usuario_apellido: usuarios.apellido,
        estado: sesionesCaja.estado,
        monto_apertura: sesionesCaja.monto_apertura,
        monto_cierre_declarado: sesionesCaja.monto_cierre_declarado,
        monto_cierre_calculado: sesionesCaja.monto_cierre_calculado,
        diferencia_caja: sesionesCaja.diferencia_caja,
        total_ventas: sesionesCaja.total_ventas,
        numero_transacciones: sesionesCaja.numero_transacciones,
        abierta_at: sesionesCaja.abierta_at,
        cerrada_at: sesionesCaja.cerrada_at
      })
      .from(sesionesCaja)
      .leftJoin(usuarios, eq(sesionesCaja.usuario_id, usuarios.id))
      .orderBy(desc(sesionesCaja.abierta_at))
      .limit(limit);
  }

  async create(data: NewSesionCaja): Promise<SesionCajaItem> {
    const rows = await db.insert(sesionesCaja).values(data).returning();
    return rows[0];
  }

  async update(id: number, data: Partial<NewSesionCaja>): Promise<SesionCajaItem | null> {
    const rows = await db.update(sesionesCaja).set(data).where(eq(sesionesCaja.id, id)).returning();
    return rows[0] || null;
  }
}
