import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import type { NewSesionCaja, SesionCajaItem } from '../../db/schema/sesiones_caja';
import { sesionesCaja } from '../../db/schema/sesiones_caja';
import { usuarios } from '../../db/schema/usuarios';
import { recordAuditInTransaction } from '../../shared/utils/audit';

export class CajaSessionAlreadyOpenError extends Error {
  readonly statusCode = 400;
  constructor() {
    super('Ya tiene una sesión de caja abierta actualmente.');
    this.name = 'CajaSessionAlreadyOpenError';
  }
}

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
        cerrada_at: sesionesCaja.cerrada_at,
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
        cerrada_at: sesionesCaja.cerrada_at,
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

  async createSessionAtomically(
    userId: number,
    data: NewSesionCaja,
    auditContext?: {
      usuarioId?: number | null;
      sesionCajaId?: number | null;
      datosNuevos?: Record<string, unknown>;
      req?: any;
    }
  ): Promise<SesionCajaItem> {
    return await db.transaction(async (tx) => {
      // Serializa operaciones de apertura por usuario.
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${userId})`);

      const active = await tx
        .select()
        .from(sesionesCaja)
        .where(and(eq(sesionesCaja.usuario_id, userId), eq(sesionesCaja.estado, 'abierta')))
        .limit(1);

      if (active[0]) {
        throw new CajaSessionAlreadyOpenError();
      }

      const rows = await tx.insert(sesionesCaja).values(data).returning();
      const session = rows[0];

      if (auditContext) {
        await recordAuditInTransaction(tx, {
          usuarioId: auditContext.usuarioId ?? userId,
          sesionCajaId: session.id,
          accion: 'CAJA_ABIERTA',
          entidad: 'sesiones_caja',
          entidadId: session.id,
          datosNuevos: auditContext.datosNuevos,
          req: auditContext.req,
        });
      }

      return session;
    });
  }

  async closeSessionAtomically(
    id: number,
    data: Partial<NewSesionCaja>
  ): Promise<SesionCajaItem | null> {
    const rows = await db
      .update(sesionesCaja)
      .set(data)
      .where(and(eq(sesionesCaja.id, id), eq(sesionesCaja.estado, 'abierta')))
      .returning();
    return rows[0] || null;
  }

  async update(id: number, data: Partial<NewSesionCaja>): Promise<SesionCajaItem | null> {
    const rows = await db.update(sesionesCaja).set(data).where(eq(sesionesCaja.id, id)).returning();
    return rows[0] || null;
  }
}
