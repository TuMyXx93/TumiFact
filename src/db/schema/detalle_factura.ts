import { pgTable, serial, integer, numeric, varchar, timestamp } from 'drizzle-orm/pg-core';
import { facturas } from './facturas';
import { productos } from './productos';

export const detalleFactura = pgTable('detalle_factura', {
  id: serial('id').primaryKey(),
  factura_id: integer('factura_id').references(() => facturas.id, { onDelete: 'cascade' }).notNull(),
  producto_id: integer('producto_id').references(() => productos.id).notNull(),
  cantidad: numeric('cantidad', { precision: 10, scale: 2 }).notNull(),
  precio_unitario: numeric('precio_unitario', { precision: 10, scale: 2 }).notNull(),
  unidad_medida: varchar('unidad_medida', { length: 10 }).default('KG').notNull(),
  subtotal: numeric('subtotal', { precision: 10, scale: 2 }).notNull(),
  created_at: timestamp('created_at').defaultNow()
});

export type DetalleFacturaItem = typeof detalleFactura.$inferSelect;
export type NewDetalleFactura = typeof detalleFactura.$inferInsert;
