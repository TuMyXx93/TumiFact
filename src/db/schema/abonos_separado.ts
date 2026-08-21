import {
  boolean,
  integer,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { separados } from './separados';
import { sesionesCaja } from './sesiones_caja';
import { usuarios } from './usuarios';

export const abonosSeparado = pgTable('abonos_separado', {
  id: serial('id').primaryKey(),
  idempotency_key: uuid('idempotency_key').unique(), // Idempotency: prevents duplicate payment clicks
  separado_id: integer('separado_id')
    .references(() => separados.id, { onDelete: 'cascade' })
    .notNull(),
  usuario_id: integer('usuario_id')
    .references(() => usuarios.id)
    .notNull(),
  sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),
  numero_abono: integer('numero_abono').notNull(),
  monto: numeric('monto', { precision: 12, scale: 2 }).notNull(),
  forma_pago: varchar('forma_pago', { length: 30 }).default('efectivo').notNull(), // 'efectivo', 'transferencia', 'tarjeta'
  referencia_pago: varchar('referencia_pago', { length: 100 }),
  notas: text('notas'),
  es_abono_final: boolean('es_abono_final').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type AbonoSeparadoItem = typeof abonosSeparado.$inferSelect;
export type NewAbonoSeparado = typeof abonosSeparado.$inferInsert;
