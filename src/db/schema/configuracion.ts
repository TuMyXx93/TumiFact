import {
  customType,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';

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
  ancho_papel: integer('ancho_papel').default(80).notNull(),
  font_size: integer('font_size').default(1).notNull(),
  logo_data: bytea('logo_data'),
  logo_tipo: varchar('logo_tipo', { length: 50 }),
  qr_data: bytea('qr_data'),
  qr_tipo: varchar('qr_tipo', { length: 50 }),
  // White-label & 2026 customizations
  esquema_colores: jsonb('esquema_colores')
    .default({
      primary: '#2563eb',
      secondary: '#0891b2',
      accent: '#10b981',
      background: '#0b0f19',
      surface: '#0f172a',
    })
    .notNull(),
  mensaje_bienvenida: varchar('mensaje_bienvenida', { length: 200 }).default(
    '¡Gracias por su compra!'
  ),
  mensaje_pie: text('mensaje_pie').default('¡Vuelva pronto!'),
  politica_devolucion: text('politica_devolucion').default(
    'Cambios y devoluciones dentro de los 30 días con el comprobante de compra.'
  ),
  politica_separados: text('politica_separados').default(
    'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables si vence el plazo.'
  ),
  dias_plazo_separado_default: integer('dias_plazo_separado_default').default(30).notNull(),
  redes_sociales: jsonb('redes_sociales').default({}).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type ConfiguracionItem = typeof configuracionImpresion.$inferSelect;
export type NewConfiguracion = typeof configuracionImpresion.$inferInsert;
