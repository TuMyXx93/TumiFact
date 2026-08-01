import { z } from 'zod';

export const CreateProductoDTO = z.object({
  codigo: z.string().min(1, 'El código es requerido'),
  nombre: z.string().min(1, 'El nombre es requerido'),
  precio_kg: z.coerce.number().min(0, 'precio_kg debe ser numérico >= 0').optional().default(0),
  precio_unidad: z.coerce.number().min(0, 'precio_unidad debe ser numérico >= 0').optional().default(0),
  precio_libra: z.coerce.number().min(0, 'precio_libra debe ser numérico >= 0').optional().default(0)
});

export const UpdateProductoDTO = CreateProductoDTO.partial();

export type CreateProductoInput = z.infer<typeof CreateProductoDTO>;
export type UpdateProductoInput = z.infer<typeof UpdateProductoDTO>;
