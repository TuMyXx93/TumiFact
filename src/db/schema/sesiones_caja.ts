import { pgTable, serial, integer, varchar, numeric, text, timestamp } from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios';

export const sesionesCaja = pgTable('sesiones_caja', {
  id: serial('id').primaryKey(),
  usuario_id: integer('usuario_id').references(() => usuarios.id).notNull(),
  estado: varchar('estado', { length: 20 }).default('abierta').notNull(), // 'abierta', 'cerrada'
  monto_apertura: numeric('monto_apertura', { precision: 12, scale: 2 }).default('0').notNull(),
  monto_cierre_declarado: numeric('monto_cierre_declarado', { precision: 12, scale: 2 }),
  monto_cierre_calculado: numeric('monto_cierre_calculado', { precision: 12, scale: 2 }).default('0'),
  diferencia_caja: numeric('diferencia_caja', { precision: 12, scale: 2 }).default('0'),
  ventas_efectivo: numeric('ventas_efectivo', { precision: 12, scale: 2 }).default('0').notNull(),
  ventas_transferencia: numeric('ventas_transferencia', { precision: 12, scale: 2 }).default('0').notNull(),
  ventas_tarjeta: numeric('ventas_tarjeta', { precision: 12, scale: 2 }).default('0').notNull(),
  total_ventas: numeric('total_ventas', { precision: 12, scale: 2 }).default('0').notNull(),
  total_devoluciones: numeric('total_devoluciones', { precision: 12, scale: 2 }).default('0').notNull(),
  total_separados_abonos: numeric('total_separados_abonos', { precision: 12, scale: 2 }).default('0').notNull(),
  numero_transacciones: integer('numero_transacciones').default(0).notNull(),
  notas: text('notas'),
  abierta_at: timestamp('abierta_at').defaultNow().notNull(),
  cerrada_at: timestamp('cerrada_at'),
  created_at: timestamp('created_at').defaultNow()
});

export type SesionCajaItem = typeof sesionesCaja.$inferSelect;
export type NewSesionCaja = typeof sesionesCaja.$inferInsert;
