import { z } from 'zod';

export const DetalleFacturaDTO = z.object({
  producto_id: z.coerce.number().int().min(1, 'producto_id debe ser un entero > 0'),
  cantidad: z.coerce.number().positive('cantidad debe ser mayor a 0'),
  precio: z.coerce.number().min(0, 'precio debe ser numérico >= 0'),
  unidad: z.enum(['KG', 'UND', 'LB']).optional().default('KG')
});

export const CreateFacturaDTO = z.object({
  cliente_id: z.coerce.number().int().min(1, 'cliente_id debe ser un entero > 0'),
  productos: z.array(DetalleFacturaDTO).min(1, 'productos debe ser un array no vacío'),
  total: z.coerce.number().optional(),
  forma_pago: z.enum(['efectivo', 'transferencia']).optional().default('efectivo')
});

export type CreateFacturaInput = z.infer<typeof CreateFacturaDTO>;
export type DetalleFacturaInput = z.infer<typeof DetalleFacturaDTO>;
