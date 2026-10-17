import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export async function authPlugin(app: FastifyInstance) {
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const authHeader = request.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
    if (!token) {
      return reply.status(401).send({ error: 'No autorizado' });
    }
    try {
      (request as any).user = jwt.verify(token, JWT_SECRET);
    } catch {
      return reply.status(401).send({ error: 'Token inválido' });
    }
  });

  app.decorate('requireRole', (roles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      const user = (request as any).user;
      if (!user) return reply.status(401).send({ error: 'No autorizado' });
      if (user.rol_nombre !== 'admin' && !roles.includes(user.rol_nombre)) {
        return reply.status(403).send({ error: 'Acceso denegado' });
      }
    };
  });
}
