import { z } from 'zod';

export const SaveConfiguracionDTO = z.object({
  nombre_negocio: z.string().min(1, 'El nombre del negocio es requerido'),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable(),
  nit: z.string().optional().nullable(),
  pie_pagina: z.string().optional().nullable(),
  ancho_papel: z.coerce.number().optional().default(80),
  font_size: z.coerce.number().optional().default(1)
});

export type SaveConfiguracionInput = z.infer<typeof SaveConfiguracionDTO>;
