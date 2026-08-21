import { pool } from '../db';
import { logger } from '../lib/logger';
import { emitEvent, SOCKET_EVENTS } from '../server/socket';

/**
 * Marca separados vencidos: estado 'activo' + fecha_limite < CURRENT_DATE → 'vencido'.
 * Se ejecuta diario 02:00. Emite evento Socket.io para alertar caja.
 */
export async function runSeparadosVencidos(): Promise<{ vencidos: number }> {
  try {
    const { rows, rowCount } = await pool.query(
      `UPDATE separados SET estado = 'vencido', updated_at = NOW()
       WHERE estado = 'activo' AND fecha_limite < CURRENT_DATE
       RETURNING id, cliente_id, valor_total, saldo_pendiente`
    );

    const vencidos = rowCount || 0;
    if (vencidos > 0) {
      logger.warn({ vencidos, ids: rows.map((r: any) => r.id) }, 'Separados marcados como vencidos');
      emitEvent(SOCKET_EVENTS.SEPARADO_COMPLETADO, {
        tipo: 'vencidos',
        count: vencidos,
        ids: rows.map((r: any) => r.id),
        timestamp: new Date().toISOString()
      });
    } else {
      logger.info('Separados vencidos: 0');
    }

    return { vencidos };
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Separados vencidos job error');
    throw err;
  }
}
