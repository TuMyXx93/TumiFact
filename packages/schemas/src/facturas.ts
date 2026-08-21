import { z } from 'zod';

export const DetalleFacturaDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  producto_id: z.coerce.number().int().min(1, 'producto_id debe ser un entero > 0'),
  cantidad: z.coerce.number().positive('cantidad debe ser mayor a 0'),
  precio: z.coerce.number().min(0, 'precio debe ser numérico >= 0'),
  precio_original: z.coerce.number().min(0).optional(),
  unidad: z.enum(['KG', 'UND', 'LB']).optional().default('KG'),
  descuento_id: z.coerce.number().int().optional().nullable(),
  descuento_inline_tipo: z.enum(['porcentaje', 'monto_fijo']).optional().nullable(),
  descuento_inline_valor: z.coerce.number().min(0).optional().default(0),
  descuento_aplicado: z.coerce.number().min(0).optional().default(0),
});

export const CreateFacturaDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  cliente_id: z.coerce.number().int().min(1, 'cliente_id debe ser un entero > 0'),
  subtotal: z.coerce.number().optional(),
  descuento_total: z.coerce.number().min(0).optional().default(0),
  descuento_detalle: z
    .array(z.object({ tipo: z.string(), valor: z.number(), motivo: z.string().optional() }))
    .optional()
    .default([]),
  total: z.coerce.number().optional(),
  forma_pago: z
    .enum(['efectivo', 'transferencia', 'tarjeta', 'mixto'])
    .optional()
    .default('efectivo'),
  tipo: z.enum(['contado', 'separado_final']).optional().default('contado'),
  productos: z.array(DetalleFacturaDTO).min(1, 'productos debe ser un array no vacío'),
});

export type CreateFacturaInput = z.infer<typeof CreateFacturaDTO>;
export type DetalleFacturaInput = z.infer<typeof DetalleFacturaDTO>;
