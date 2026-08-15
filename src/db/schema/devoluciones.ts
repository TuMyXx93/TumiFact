import { pgTable, serial, integer, varchar, text, numeric, boolean, timestamp, uuid } from 'drizzle-orm/pg-core';
import { facturas } from './facturas';
import { detalleFactura } from './detalle_factura';
import { productos } from './productos';
import { usuarios } from './usuarios';
import { sesionesCaja } from './sesiones_caja';

export const devoluciones = pgTable('devoluciones', {
  id: serial('id').primaryKey(),
  idempotency_key: uuid('idempotency_key').unique(),
  factura_id: integer('factura_id').references(() => facturas.id).notNull(),
  usuario_solicitante_id: integer('usuario_solicitante_id').references(() => usuarios.id).notNull(),
  usuario_aprobador_id: integer('usuario_aprobador_id').references(() => usuarios.id),
  sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),
  tipo: varchar('tipo', { length: 25 }).notNull(), // 'devolucion_total', 'devolucion_parcial', 'cambio_producto'
  motivo: varchar('motivo', { length: 100 }).notNull(),
  descripcion_detallada: text('descripcion_detallada'),
  monto_devuelto: numeric('monto_devuelto', { precision: 12, scale: 2 }).default('0').notNull(),
  forma_devolucion: varchar('forma_devolucion', { length: 30 }).default('efectivo').notNull(), // 'efectivo', 'credito_tienda', 'transferencia'
  estado: varchar('estado', { length: 20 }).default('aprobada').notNull(), // 'pendiente', 'aprobada', 'rechazada'
  fecha_aprobacion: timestamp('fecha_aprobacion'),
  notas_aprobador: text('notas_aprobador'),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export const detalleDevolucion = pgTable('detalle_devolucion', {
  id: serial('id').primaryKey(),
  devolucion_id: integer('devolucion_id').references(() => devoluciones.id, { onDelete: 'cascade' }).notNull(),
  detalle_factura_id: integer('detalle_factura_id').references(() => detalleFactura.id),
  producto_id: integer('producto_id').references(() => productos.id).notNull(),
  cantidad_devuelta: numeric('cantidad_devuelta', { precision: 10, scale: 2 }).notNull(),
  precio_unitario: numeric('precio_unitario', { precision: 10, scale: 2 }).notNull(),
  subtotal_devuelto: numeric('subtotal_devuelto', { precision: 10, scale: 2 }).notNull(),
  motivo_item: text('motivo_item'),
  condicion: varchar('condicion', { length: 30 }).default('bueno').notNull(), // 'bueno', 'dañado', 'defectuoso'
  reingresa_inventario: boolean('reingresa_inventario').default(true).notNull()
});

export type DevolucionItem = typeof devoluciones.$inferSelect;
export type NewDevolucion = typeof devoluciones.$inferInsert;
export type DetalleDevolucionItem = typeof detalleDevolucion.$inferSelect;
export type NewDetalleDevolucion = typeof detalleDevolucion.$inferInsert;
