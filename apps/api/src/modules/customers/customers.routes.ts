import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit';
import { authenticate, requireActor } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

const createSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().optional(),
  tipo_identificacion_id: z.coerce.number().int().positive().optional(),
  numero_identificacion: z.string().optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional().default(true),
});

export async function customersRoutes(app: FastifyInstance) {
  app.get('/customers', { preHandler: [authenticate] }, async (_request, reply) => {
    const clientes = await prisma.clientes.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      take: 100,
    });
    return reply.send({ data: clientes });
  });

  app.get('/customers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const cliente = await prisma.clientes.findUnique({ where: { id } });
    if (!cliente) return reply.status(404).send({ error: 'Cliente no encontrado' });
    return reply.send({ data: cliente });
  });

  app.post('/customers', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    const input = parsed.data;
    const actor = requireActor(request);

    if (input.tipo_identificacion_id && input.numero_identificacion) {
      const existing = await prisma.clientes.findFirst({
        where: {
          tipo_identificacion_id: input.tipo_identificacion_id,
          numero_identificacion: input.numero_identificacion,
        },
      });
      if (existing) {
        return reply
          .status(409)
          .send({ error: 'Ya existe un cliente con el mismo tipo y número de documento.' });
      }
    }

    const cliente = await prisma.clientes.create({
      data: {
        nombre: input.nombre,
        apellido: input.apellido || null,
        tipo_identificacion_id: input.tipo_identificacion_id || null,
        numero_identificacion: input.numero_identificacion || null,
        email: input.email || null,
        telefono: input.telefono || null,
        activo: input.activo,
      },
    });

    await recordAudit({
      usuarioId: actor.id,
      accion: 'CLIENTE_CREADO',
      entidad: 'clientes',
      entidadId: cliente.id,
      datosNuevos: input,
    });
    return reply.status(201).send({ data: cliente });
  });

  app.delete('/customers/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const id = Number((request.params as any).id);
    const actor = requireActor(request);
    const updated = await prisma.clientes
      .update({
        where: { id },
        data: { activo: false },
      })
      .catch(() => null);

    if (!updated) return reply.status(404).send({ error: 'Cliente no encontrado' });
    await recordAudit({
      usuarioId: actor.id,
      accion: 'CLIENTE_ELIMINADO',
      entidad: 'clientes',
      entidadId: id,
    });
    return reply.send({ message: 'Cliente inactivado', data: updated });
  });
}
