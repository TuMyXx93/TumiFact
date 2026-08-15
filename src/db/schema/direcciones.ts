import { pgTable, serial, varchar, text, timestamp } from 'drizzle-orm/pg-core';

export const direcciones = pgTable('direcciones', {
  id: serial('id').primaryKey(),
  calle: text('calle'),
  barrio: varchar('barrio', { length: 100 }),
  ciudad: varchar('ciudad', { length: 100 }).default('Ciudad').notNull(),
  departamento: varchar('departamento', { length: 100 }),
  pais: varchar('pais', { length: 60 }).default('Colombia').notNull(),
  codigo_postal: varchar('codigo_postal', { length: 20 }),
  referencia: text('referencia'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export type DireccionItem = typeof direcciones.$inferSelect;
export type NewDireccion = typeof direcciones.$inferInsert;
