import { pool } from '../db';
import { logger } from '../lib/logger';

/**
 * Archiva audit_log >90 días a tabla audit_log_archive (si existe) o solo loggea.
 * Fase 4.1 — evita que audit_log crezca sin control (10k inserts/día en POS activo).
 * Se ejecuta Dom 03:00 vía BullMQ repeatable.
 */
export async function runAuditArchiver(): Promise<{ archived: number }> {
  const cutoff = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
  try {
    const { rows } = await pool.query(`SELECT count(*)::int as c FROM audit_log WHERE created_at < $1`, [cutoff]);
    const count = rows[0]?.c || 0;
    if (count === 0) {
      logger.info({ cutoff: cutoff.toISOString() }, 'Audit archiver: nada que archivar');
      return { archived: 0 };
    }

    // Si existe audit_log_archive, mueve; si no, solo loggea (dry-run hasta migrar tabla)
    const archiveExists = await pool.query(`SELECT to_regclass('public.audit_log_archive') as tbl`);
    if (archiveExists.rows[0]?.tbl) {
      await pool.query(
        `INSERT INTO audit_log_archive SELECT * FROM audit_log WHERE created_at < $1`,
        [cutoff]
      );
      await pool.query(`DELETE FROM audit_log WHERE created_at < $1`, [cutoff]);
      logger.info({ archived: count, cutoff: cutoff.toISOString() }, 'Audit log archivado');
    } else {
      logger.warn(
        { count, cutoff: cutoff.toISOString() },
        'Audit archiver dry-run: audit_log_archive no existe — crea tabla para activar archivado real'
      );
    }

    return { archived: count };
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Audit archiver error');
    throw err;
  }
}
