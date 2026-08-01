import { pgTable, serial, integer, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';
import { clientes } from './clientes';

export const facturas = pgTable('facturas', {
  id: serial('id').primaryKey(),
  cliente_id: integer('cliente_id').references(() => clientes.id),
  fecha: timestamp('fecha').defaultNow(),
  total: numeric('total', { precision: 10, scale: 2 }).notNull(),
  forma_pago: varchar('forma_pago', { length: 50 }).default('efectivo').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export type FacturaItem = typeof facturas.$inferSelect;
export type NewFactura = typeof facturas.$inferInsert;
