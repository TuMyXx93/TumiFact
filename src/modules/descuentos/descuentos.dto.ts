import { z } from 'zod';

export const CreateDescuentoDTO = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  descripcion: z.string().optional(),
  tipo: z.enum(['porcentaje', 'monto_fijo', 'precio_especial']),
  valor: z.coerce.number().positive('El valor del descuento debe ser > 0'),
  aplica_a: z.enum(['linea', 'total']).optional().default('total'),
  requiere_aprobacion: z.boolean().optional().default(false),
  vigencia_desde: z.string().optional().nullable(),
  vigencia_hasta: z.string().optional().nullable()
});

export const UpdateDescuentoDTO = CreateDescuentoDTO.partial();

export type CreateDescuentoInput = z.infer<typeof CreateDescuentoDTO>;
export type UpdateDescuentoInput = z.infer<typeof UpdateDescuentoDTO>;
