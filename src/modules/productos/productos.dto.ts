import { z } from 'zod';

export const CreateProductoDTO = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional().nullable(),
  categoria_id: z.coerce.number().int().optional().nullable(),
  proveedor_id: z.coerce.number().int().optional().nullable(), // Nullable: provider is optional
  precio_kg: z.coerce.number().min(0, 'precio_kg debe ser numérico >= 0').optional().default(0),
  precio_unidad: z.coerce.number().min(0, 'precio_unidad debe ser numérico >= 0').optional().default(0),
  precio_libra: z.coerce.number().min(0, 'precio_libra debe ser numérico >= 0').optional().default(0),
  precio_detal: z.coerce.number().min(0, 'precio_detal debe ser >= 0').optional().default(0),
  precio_mayorista: z.coerce.number().min(0, 'precio_mayorista debe ser >= 0').optional().default(0),
  cantidad_mayorista: z.coerce.number().int().min(1).optional().default(10),
  stock_actual: z.coerce.number().min(0).optional().default(0),
  stock_minimo: z.coerce.number().min(0).optional().default(5),
  atributos: z.record(z.string(), z.any()).optional().default({})
});

export const UpdateProductoDTO = CreateProductoDTO.partial();

export type CreateProductoInput = z.infer<typeof CreateProductoDTO>;
export type UpdateProductoInput = z.infer<typeof UpdateProductoDTO>;
