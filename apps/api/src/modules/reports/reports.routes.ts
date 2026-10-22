import type { FastifyInstance } from 'fastify';
import { authenticate, requireRole } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

export async function reportsRoutes(app: FastifyInstance) {
  app.get(
    '/reports/sales',
    { preHandler: [authenticate, requireRole(['gerente', 'admin'])] },
    async (request, reply) => {
      const query = request.query as any;
      const limit = Math.min(Number(query?.limit || 100), 500);
      const offset = Math.max(Number(query?.offset || 0), 0);

      const ventas = await prisma.facturas.findMany({
        orderBy: { fecha: 'desc' },
        take: limit,
        skip: offset,
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
    }
  );

  app.get(
    '/reports/sales/csv',
    { preHandler: [authenticate, requireRole(['gerente', 'admin'])] },
    async (_request, reply) => {
      try {
        const ventas = await prisma.facturas.findMany({ orderBy: { fecha: 'desc' }, take: 1000 });
        const headers = ['id', 'fecha', 'total', 'forma_pago', 'estado'];
        const rows = ventas.map((v) => [v.id, v.fecha, v.total, v.forma_pago, v.estado].join(','));
        const csv = [headers.join(','), ...rows].join('\n');
        reply.header('Content-Type', 'text/csv');
        return reply.send(csv);
      } catch (error: any) {
        return reply.status(500).send({ error: error.message || 'Error al exportar CSV' });
      }
    }
  );
}
