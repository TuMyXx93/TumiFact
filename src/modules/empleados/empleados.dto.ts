import { z } from 'zod';

export const CreateEmpleadoDTO = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipo_identificacion_id: z.coerce.number().int().optional().default(1),
  numero_identificacion: z.string().min(1, 'El número de documento es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().optional().nullable().transform(val => val || null),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol_id: z.coerce.number().int().min(1, 'El rol es requerido'),
  cargo: z.string().optional().default('Vendedor/Cajero'),
  departamento: z.string().optional().nullable().transform(val => val || 'Caja'),
  salario: z.coerce.number().optional().default(0),
  turno: z.enum(['mañana', 'tarde', 'noche', 'completo']).optional().default('completo'),
  descuento_max_porcentaje: z.coerce.number().min(0).max(100).optional().default(10),
  descuento_max_monto: z.coerce.number().min(0).optional().default(50000)
});

export const UpdateEmpleadoDTO = z.object({
  nombre: z.string().min(1, 'El nombre es requerido').optional(),
  apellido: z.string().min(1, 'El apellido es requerido').optional(),
  email: z.string().email('Correo electrónico inválido').optional(),
  tipo_identificacion_id: z.coerce.number().int().optional(),
  numero_identificacion: z.string().optional(),
  telefono: z.string().optional().nullable().transform(val => val || null),
  password: z.string().optional().nullable().transform(val => (val && val.trim().length > 0 ? val : undefined)),
  rol_id: z.coerce.number().int().optional(),
  cargo: z.string().optional(),
  departamento: z.string().optional().nullable().transform(val => val || null),
  salario: z.coerce.number().optional(),
  turno: z.enum(['mañana', 'tarde', 'noche', 'completo']).optional(),
  descuento_max_porcentaje: z.coerce.number().min(0).max(100).optional(),
  descuento_max_monto: z.coerce.number().min(0).optional()
});

export type CreateEmpleadoInput = z.infer<typeof CreateEmpleadoDTO>;
export type UpdateEmpleadoInput = z.infer<typeof UpdateEmpleadoDTO>;
