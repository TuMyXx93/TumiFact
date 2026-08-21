import { z } from 'zod';

export const AbrirCajaDTO = z.object({
  monto_apertura: z.coerce.number().min(0, 'El monto de apertura debe ser >= 0'),
  notas: z.string().optional()
});

export const CerrarCajaDTO = z.object({
  monto_cierre_declarado: z.coerce.number().min(0, 'El monto de cierre declarado debe ser >= 0'),
  notas: z.string().optional()
});

export type AbrirCajaInput = z.infer<typeof AbrirCajaDTO>;
export type CerrarCajaInput = z.infer<typeof CerrarCajaDTO>;
