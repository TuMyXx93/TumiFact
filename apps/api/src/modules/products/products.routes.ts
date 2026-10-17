import type { FastifyInstance } from 'fastify';
import { prisma } from '../../lib/prisma';

export async function productsRoutes(app: FastifyInstance) {
  app.get('/products', async (_request, reply) => {
    const products = await prisma.productos.findMany({
      where: { activo: true },
      orderBy: { nombre: 'asc' },
      take: 50,
    });
    return reply.send({ data: products });
  });

  app.get('/products/:id', async (request, reply) => {
    const id = Number((request.params as any).id);
    const product = await prisma.productos.findUnique({ where: { id } });
    if (!product) return reply.status(404).send({ error: 'Producto no encontrado' });
    return reply.send({ data: product });
  });
}
