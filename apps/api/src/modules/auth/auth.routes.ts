import type { FastifyInstance } from 'fastify';
import { authenticate, getActor } from '../../lib/auth';
import { loginSchema } from './auth.schema';
import { login } from './auth.service';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/login', async (request, reply) => {
    const parsed = loginSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    try {
      const forwarded = request.headers['x-forwarded-for'] as string | undefined;
      const ip = forwarded?.split(',')[0]?.trim() || request.ip;
      const result = await login(parsed.data.credential, parsed.data.password, {
        ip,
        userAgent: request.headers['user-agent'],
      });
      return reply.send(result);
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message || 'Error interno' });
    }
  });

  app.get('/auth/me', { preHandler: [authenticate] }, async (request, reply) => {
    const actor = getActor(request);
    return reply.send({
      user: actor
        ? {
            id: actor.id,
            nombre: actor.nombre,
            apellido: actor.apellido,
            email: actor.email,
            rol_id: actor.rol_id,
            rol_nombre: actor.rol_nombre,
          }
        : null,
    });
  });
}
