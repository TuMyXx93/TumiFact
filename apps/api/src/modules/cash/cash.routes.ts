import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';
import { emitEvent } from '../../lib/socket';

const abrirSchema = z.object({
  monto_apertura: z.coerce.number().min(0),
  notas: z.string().optional(),
});

const cerrarSchema = z.object({
  monto_cierre_declarado: z.coerce.number().min(0),
  notas: z.string().optional(),
});

export async function cashRoutes(app: FastifyInstance) {
  app.post('/cash/open', async (request, reply) => {
    const parsed = abrirSchema.safeParse(request.body);
    if (!parsed.success)
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });

    const userId = (request as any).user?.id || 1;
    const active = await prisma.sesiones_caja.findFirst({
      where: { usuario_id: userId, estado: 'abierta' },
    });
    if (active) {
      return reply.status(400).send({ error: 'Ya tiene una sesión de caja abierta actualmente.' });
    }

    const session = await prisma.sesiones_caja.create({
      data: {
        usuario_id: userId,
        estado: 'abierta',
        monto_apertura: parsed.data.monto_apertura,
        notas: parsed.data.notas || null,
      },
    });

    emitEvent('cash:opened', { id: session.id, usuario_id: session.usuario_id });
    return reply.status(201).send({ message: 'Caja abierta', sesion: session });
  });

  app.get('/cash/state', async (request, reply) => {
    const userId = (request as any).user?.id || 1;
    const session = await prisma.sesiones_caja.findFirst({
      where: { usuario_id: userId, estado: 'abierta' },
      orderBy: { abierta_at: 'desc' },
    });
    return reply.send({ abierta: !!session, sesion: session });
  });

  app.post('/cash/close', async (request, reply) => {
    const parsed = cerrarSchema.safeParse(request.body);
    if (!parsed.success)
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });

    const userId = (request as any).user?.id || 1;
    const active = await prisma.sesiones_caja.findFirst({
      where: { usuario_id: userId, estado: 'abierta' },
      orderBy: { abierta_at: 'desc' },
    });
    if (!active) {
      return reply.status(400).send({ error: 'No tiene una sesión de caja abierta para cerrar.' });
    }

    const updated = await prisma.sesiones_caja
      .update({
        where: { id: active.id, estado: 'abierta' },
        data: {
          estado: 'cerrada',
          monto_cierre_declarado: parsed.data.monto_cierre_declarado,
          monto_cierre_calculado: parsed.data.monto_cierre_declarado,
          diferencia_caja: 0,
          cerrada_at: new Date(),
          notas: parsed.data.notas || active.notas,
        },
      })
      .catch(() => null);

    if (!updated) {
      return reply.status(400).send({ error: 'La sesión ya fue cerrada.' });
    }

    emitEvent('cash:closed', { id: updated.id, usuario_id: updated.usuario_id });
    return reply.send({ message: 'Caja cerrada exitosamente', reporte: updated });
  });

  app.get('/cash/active', async (_request, reply) => {
    const sessions = await prisma.sesiones_caja.findMany({
      where: { estado: 'abierta' },
      include: { usuarios: true },
      orderBy: { abierta_at: 'desc' },
    });
    return reply.send(sessions);
  });
}
