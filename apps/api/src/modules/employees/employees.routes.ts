import argon2 from 'argon2';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit';
import { authenticate, getActor, requireRole, revokeUserSessions } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

const ROLES_CANONICOS = ['admin', 'gerente', 'empleado'] as const;

const createSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
  rol_nombre: z.enum(ROLES_CANONICOS).default('empleado'),
  numero_identificacion: z.string().optional(),
  telefono: z.string().optional(),
  cargo: z.string().default('Vendedor/Cajero'),
  departamento: z.string().optional(),
  turno: z.string().default('completo'),
  descuento_max_porcentaje: z.coerce.number().min(0).max(100).default(10),
  descuento_max_monto: z.coerce.number().min(0).default(50000),
});

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  email: z.string().email().optional(),
  rol_nombre: z.enum(ROLES_CANONICOS).optional(),
  cargo: z.string().optional(),
  departamento: z.string().optional(),
  turno: z.string().optional(),
  descuento_max_porcentaje: z.coerce.number().min(0).max(100).optional(),
  descuento_max_monto: z.coerce.number().min(0).optional(),
  activo: z.boolean().optional(),
});

/** Proyección explícita: `password_hash` nunca sale del servidor (R-005). */
const EMPLEADO_SELECT = {
  id: true,
  nombre: true,
  apellido: true,
  email: true,
  telefono: true,
  numero_identificacion: true,
  rol_id: true,
  activo: true,
  ultimo_login: true,
  created_at: true,
  empleados: {
    select: {
      usuario_id: true,
      cargo: true,
      departamento: true,
      turno: true,
      descuento_max_porcentaje: true,
      descuento_max_monto: true,
      fecha_ingreso: true,
    },
  },
  roles: { select: { nombre: true } },
} as const;

export async function employeesRoutes(app: FastifyInstance) {
  // Roles canónicos (R-007)
  app.get('/roles', { preHandler: [authenticate] }, async (_request, reply) => {
    const roles = await prisma.roles.findMany({ orderBy: { nombre: 'asc' } });
    return reply.send({
      data: roles.map((r) => ({ id: r.id, nombre: r.nombre, descripcion: r.descripcion })),
    });
  });

  // Directorio de empleados (R-005)
  app.get(
    '/employees',
    { preHandler: [authenticate, requireRole(['gerente', 'admin'])] },
    async (_request, reply) => {
      const list = await prisma.usuarios.findMany({
        where: { activo: true },
        select: EMPLEADO_SELECT,
        orderBy: { nombre: 'asc' },
      });
      return reply.send({ data: list });
    }
  );

  app.get(
    '/employees/:id',
    { preHandler: [authenticate, requireRole(['gerente', 'admin'])] },
    async (request, reply) => {
      const id = Number((request.params as any).id);
      const empleado = await prisma.usuarios.findUnique({
        where: { id },
        select: EMPLEADO_SELECT,
      });
      if (!empleado) return reply.status(404).send({ error: 'Empleado no encontrado' });
      return reply.send({ data: empleado });
    }
  );

  // Alta de empleado (R-001)
  app.post(
    '/employees',
    { preHandler: [authenticate, requireRole(['admin'])] },
    async (request, reply) => {
      const parsed = createSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const existente = await prisma.usuarios.findFirst({
        where: {
          OR: [
            { email: input.email },
            ...(input.numero_identificacion
              ? [{ numero_identificacion: input.numero_identificacion }]
              : []),
          ],
        },
      });
      if (existente) {
        return reply.status(409).send({ error: 'El correo o documento ya está registrado' });
      }

      const rol = await prisma.roles.findUnique({ where: { nombre: input.rol_nombre } });
      if (!rol) {
        return reply.status(400).send({ error: `Rol '${input.rol_nombre}' no existe` });
      }

      const passwordHash = await argon2.hash(input.password);

      const usuario = await prisma.usuarios.create({
        data: {
          nombre: input.nombre,
          apellido: input.apellido,
          email: input.email,
          password_hash: passwordHash,
          rol_id: rol.id,
          telefono: input.telefono || null,
          numero_identificacion: input.numero_identificacion || null,
          activo: true,
          empleados: {
            create: {
              cargo: input.cargo,
              departamento: input.departamento || null,
              turno: input.turno,
              descuento_max_porcentaje: input.descuento_max_porcentaje,
              descuento_max_monto: input.descuento_max_monto,
            },
          },
        },
        select: EMPLEADO_SELECT,
      });

      const actor = getActor(request);
      await recordAudit({
        usuarioId: actor?.id,
        accion: 'EMPLEADO_CREADO',
        entidad: 'usuarios',
        entidadId: usuario.id,
        datosNuevos: { email: input.email, rol: input.rol_nombre },
      });

      return reply.status(201).send({ message: 'Empleado creado exitosamente', empleado: usuario });
    }
  );

  // Actualización de empleado
  app.patch(
    '/employees/:id',
    { preHandler: [authenticate, requireRole(['admin'])] },
    async (request, reply) => {
      const id = Number((request.params as any).id);
      const parsed = updateSchema.safeParse(request.body);
      if (!parsed.success) {
        return reply
          .status(400)
          .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
      }
      const input = parsed.data;

      const existente = await prisma.usuarios.findUnique({ where: { id } });
      if (!existente) return reply.status(404).send({ error: 'Empleado no encontrado' });

      const data: any = {};
      if (input.nombre !== undefined) data.nombre = input.nombre;
      if (input.apellido !== undefined) data.apellido = input.apellido;
      if (input.email !== undefined) data.email = input.email;
      if (input.activo !== undefined) data.activo = input.activo;

      if (input.rol_nombre) {
        const rol = await prisma.roles.findUnique({ where: { nombre: input.rol_nombre } });
        if (!rol) return reply.status(400).send({ error: `Rol '${input.rol_nombre}' no existe` });
        data.rol_id = rol.id;
      }

      const perfil: any = {};
      if (input.cargo !== undefined) perfil.cargo = input.cargo;
      if (input.departamento !== undefined) perfil.departamento = input.departamento;
      if (input.turno !== undefined) perfil.turno = input.turno;
      if (input.descuento_max_porcentaje !== undefined)
        perfil.descuento_max_porcentaje = input.descuento_max_porcentaje;
      if (input.descuento_max_monto !== undefined)
        perfil.descuento_max_monto = input.descuento_max_monto;

      const usuario = await prisma.usuarios.update({
        where: { id },
        data: {
          ...data,
          ...(Object.keys(perfil).length > 0 ? { empleados: { update: perfil } } : {}),
        },
        select: EMPLEADO_SELECT,
      });

      // Desactivar revoca las sesiones vivas (R-006).
      let sesionesRevocadas = 0;
      if (input.activo === false) {
        sesionesRevocadas = await revokeUserSessions(id);
      }

      const actor = getActor(request);
      await recordAudit({
        usuarioId: actor?.id,
        accion: input.activo === false ? 'EMPLEADO_DESACTIVADO' : 'EMPLEADO_ACTUALIZADO',
        entidad: 'usuarios',
        entidadId: id,
        datosNuevos: { ...input, sesiones_revocadas: sesionesRevocadas },
      });

      return reply.send({ message: 'Empleado actualizado', empleado: usuario, sesionesRevocadas });
    }
  );
}
