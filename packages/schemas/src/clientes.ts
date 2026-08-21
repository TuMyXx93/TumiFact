import { z } from 'zod';

export const CreateClienteDTO = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().optional().nullable(),
  tipo_identificacion_id: z.coerce.number().int().optional().nullable(),
  numero_identificacion: z.string().optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  telefono: z.string().optional().nullable(),
  telefono_secundario: z.string().optional().nullable(),
  direccion_id: z.coerce.number().int().optional().nullable(),
  direccion_texto: z.string().optional().nullable(),
  tipo_cliente: z.enum(['detal', 'mayorista', 'vip']).optional().default('detal'),
  notas: z.string().optional().nullable(),
});

export const UpdateClienteDTO = CreateClienteDTO.partial();
export type CreateClienteInput = z.infer<typeof CreateClienteDTO>;
export type UpdateClienteInput = z.infer<typeof UpdateClienteDTO>;
