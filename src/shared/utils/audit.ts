import { pool } from '../../db';
import type { Request } from 'express';

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

/**
/**
 * Registra un evento de auditoría — FIRE AND FORGET.
 * Retorna void de forma SÍNCRONA. El INSERT real corre en background.
 * Esto garantiza que NUNCA bloquea ni participa en transacciones padre.
 * Compatible con: await recordAudit(...) y recordAudit(...) sin await.
 */
export function recordAudit(params: RecordAuditParams): Promise<void> {
  const work = async () => {
    try {
      let ip = '127.0.0.1';
      let userAgent = 'Unknown';

      if (params.req) {
        const forwarded = params.req.headers['x-forwarded-for'] as string;
        const rawIp = forwarded?.split(',')[0]?.trim() || params.req.socket?.remoteAddress || '127.0.0.1';
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
          params.mensajeError || null
        ]
      );
    } catch (err) {
      // El audit NUNCA debe romper ni bloquear la operación de negocio
      console.error('⚠️ [Audit] Error (operación no afectada):', (err as Error).message);
    }
  };

  // Disparar en background — el caller puede usar await o no, ambos son seguros
  const p = work();
  p.catch(() => {}); // evita unhandledPromiseRejection
  return p;
}
