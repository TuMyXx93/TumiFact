import type { Request } from 'express';
import { pool } from '../../db';
import { auditLog } from '../../db/schema/audit_log';

export interface RecordAuditParams {
  usuarioId?: number | null;
  sesionCajaId?: number | null;
  accion: string;
  entidad?: string;
  entidadId?: number;
  datosPrevios?: any;
  datosNuevos?: any;
  resultado?: 'ok' | 'error' | 'rechazado';
  mensajeError?: string;
  req?: Request;
}

export function recordAudit(params: RecordAuditParams): Promise<void> {
  const work = async () => {
    try {
      let ip = '127.0.0.1';
      let userAgent = 'Unknown';

      if (params.req) {
        const forwarded = params.req.headers['x-forwarded-for'] as string;
        const rawIp =
          forwarded?.split(',')[0]?.trim() || params.req.socket?.remoteAddress || '127.0.0.1';
        ip = rawIp === '::1' || rawIp.startsWith('::ffff:') ? '127.0.0.1' : rawIp;
        userAgent = (params.req.headers['user-agent'] || 'Unknown').slice(0, 500);
      }

      await pool.query(
        `INSERT INTO audit_log
           (usuario_id, sesion_caja_id, accion, entidad, entidad_id,
            datos_previos, datos_nuevos, ip_address, user_agent, resultado, mensaje_error)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::inet, $9, $10, $11)`,
        [
          params.usuarioId || null,
          params.sesionCajaId || null,
          params.accion,
          params.entidad || null,
          params.entidadId || null,
          params.datosPrevios ? JSON.stringify(params.datosPrevios) : null,
          params.datosNuevos ? JSON.stringify(params.datosNuevos) : null,
          ip,
          userAgent,
          params.resultado || 'ok',
          params.mensajeError || null,
        ]
      );
    } catch (err) {
      console.error('⚠️ [Audit] Error (operación no afectada):', (err as Error).message);
    }
  };

  const p = work();
  p.catch(() => {});
  return p;
}

export function extractRequestAuditMeta(req?: Request) {
  let ip = '127.0.0.1';
  let userAgent = 'Unknown';
  if (req) {
    const forwarded = req.headers['x-forwarded-for'] as string;
    const rawIp = forwarded?.split(',')[0]?.trim() || req.socket?.remoteAddress || '127.0.0.1';
    ip = rawIp === '::1' || rawIp.startsWith('::ffff:') ? '127.0.0.1' : rawIp;
    userAgent = (req.headers['user-agent'] || 'Unknown').slice(0, 500);
  }
  return { ip, userAgent };
}

export async function recordAuditInTransaction(tx: any, params: RecordAuditParams): Promise<void> {
  const { ip, userAgent } = extractRequestAuditMeta(params.req);
  await tx.insert(auditLog).values({
    usuario_id: params.usuarioId || null,
    sesion_caja_id: params.sesionCajaId || null,
    accion: params.accion,
    entidad: params.entidad || null,
    entidad_id: params.entidadId || null,
    datos_previos: params.datosPrevios ?? null,
    datos_nuevos: params.datosNuevos ?? null,
    ip_address: ip,
    user_agent: userAgent,
    resultado: params.resultado || 'ok',
    mensaje_error: params.mensajeError || null,
  });
}
