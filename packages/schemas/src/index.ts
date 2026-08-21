import { z } from 'zod';

// Re-export centralizado de DTOs TumiFact
// Fuente única para backend validateDTO + frontend forms + OpenAPI generación
// Fase 5 contracts — workspaces bootstrap (TumiFact usa SERIAL integer, no UUID)

export * from './auth';
export * from './caja';
export * from './categorias';
export * from './clientes';
export * from './configuracion';
export * from './descuentos';
export * from './devoluciones';
export * from './empleados';
export * from './facturas';
export * from './inventario';
export * from './productos';
export * from './proveedores';
export * from './separados';

// Helpers comunes
export const idSchema = z.coerce.number().int().positive();
export const uuidSchema = z.string().uuid();
export const emailSchema = z.string().email();
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const apiResponseSchema = <T extends z.ZodType>(dataSchema: T) =>
  z.object({
    data: dataSchema,
    correlationId: z.string().optional(),
  });
