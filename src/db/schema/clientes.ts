import { pgTable, serial, varchar, text, integer, numeric, boolean, timestamp } from 'drizzle-orm/pg-core';
import { tiposIdentificacion } from './tipos_identificacion';
import { direcciones } from './direcciones';

export const clientes = pgTable('clientes', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 80 }).notNull(),
  apellido: varchar('apellido', { length: 80 }),
  tipo_identificacion_id: integer('tipo_identificacion_id').references(() => tiposIdentificacion.id),
  numero_identificacion: varchar('numero_identificacion', { length: 30 }),
  email: varchar('email', { length: 150 }),
  telefono: varchar('telefono', { length: 20 }),
  telefono_secundario: varchar('telefono_secundario', { length: 20 }),
  direccion_id: integer('direccion_id').references(() => direcciones.id),
  direccion_texto: text('direccion_texto'), // Backward compatibility and fast display
  tipo_cliente: varchar('tipo_cliente', { length: 20 }).default('detal').notNull(), // 'detal', 'mayorista', 'vip'
  notas: text('notas'),
  total_compras: numeric('total_compras', { precision: 14, scale: 2 }).default('0').notNull(),
  numero_facturas: integer('numero_facturas').default(0).notNull(),
  ultima_compra: timestamp('ultima_compra'),
  activo: boolean('activo').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export type ClienteItem = typeof clientes.$inferSelect;
export type NewCliente = typeof clientes.$inferInsert;
