import { z } from 'zod';

export const CreateSeparadoDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  cliente_id: z.coerce.number().int().min(1),
  descripcion: z.string().min(1),
  observaciones: z.string().optional().nullable(),
  valor_total: z.coerce.number().positive(),
  abono_inicial: z.coerce.number().min(0),
  dias_plazo: z.coerce.number().int().min(1).max(90).optional().default(30),
  sesion_caja_id: z.coerce.number().int().optional().nullable(),
  productos: z
    .array(
      z.object({
        producto_id: z.coerce.number().int().min(1),
        cantidad: z.coerce.number().positive(),
        precio_unitario: z.coerce.number().min(0),
        unidad_medida: z.string().optional().default('UND'),
        subtotal: z.coerce.number().min(0),
        descuento_aplicado: z.coerce.number().min(0).optional().default(0)
      })
    )
    .optional()
});

export const CreateAbonoDTO = z.object({
  separado_id: z.coerce.number().int().min(1),
  monto: z.coerce.number().positive(),
  forma_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']).optional().default('efectivo'),
  referencia_pago: z.string().optional().nullable(),
  notas: z.string().optional().nullable(),
  idempotency_key: z.string().uuid().optional()
});

export type CreateSeparadoInput = z.infer<typeof CreateSeparadoDTO>;
export type CreateAbonoInput = z.infer<typeof CreateAbonoDTO>;
