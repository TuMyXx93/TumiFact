import { pgTable, serial, varchar, text, numeric, boolean, date, timestamp, integer } from 'drizzle-orm/pg-core';

export const descuentos = pgTable('descuentos', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull(),
  descripcion: text('descripcion'),
  tipo: varchar('tipo', { length: 30 }).notNull(), // 'porcentaje', 'monto_fijo', 'precio_especial'
  valor: numeric('valor', { precision: 10, scale: 2 }).notNull(),
  aplica_a: varchar('aplica_a', { length: 20 }).default('total').notNull(), // 'linea', 'total'
  requiere_aprobacion: boolean('requiere_aprobacion').default(false).notNull(),
  activo: boolean('activo').default(true).notNull(),
  vigencia_desde: date('vigencia_desde'),
  vigencia_hasta: date('vigencia_hasta'),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull()
});

export type DescuentoItem = typeof descuentos.$inferSelect;
export type NewDescuento = typeof descuentos.$inferInsert;
