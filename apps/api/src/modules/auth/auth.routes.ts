import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
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
      const result = await login(parsed.data.credential, parsed.data.password);
      return reply.send(result);
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message || 'Error interno' });
    }
  });

  app.get('/auth/me', async (request, reply) => {
    return reply.send({ user: (request as any).user || null });
  });
}
