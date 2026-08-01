import { z } from 'zod';

export const CreateClienteDTO = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().optional().nullable(),
  telefono: z.string().optional().nullable()
});

export const UpdateClienteDTO = CreateClienteDTO.partial();

export type CreateClienteInput = z.infer<typeof CreateClienteDTO>;
export type UpdateClienteInput = z.infer<typeof UpdateClienteDTO>;
