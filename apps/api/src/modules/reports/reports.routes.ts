import type { FastifyInstance } from 'fastify';
import { getBearerToken, hasRole, verifyToken } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

function authorize(request: any, reply: any, roles: string[]) {
  const token = getBearerToken(request);
  if (!token) {
    reply.status(401).send({ error: 'No autorizado' });
    return null;
  }
  let user: any;
  try {
    user = verifyToken(token);
  } catch {
    reply.status(401).send({ error: 'Token inválido' });
    return null;
  }
  if (!hasRole(user, roles)) {
    reply.status(403).send({ error: 'Acceso denegado' });
    return null;
  }
  return user;
}

export async function reportsRoutes(app: FastifyInstance) {
  app.get('/reports/sales', async (request, reply) => {
    const user = authorize(request, reply, ['gerente', 'admin']);
    if (!user) return;

    const query = request.query as any;
    const limit = Math.min(Number(query?.limit || 100), 500);

    const ventas = await prisma.facturas.findMany({
      orderBy: { fecha: 'desc' },
      take: limit,
    });

    const aggregate = await prisma.facturas.aggregate({
      _sum: { total: true, descuento_total: true },
      _count: { id: true },
    });

    return reply.send({
      data: ventas,
      meta: {
        count: aggregate._count.id,
        totalRecaudado: Math.round(Number(aggregate._sum.total || 0) * 100) / 100,
        totalDescuentos: Math.round(Number(aggregate._sum.descuento_total || 0) * 100) / 100,
      },
    });
  });

  app.get('/reports/sales/csv', async (request, reply) => {
    const user = authorize(request, reply, ['gerente', 'admin']);
    if (!user) return;

    const ventas = await prisma.facturas.findMany({ orderBy: { fecha: 'desc' }, take: 1000 });
    const headers = ['id', 'fecha', 'total', 'forma_pago', 'estado'];
    const rows = ventas.map((v) => [v.id, v.fecha, v.total, v.forma_pago, v.estado].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    reply.header('Content-Type', 'text/csv');
    return reply.send(csv);
  });
}
