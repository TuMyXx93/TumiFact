import { z } from 'zod';

export const CreateCategoriaDTO = z.object({
  nombre: z.string().min(1, 'El nombre de categoría es requerido'),
  tipo: z
    .enum([
      'ropa',
      'calzado',
      'tecnologia',
      'articulos',
    ])
    .optional()
    .default('articulos'),
  descripcion: z.string().optional(),
  campos_extra: z
    .array(
      z.object({
        key: z.string(),
        label: z.string(),
        type: z.string(),
        options: z.array(z.string()).optional(),
      })
    )
    .optional()
    .default([]),
  aplica_inventario: z.boolean().optional().default(true),
});

export const UpdateCategoriaDTO = CreateCategoriaDTO.partial();

export type CreateCategoriaInput = z.infer<typeof CreateCategoriaDTO>;
export type UpdateCategoriaInput = z.infer<typeof UpdateCategoriaDTO>;
