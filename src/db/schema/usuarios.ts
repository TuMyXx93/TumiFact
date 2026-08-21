import { boolean, integer, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core';
import { direcciones } from './direcciones';
import { roles } from './roles';
import { tiposIdentificacion } from './tipos_identificacion';

export const usuarios = pgTable('usuarios', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 80 }).notNull(),
  apellido: varchar('apellido', { length: 80 }).notNull(),
  tipo_identificacion_id: integer('tipo_identificacion_id').references(
    () => tiposIdentificacion.id
  ),
  numero_identificacion: varchar('numero_identificacion', { length: 30 }).unique(),
  email: varchar('email', { length: 150 }).notNull().unique(),
  telefono: varchar('telefono', { length: 20 }),
  direccion_id: integer('direccion_id').references(() => direcciones.id),
  password_hash: varchar('password_hash', { length: 255 }).notNull(),
  rol_id: integer('rol_id')
    .references(() => roles.id)
    .notNull(),
  activo: boolean('activo').default(true).notNull(),
  ultimo_login: timestamp('ultimo_login'),
  intentos_fallidos: integer('intentos_fallidos').default(0).notNull(),
  bloqueado_hasta: timestamp('bloqueado_hasta'),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export type UsuarioItem = typeof usuarios.$inferSelect;
export type NewUsuario = typeof usuarios.$inferInsert;
