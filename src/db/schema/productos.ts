import { pgTable, serial, varchar, numeric, timestamp } from 'drizzle-orm/pg-core';

export const productos = pgTable('productos', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  precio_kg: numeric('precio_kg', { precision: 10, scale: 2 }).default('0').notNull(),
  precio_unidad: numeric('precio_unidad', { precision: 10, scale: 2 }).default('0').notNull(),
  precio_libra: numeric('precio_libra', { precision: 10, scale: 2 }).default('0').notNull(),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export type ProductoItem = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;
