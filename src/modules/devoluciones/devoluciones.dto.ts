import { z } from 'zod';

export const DevolucionItemDTO = z.object({
  detalle_factura_id: z.coerce.number().int().optional(),
  producto_id: z.coerce.number().int().min(1),
  cantidad_devuelta: z.coerce.number().positive(),
  precio_unitario: z.coerce.number().min(0),
  motivo_item: z.string().optional(),
  condicion: z.enum(['bueno', 'dañado', 'defectuoso']).optional().default('bueno'),
  reingresa_inventario: z.boolean().optional().default(true)
});

export const CreateDevolucionDTO = z.object({
  idempotency_key: z.string().uuid().optional(),
  factura_id: z.coerce.number().int().min(1, 'factura_id requerido'),
  tipo: z.enum(['devolucion_total', 'devolucion_parcial', 'cambio_producto']),
  motivo: z.string().min(1, 'El motivo es requerido'),
  descripcion_detallada: z.string().optional(),
  forma_devolucion: z.enum(['efectivo', 'credito_tienda', 'transferencia']).optional().default('efectivo'),
  items: z.array(DevolucionItemDTO).min(1, 'Debe incluir al menos un ítem a devolver')
});

export type CreateDevolucionInput = z.infer<typeof CreateDevolucionDTO>;
