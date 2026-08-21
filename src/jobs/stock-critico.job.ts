import { pool } from '../db';
import { logger } from '../lib/logger';
import { emitEvent, SOCKET_EVENTS } from '../server/socket';

export interface StockCriticoItem {
  id: number;
  codigo: string;
  nombre: string;
  stock_actual: string;
  stock_minimo: string;
}

/**
 * Detecta productos con stock_actual <= stock_minimo y emite alerta.
 * Cada 30 min. Es idempotente — no escribe DB, solo notifica.
 */
export async function runStockCritico(): Promise<{
  criticos: StockCriticoItem[];
}> {
  try {
    const { rows } = await pool.query(
      `SELECT id, codigo, nombre, stock_actual, stock_minimo
       FROM productos
       WHERE activo = true AND stock_actual <= stock_minimo
       ORDER BY stock_actual ASC
       LIMIT 50`
    );

    const criticos: StockCriticoItem[] = rows as StockCriticoItem[];

    if (criticos.length > 0) {
      logger.warn({ count: criticos.length }, 'Stock crítico detectado');
      emitEvent(SOCKET_EVENTS.STOCK_CRITICO, {
        count: criticos.length,
        items: criticos.map((c) => ({
          id: c.id,
          codigo: c.codigo,
          nombre: c.nombre,
          stock: c.stock_actual,
          minimo: c.stock_minimo,
        })),
        timestamp: new Date().toISOString(),
      });
    } else {
      logger.debug('Stock crítico: 0');
    }

    return { criticos };
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Stock crítico job error');
    throw err;
  }
}
