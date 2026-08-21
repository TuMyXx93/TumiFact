import { z } from 'zod';

export const LoginDTO = z.object({
  credential: z.string().min(1, 'El correo o número de identificación es requerido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

export const RegisterUserDTO = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  apellido: z.string().min(1, 'El apellido es requerido'),
  tipo_identificacion_id: z.coerce.number().int().optional(),
  numero_identificacion: z.string().optional(),
  email: z.string().email('Correo electrónico inválido'),
  telefono: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rol_id: z.coerce.number().int().min(1, 'El rol es requerido'),
  cargo: z.string().optional(),
  departamento: z.string().optional(),
  salario: z.coerce.number().optional().default(0),
  descuento_max_porcentaje: z.coerce.number().min(0).max(100).optional().default(10),
  descuento_max_monto: z.coerce.number().min(0).optional().default(50000)
});

export type LoginInput = z.infer<typeof LoginDTO>;
export type RegisterUserInput = z.infer<typeof RegisterUserDTO>;
