import { and, eq, sql } from 'drizzle-orm';
import type { Request } from 'express';
import { db, pool } from '../../db';
import { abonosSeparado } from '../../db/schema/abonos_separado';
import { devoluciones } from '../../db/schema/devoluciones';
import { facturas } from '../../db/schema/facturas';
import { recordAudit } from '../../shared/utils/audit';
import type { AbrirCajaInput, CerrarCajaInput } from './caja.dto';
import { CajaRepository } from './caja.repository';

export class CajaService {
  constructor(private repo: CajaRepository = new CajaRepository()) {}

  async abrirCaja(userId: number, input: AbrirCajaInput, req?: Request) {
    const active = await this.repo.findActiveByUserId(userId);
    if (active) {
      const error: any = new Error('Ya tiene una sesión de caja abierta actualmente.');
      error.statusCode = 400;
      throw error;
    }

    const session = await this.repo.create({
      usuario_id: userId,
      estado: 'abierta',
      monto_apertura: input.monto_apertura.toString(),
      notas: input.notas || null,
    });

    await recordAudit({
      usuarioId: userId,
      sesionCajaId: session.id,
      accion: 'CAJA_ABIERTA',
      entidad: 'sesiones_caja',
      entidadId: session.id,
      datosNuevos: { monto_apertura: input.monto_apertura },
      req,
    });

    return session;
  }

