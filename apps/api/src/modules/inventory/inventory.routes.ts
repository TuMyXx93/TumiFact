import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authenticate, requireActor } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { emitEvent } from '../../lib/socket';

const movimientoSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  tipo: z.enum([
    'entrada_manual',
    'salida_manual',
    'ajuste_positivo',
    'ajuste_negativo',
    'perdida',
  ]),
  cantidad: z.coerce.number().positive(),
  notas: z.string().optional(),
});

export async function inventoryRoutes(app: FastifyInstance) {
  app.get('/inventory/movements', { preHandler: [authenticate] }, async (request, reply) => {
    const limit = Number((request.query as any)?.limit || 50);
    const productoId = (request.query as any)?.producto_id
      ? Number((request.query as any).producto_id)
      : undefined;

    const where = productoId ? { producto_id: productoId } : {};
    const movimientos = await prisma.movimientos_inventario.findMany({
      where,
      orderBy: { created_at: 'desc' },
      take: limit,
    });
    return reply.send({ data: movimientos });
  });

  app.get('/inventory/stock-critical', { preHandler: [authenticate] }, async (_request, reply) => {
    const productos = await prisma.productos.findMany({
      where: { activo: true },
    });
    const criticos = productos.filter((p) => Number(p.stock_actual) <= Number(p.stock_minimo));
    return reply.send({ data: criticos });
  });

  app.post('/inventory/movements', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = movimientoSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    const input = parsed.data;
    const actor = requireActor(request);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const product = await tx.productos.findUnique({ where: { id: input.producto_id } });
        if (!product) throw Object.assign(new Error('Producto no encontrado'), { statusCode: 404 });

        const stockActual = Number(product.stock_actual);
        let nuevoStock = stockActual;

        if (['salida_manual', 'ajuste_negativo', 'perdida'].includes(input.tipo)) {
          if (stockActual < input.cantidad) {
            throw Object.assign(new Error('Stock insuficiente'), {
              statusCode: 409,
              code: 'INSUFFICIENT_STOCK',
            });
          }
          nuevoStock = stockActual - input.cantidad;
        } else {
          nuevoStock = stockActual + input.cantidad;
        }

        await tx.productos.update({
          where: { id: product.id },
          data: { stock_actual: nuevoStock },
        });

        const movimiento = await tx.movimientos_inventario.create({
          data: {
            producto_id: product.id,
            usuario_id: actor.id,
            tipo: input.tipo,
            cantidad: input.cantidad,
            stock_anterior: stockActual,
            stock_nuevo: nuevoStock,
            notas: input.notas || null,
          },
        });

        return { movimiento, stockAnterior: stockActual, stockNuevo: nuevoStock };
      });

      emitEvent('stock:updated', {
        producto_id: input.producto_id,
        stock_nuevo: result.stockNuevo,
      });
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message || 'Error interno' });
    }
  });
}
