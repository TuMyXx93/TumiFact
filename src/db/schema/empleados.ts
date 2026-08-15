import { pgTable, serial, integer, varchar, numeric, timestamp, date } from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios';

export const empleados = pgTable('empleados', {
  id: serial('id').primaryKey(),
  usuario_id: integer('usuario_id').references(() => usuarios.id, { onDelete: 'cascade' }).notNull().unique(),
  cargo: varchar('cargo', { length: 100 }).default('Vendedor/Cajero').notNull(),
  departamento: varchar('departamento', { length: 100 }),
  salario: numeric('salario', { precision: 12, scale: 2 }).default('0'),
  fecha_ingreso: date('fecha_ingreso').defaultNow(),
  turno: varchar('turno', { length: 20 }).default('completo'), // 'mañana', 'tarde', 'noche', 'completo'
  descuento_max_porcentaje: numeric('descuento_max_porcentaje', { precision: 5, scale: 2 }).default('10.00').notNull(), // % máx sin aprobación de gerente
  descuento_max_monto: numeric('descuento_max_monto', { precision: 10, scale: 2 }).default('50000.00').notNull(), // monto máx sin aprobación
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export type EmpleadoItem = typeof empleados.$inferSelect;
export type NewEmpleado = typeof empleados.$inferInsert;