  async getActiveSession(userId: number) {
    const session = await this.repo.findActiveByUserId(userId);
    if (!session) return null;

    // Calcular totales en tiempo real
    const facturaStats = await db
      .select({
        forma_pago: facturas.forma_pago,
        total: sql<string>`COALESCE(SUM(total), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(facturas)
      .where(and(eq(facturas.sesion_caja_id, session.id), eq(facturas.estado, 'completada')))
      .groupBy(facturas.forma_pago);

    let efectivo = 0;
    let transferencia = 0;
    let tarjeta = 0;
    let totalVentas = 0;
    let txCount = 0;

    for (const stat of facturaStats) {
      const amount = parseFloat(stat.total);
      txCount += Number(stat.count);
      totalVentas += amount;
      if (stat.forma_pago === 'efectivo') efectivo += amount;
      else if (stat.forma_pago === 'transferencia') transferencia += amount;
      else if (stat.forma_pago === 'tarjeta') tarjeta += amount;
      else efectivo += amount; // fallback
    }

    // Abonos de separados
    const abonoStats = await db
      .select({
        forma_pago: abonosSeparado.forma_pago,
        total: sql<string>`COALESCE(SUM(monto), 0)`,
        count: sql<number>`COUNT(*)`,
      })
      .from(abonosSeparado)
      .where(eq(abonosSeparado.sesion_caja_id, session.id))
      .groupBy(abonosSeparado.forma_pago);

    let abonosTotal = 0;
    for (const abono of abonoStats) {
      const amount = parseFloat(abono.total);
      abonosTotal += amount;
      txCount += Number(abono.count);
      if (abono.forma_pago === 'efectivo') efectivo += amount;
      else if (abono.forma_pago === 'transferencia') transferencia += amount;
      else if (abono.forma_pago === 'tarjeta') tarjeta += amount;
    }

    // Devoluciones
    const devolucionStats = await db
      .select({
        total: sql<string>`COALESCE(SUM(monto_devuelto), 0)`,
      })
      .from(devoluciones)
      .where(and(eq(devoluciones.sesion_caja_id, session.id), eq(devoluciones.estado, 'aprobada')));

    const totalDevoluciones = parseFloat(devolucionStats[0]?.total || '0');

    const montoApertura = parseFloat(session.monto_apertura);
    const efectivoEsperado = montoApertura + efectivo - totalDevoluciones;

    return {
      ...session,
      monto_apertura: montoApertura,
      ventas_efectivo: efectivo,
      ventas_transferencia: transferencia,
      ventas_tarjeta: tarjeta,
      total_ventas: totalVentas,
      total_separados_abonos: abonosTotal,
      total_devoluciones: totalDevoluciones,
      numero_transacciones: txCount,
      efectivo_esperado: efectivoEsperado,
    };
  }

  async cerrarCaja(userId: number, input: CerrarCajaInput, req?: Request) {
    const active = await this.getActiveSession(userId);
    if (!active) {
      const error: any = new Error('No tiene una sesión de caja abierta para cerrar.');
      error.statusCode = 400;
      throw error;
    }

    const montoDeclarado = input.monto_cierre_declarado;
    const montoCalculado = active.efectivo_esperado;
    const diferencia = Math.round((montoDeclarado - montoCalculado) * 100) / 100;

    const closed = await this.repo.update(active.id, {
      estado: 'cerrada',
      monto_cierre_declarado: montoDeclarado.toString(),
      monto_cierre_calculado: montoCalculado.toString(),
      diferencia_caja: diferencia.toString(),
      ventas_efectivo: active.ventas_efectivo.toString(),
      ventas_transferencia: active.ventas_transferencia.toString(),
      ventas_tarjeta: active.ventas_tarjeta.toString(),
      total_ventas: active.total_ventas.toString(),
      total_devoluciones: active.total_devoluciones.toString(),
      total_separados_abonos: active.total_separados_abonos.toString(),
      numero_transacciones: active.numero_transacciones,
      cerrada_at: new Date(),
      notas: input.notas || active.notas,
    });

    await recordAudit({
      usuarioId: userId,
      sesionCajaId: active.id,
      accion: 'CAJA_CERRADA',
      entidad: 'sesiones_caja',
      entidadId: active.id,
      datosNuevos: {
        monto_declarado: montoDeclarado,
        monto_calculado: montoCalculado,
        diferencia,
      },
      req,
    });

    return {
      message: 'Caja cerrada exitosamente',
      reporte: {
        sesion_id: active.id,
        abierta_at: active.abierta_at,
        cerrada_at: new Date().toISOString(),
        monto_apertura: active.monto_apertura,
        ventas_efectivo: active.ventas_efectivo,
        ventas_transferencia: active.ventas_transferencia,
        ventas_tarjeta: active.ventas_tarjeta,
        total_ventas: active.total_ventas,
        total_abonos_separado: active.total_separados_abonos,
        total_devoluciones: active.total_devoluciones,
        monto_cierre_calculado: montoCalculado,
        monto_cierre_declarado: montoDeclarado,
        diferencia_caja: diferencia,
        numero_transacciones: active.numero_transacciones,
      },
    };
  }

  async getRecentSessions(limit = 20) {
    return await this.repo.findRecent(limit);
  }

  async getSessionById(id: number) {
    return await this.repo.findById(id);
  }

  async getAllActiveSessions() {
    const result = await pool.query(
      `SELECT 
        sc.id,
        sc.usuario_id,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        u.email as usuario_email,
        sc.estado,
        sc.monto_apertura,
        sc.abierta_at,
        sc.notas,
        COALESCE(SUM(f.total), 0) as total_ventas,
        COUNT(f.id) as total_facturas,
        COALESCE(SUM(CASE WHEN f.forma_pago = 'efectivo' THEN f.total ELSE 0 END), 0) as ventas_efectivo,
        COALESCE(SUM(CASE WHEN f.forma_pago = 'transferencia' THEN f.total ELSE 0 END), 0) as ventas_transferencia,
        COALESCE(SUM(CASE WHEN f.forma_pago = 'tarjeta' THEN f.total ELSE 0 END), 0) as ventas_tarjeta
      FROM sesiones_caja sc
      JOIN usuarios u ON sc.usuario_id = u.id
      LEFT JOIN facturas f ON f.sesion_caja_id = sc.id
      WHERE sc.estado = 'abierta'
      GROUP BY sc.id, u.id
      ORDER BY sc.abierta_at DESC`
    );

    return result.rows || [];
  }
}
