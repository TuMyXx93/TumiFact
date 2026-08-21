import {
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { clientes } from './clientes';
import { sesionesCaja } from './sesiones_caja';
import { usuarios } from './usuarios';

export const facturas = pgTable('facturas', {
  id: serial('id').primaryKey(),
  idempotency_key: uuid('idempotency_key').unique(), // Idempotency protection
  cliente_id: integer('cliente_id').references(() => clientes.id),
  usuario_id: integer('usuario_id').references(() => usuarios.id),
  sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),
  fecha: timestamp('fecha').defaultNow().notNull(),
  subtotal: numeric('subtotal', { precision: 12, scale: 2 }).default('0').notNull(),
  descuento_total: numeric('descuento_total', { precision: 12, scale: 2 }).default('0').notNull(),
  descuento_detalle: jsonb('descuento_detalle').default([]).notNull(),
  total: numeric('total', { precision: 12, scale: 2 }).notNull(),
  forma_pago: varchar('forma_pago', { length: 50 }).default('efectivo').notNull(), // 'efectivo', 'transferencia', 'tarjeta', 'mixto'
  tipo: varchar('tipo', { length: 20 }).default('contado').notNull(), // 'contado', 'separado_final'
  estado: varchar('estado', { length: 20 }).default('completada').notNull(), // 'completada', 'devuelta', 'parcialmente_devuelta', 'anulada'
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type FacturaItem = typeof facturas.$inferSelect;
export type NewFactura = typeof facturas.$inferInsert;
