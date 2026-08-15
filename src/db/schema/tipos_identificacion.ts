import { pgTable, serial, varchar } from 'drizzle-orm/pg-core';

export const tiposIdentificacion = pgTable('tipos_identificacion', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 10 }).notNull().unique(), // 'CC', 'NIT', 'CE', 'PP', 'TI', 'RUT'
  nombre: varchar('nombre', { length: 100 }).notNull(),
  aplica_a: varchar('aplica_a', { length: 20 }).default('todos').notNull() // 'persona', 'empresa', 'todos'
});

export type TipoIdentificacionItem = typeof tiposIdentificacion.$inferSelect;
export type NewTipoIdentificacion = typeof tiposIdentificacion.$inferInsert;
