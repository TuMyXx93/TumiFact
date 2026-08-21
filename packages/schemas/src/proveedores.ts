import { z } from 'zod';

export const CreateProveedorDTO = z.object({
  nombre: z.string().min(1, 'El nombre del proveedor es requerido'),
  razon_social: z.string().optional(),
  tipo_identificacion_id: z.coerce.number().int().optional(),
  numero_identificacion: z.string().optional(),
  contacto_nombre: z.string().optional(),
  email: z.string().email('Correo inválido').optional().or(z.literal('')),
  telefono: z.string().optional(),
  telefono_secundario: z.string().optional(),
  website: z.string().optional(),
  direccion_texto: z.string().optional(),
  plazo_pago_dias: z.coerce.number().int().min(0).optional().default(30),
  moneda: z.string().optional().default('COP'),
  notas: z.string().optional(),
});

export const UpdateProveedorDTO = CreateProveedorDTO.partial();

export type CreateProveedorInput = z.infer<typeof CreateProveedorDTO>;
export type UpdateProveedorInput = z.infer<typeof UpdateProveedorDTO>;
