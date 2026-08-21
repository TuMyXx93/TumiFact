import { integer, numeric, pgTable, serial, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { descuentos } from './descuentos';
import { facturas } from './facturas';
import { productos } from './productos';

export const detalleFactura = pgTable('detalle_factura', {
  id: serial('id').primaryKey(),
  idempotency_key: uuid('idempotency_key'),
  factura_id: integer('factura_id')
    .references(() => facturas.id, { onDelete: 'cascade' })
    .notNull(),
  producto_id: integer('producto_id')
    .references(() => productos.id)
    .notNull(),
  descuento_id: integer('descuento_id').references(() => descuentos.id),
  descuento_inline_tipo: varchar('descuento_inline_tipo', { length: 20 }), // 'porcentaje', 'monto_fijo'
  descuento_inline_valor: numeric('descuento_inline_valor', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  descuento_aplicado: numeric('descuento_aplicado', { precision: 10, scale: 2 })
    .default('0')
    .notNull(),
  cantidad: numeric('cantidad', { precision: 10, scale: 2 }).notNull(),
  precio_original: numeric('precio_original', { precision: 10, scale: 2 }),
  precio_unitario: numeric('precio_unitario', { precision: 10, scale: 2 }).notNull(),
  unidad_medida: varchar('unidad_medida', { length: 10 }).default('KG').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type DetalleFacturaItem = typeof detalleFactura.$inferSelect;
export type NewDetalleFactura = typeof detalleFactura.$inferInsert;
