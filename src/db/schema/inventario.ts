import {
  bigserial,
  integer,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';
import { productos } from './productos';
import { sesionesCaja } from './sesiones_caja';
import { usuarios } from './usuarios';

export const movimientosInventario = pgTable('movimientos_inventario', {
  id: bigserial('id', { mode: 'number' }).primaryKey(),
  idempotency_key: uuid('idempotency_key').unique(),
  producto_id: integer('producto_id')
    .references(() => productos.id)
    .notNull(),
  usuario_id: integer('usuario_id').references(() => usuarios.id),
  sesion_caja_id: integer('sesion_caja_id').references(() => sesionesCaja.id),
  tipo: varchar('tipo', { length: 40 }).notNull(), // 'entrada_manual', 'salida_venta', 'devolucion_entrada', 'ajuste_positivo', 'ajuste_negativo', 'perdida', 'separado_reserva', 'separado_liberacion'
  cantidad: numeric('cantidad', { precision: 10, scale: 2 }).notNull(),
  stock_anterior: numeric('stock_anterior', { precision: 10, scale: 2 }).notNull(),
  stock_nuevo: numeric('stock_nuevo', { precision: 10, scale: 2 }).notNull(),
  costo_unitario: numeric('costo_unitario', { precision: 10, scale: 2 }),
  referencia_tipo: varchar('referencia_tipo', { length: 30 }), // 'factura', 'separado', 'devolucion', 'manual'
  referencia_id: integer('referencia_id'),
  notas: text('notas'),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type MovimientoInventarioItem = typeof movimientosInventario.$inferSelect;
export type NewMovimientoInventario = typeof movimientosInventario.$inferInsert;
