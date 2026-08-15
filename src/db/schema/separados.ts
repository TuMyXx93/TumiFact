import { pgTable, serial, integer, text, numeric, date, varchar, timestamp, uuid } from 'drizzle-orm/pg-core';
import { clientes } from './clientes';
import { usuarios } from './usuarios';
import { sesionesCaja } from './sesiones_caja';
import { facturas } from './facturas';
import { productos } from './productos';

export const separados = pgTable('separados', {
  id: serial('id').primaryKey(),
  idempotency_key: uuid('idempotency_key').unique(),
  cliente_id: integer('cliente_id').references(() => clientes.id).notNull(),
  usuario_apertura_id: integer('usuario_apertura_id').references(() => usuarios.id).notNull(),
  sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),
  descripcion: text('descripcion').notNull(),
  observaciones: text('observaciones'),
  valor_total: numeric('valor_total', { precision: 12, scale: 2 }).notNull(),
  abono_inicial: numeric('abono_inicial', { precision: 12, scale: 2 }).notNull(),
  total_abonado: numeric('total_abonado', { precision: 12, scale: 2 }).default('0').notNull(),
  saldo_pendiente: numeric('saldo_pendiente', { precision: 12, scale: 2 }).notNull(),
  fecha_inicio: date('fecha_inicio').defaultNow().notNull(),
  fecha_limite: date('fecha_limite').notNull(),
  dias_plazo: integer('dias_plazo').default(30).notNull(),
  estado: varchar('estado', { length: 30 }).default('activo').notNull(), // 'activo', 'completado', 'vencido', 'cancelado', 'extendido'
  factura_id: integer('factura_id').references(() => facturas.id), // populated when completed
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export const separadosProductos = pgTable('separados_productos', {
  id: serial('id').primaryKey(),
  separado_id: integer('separado_id').references(() => separados.id, { onDelete: 'cascade' }).notNull(),
  producto_id: integer('producto_id').references(() => productos.id).notNull(),
  cantidad: numeric('cantidad', { precision: 10, scale: 2 }).notNull(),
  precio_unitario: numeric('precio_unitario', { precision: 10, scale: 2 }).notNull(),
  unidad_medida: varchar('unidad_medida', { length: 10 }).default('UND').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  descuento_aplicado: numeric('descuento_aplicado', { precision: 10, scale: 2 }).default('0').notNull()
});

export type SeparadoItem = typeof separados.$inferSelect;
export type NewSeparado = typeof separados.$inferInsert;
export type SeparadoProductoItem = typeof separadosProductos.$inferSelect;
export type NewSeparadoProducto = typeof separadosProductos.$inferInsert;
