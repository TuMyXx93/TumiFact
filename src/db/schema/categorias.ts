import { pgTable, serial, varchar, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core';

export const categoriasProducto = pgTable('categorias_producto', {
  id: serial('id').primaryKey(),
  nombre: varchar('nombre', { length: 100 }).notNull().unique(),
  tipo: varchar('tipo', { length: 50 }).notNull().default('generico'), // 'perecedero', 'vestimenta', 'calzado', 'tecnologia', 'artesania', 'bisuteria', 'generico'
  descripcion: text('descripcion'),
  campos_extra: jsonb('campos_extra').default([]).notNull(),
  aplica_inventario: boolean('aplica_inventario').default(true).notNull(),
  activo: boolean('activo').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull()
});

export type CategoriaProductoItem = typeof categoriasProducto.$inferSelect;
export type NewCategoriaProducto = typeof categoriasProducto.$inferInsert;
