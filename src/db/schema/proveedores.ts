import { pgTable, serial, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { tiposIdentificacion } from './tipos_identificacion';
import { direcciones } from './direcciones';

export const proveedores = pgTable('proveedores', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  razon_social: varchar('razon_social', { length: 150 }),
  tipo_identificacion_id: integer('tipo_identificacion_id').references(() => tiposIdentificacion.id),
  numero_identificacion: varchar('numero_identificacion', { length: 30 }),
  contacto_nombre: varchar('contacto_nombre', { length: 100 }),
  email: varchar('email', { length: 150 }),
  telefono: varchar('telefono', { length: 20 }),
  telefono_secundario: varchar('telefono_secundario', { length: 20 }),
  website: varchar('website', { length: 200 }),
  direccion_id: integer('direccion_id').references(() => direcciones.id),
  plazo_pago_dias: integer('plazo_pago_dias').default(30).notNull(),
  moneda: varchar('moneda', { length: 10 }).default('COP').notNull(),
  notas: text('notas'),
  activo: boolean('activo').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export type ProveedorItem = typeof proveedores.$inferSelect;
export type NewProveedor = typeof proveedores.$inferInsert;
