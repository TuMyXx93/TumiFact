import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import { categoriasProducto } from './categorias';
import { proveedores } from './proveedores';

export const productos = pgTable('productos', {
  id: serial('id').primaryKey(),
  codigo: varchar('codigo', { length: 50 }).notNull().unique(),
  nombre: varchar('nombre', { length: 150 }).notNull(),
  descripcion: text('descripcion'),
  categoria_id: integer('categoria_id').references(() => categoriasProducto.id),
  proveedor_id: integer('proveedor_id').references(() => proveedores.id), // Nullable: provider is optional
  precio_kg: numeric('precio_kg', { precision: 10, scale: 2 }).default('0').notNull(),
  precio_unidad: numeric('precio_unidad', { precision: 10, scale: 2 }).default('0').notNull(),
  precio_libra: numeric('precio_libra', { precision: 10, scale: 2 }).default('0').notNull(),
  precio_detal: numeric('precio_detal', { precision: 10, scale: 2 }).default('0').notNull(),
  precio_mayorista: numeric('precio_mayorista', { precision: 10, scale: 2 }).default('0').notNull(),
  cantidad_mayorista: integer('cantidad_mayorista').default(10).notNull(),
  stock_actual: numeric('stock_actual', { precision: 10, scale: 2 }).default('0').notNull(),
  stock_minimo: numeric('stock_minimo', { precision: 10, scale: 2 }).default('5').notNull(),
  atributos: jsonb('atributos').default({}).notNull(), // { talla, color, serial, garantia_dias, fecha_vencimiento, ... }
  activo: boolean('activo').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export type ProductoItem = typeof productos.$inferSelect;
export type NewProducto = typeof productos.$inferInsert;
