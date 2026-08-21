import {
  bigserial,
  customType,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { sesionesCaja } from './sesiones_caja';
import { usuarios } from './usuarios';

const inet = customType<{ data: string }>({
  dataType() {
    return 'inet';
  },
});

export const auditLog = pgTable('audit_log', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  usuario_id: integer('usuario_id').references(() => usuarios.id),
  sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),
  accion: varchar('accion', { length: 100 }).notNull(), // 'LOGIN', 'FACTURA_CREADA', 'ABONO_SEPARADO', etc.
  entidad: varchar('entidad', { length: 50 }), // 'facturas', 'separados', 'productos', etc.
  entidad_id: integer('entidad_id'),
  datos_previos: jsonb('datos_previos'),
  datos_nuevos: jsonb('datos_nuevos'),
  ip_address: inet('ip_address'),
  user_agent: text('user_agent'),
  resultado: varchar('resultado', { length: 20 }).default('ok').notNull(), // 'ok', 'error', 'rechazado'
  mensaje_error: text('mensaje_error'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type AuditLogItem = typeof auditLog.$inferSelect;
export type NewAuditLog = typeof auditLog.$inferInsert;
