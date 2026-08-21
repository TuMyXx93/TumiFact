import { z } from 'zod';

export const SeparadoProductoItemDTO = z.object({
  producto_id: z.coerce.number().int().min(1, 'producto_id requerido'),
  cantidad: z.coerce.number().positive('cantidad debe ser > 0'),
  precio_unitario: z.coerce.number().min(0, 'precio_unitario >= 0'),
  unidad_medida: z.string().optional().default('UND'),
  subtotal: z.coerce.number().min(0),
  descuento_aplicado: z.coerce.number().min(0).optional().default(0),
});

export const CreateSeparadoDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  cliente_id: z.coerce.number().int().min(1, 'El cliente es requerido'),
  descripcion: z.string().min(1, 'La descripción del separado es requerida'),
  observaciones: z.string().optional(),
  valor_total: z.coerce.number().positive('El valor total debe ser > 0'),
  abono_inicial: z.coerce.number().positive('El abono inicial debe ser > 0'),
  dias_plazo: z.coerce.number().int().min(1).max(90).optional().default(30),
  forma_pago_abono: z.enum(['efectivo', 'transferencia', 'tarjeta']).optional().default('efectivo'),
  referencia_pago: z.string().optional(),
  productos: z.array(SeparadoProductoItemDTO).min(1, 'Debe incluir al menos un producto a separar'),
});

export const RegistrarAbonoDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  monto: z.coerce.number().positive('El monto a abonar debe ser mayor a 0'),
  forma_pago: z.enum(['efectivo', 'transferencia', 'tarjeta']).optional().default('efectivo'),
  referencia_pago: z.string().optional(),
  notas: z.string().optional(),
});

// Alias para compatibilidad con nombres previos
export const CreateAbonoDTO = RegistrarAbonoDTO;

export type CreateSeparadoInput = z.infer<typeof CreateSeparadoDTO>;
export type RegistrarAbonoInput = z.infer<typeof RegistrarAbonoDTO>;
export type CreateAbonoInput = z.infer<typeof CreateAbonoDTO>;
