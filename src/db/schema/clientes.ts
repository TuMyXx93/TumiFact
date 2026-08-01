import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  direccion: text('direccion'),
  telefono: varchar('telefono', { length: 20 }),
  created_at: timestamp('created_at').defaultNow()
});

export type ClienteItem = typeof clientes.$inferSelect;
export type NewCliente = typeof clientes.$inferInsert;
