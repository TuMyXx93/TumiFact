import { pgTable, serial, varchar, text, integer, timestamp, customType } from 'drizzle-orm/pg-core';

const bytea = customType<{ data: Buffer }>({
  dataType() {
    return 'bytea';
  },
});

export const configuracionImpresion = pgTable('configuracion_impresion', {
  id: serial('id').primaryKey(),
  nombre_negocio: varchar('nombre_negocio', { length: 100 }).notNull(),
  direccion: text('direccion'),
  telefono: varchar('telefono', { length: 20 }),
  nit: varchar('nit', { length: 50 }),
  pie_pagina: text('pie_pagina'),
  ancho_papel: integer('ancho_papel').default(80),
  font_size: integer('font_size').default(1),
  logo_data: bytea('logo_data'),
  logo_tipo: varchar('logo_tipo', { length: 50 }),
  qr_data: bytea('qr_data'),
  qr_tipo: varchar('qr_tipo', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow()
});

export type ConfiguracionItem = typeof configuracionImpresion.$inferSelect;
export type NewConfiguracion = typeof configuracionImpresion.$inferInsert;
