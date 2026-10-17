import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function reportsRoutes(app: FastifyInstance) {
  app.get('/reports/sales', async (request, reply) => {
    const query = request.query as any;
    const limit = Math.min(Number(query?.limit || 100), 500);

    const ventas = await prisma.facturas.findMany({
      orderBy: { fecha: 'desc' },
      take: limit,
    });

    const totalRecaudado = ventas.reduce((sum, v) => sum + Number(v.total), 0);
    const totalDescuentos = ventas.reduce((sum, v) => sum + Number(v.descuento_total || 0), 0);

    return reply.send({
      data: ventas,
      meta: {
        count: ventas.length,
        totalRecaudado: Math.round(totalRecaudado * 100) / 100,
        totalDescuentos: Math.round(totalDescuentos * 100) / 100,
      },
    });
  });

  app.get('/reports/sales/csv', async (_request, reply) => {
    const ventas = await prisma.facturas.findMany({ orderBy: { fecha: 'desc' }, take: 1000 });
    const headers = ['id', 'fecha', 'total', 'forma_pago', 'estado'];
    const rows = ventas.map((v) => [v.id, v.fecha, v.total, v.forma_pago, v.estado].join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    reply.header('Content-Type', 'text/csv');
    return reply.send(csv);
  });
}
