import { z } from 'zod';

export const MovimientoInventarioDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  producto_id: z.coerce.number().int().min(1, 'El producto es requerido'),
  tipo: z.enum([
    'entrada_manual',
    'salida_manual',
    'ajuste_positivo',
    'ajuste_negativo',
    'perdida',
    'devolucion_entrada'
  ]),
  cantidad: z.coerce.number().positive('La cantidad debe ser mayor a 0'),
  costo_unitario: z.coerce.number().min(0).optional(),
  notas: z.string().optional()
});

export const AjusteStockRapidoDTO = z.object({
  producto_id: z.coerce.number().int().min(1),
  nuevo_stock: z.coerce.number().min(0),
  motivo: z.string().min(1, 'El motivo del ajuste es requerido')
});

export type MovimientoInventarioInput = z.infer<typeof MovimientoInventarioDTO>;
export type AjusteStockRapidoInput = z.infer<typeof AjusteStockRapidoDTO>;
