import { jsonb, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core';

export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 50 }).notNull().unique(), // 'admin', 'gerente', 'empleado'
  descripcion: text('descripcion'),
  permisos: jsonb('permisos').default({}).notNull(),
  created_at: timestamp('created_at').defaultNow(),
});

export type RolItem = typeof roles.$inferSelect;
export type NewRol = typeof roles.$inferInsert;
