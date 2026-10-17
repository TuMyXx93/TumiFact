import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const itemSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  precio: z.coerce.number().min(0),
});

const saleSchema = z.object({
  cliente_id: z.coerce.number().int().positive().optional(),
  idempotency_key: z.string().uuid().optional(),
  forma_pago: z.string().optional(),
  sesion_caja_id: z.coerce.number().int().positive().optional(),
  productos: z.array(itemSchema).min(1),
});

export async function salesRoutes(app: FastifyInstance) {
  app.post('/sales', async (request, reply) => {
    const parsed = saleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    const input = parsed.data;
    const key = (request.headers['idempotency-key'] as string) || input.idempotency_key;

    if (input.sesion_caja_id) {
      const session = await prisma.sesiones_caja.findUnique({
        where: { id: input.sesion_caja_id },
      });
      if (!session || session.estado !== 'abierta') {
        return reply
          .status(400)
          .send({ error: 'La sesión de caja indicada no existe o no está abierta.' });
      }
    }

    if (key) {
      const existing = await prisma.facturas.findUnique({ where: { idempotency_key: key } });
      if (existing) {
        return reply.send({ idempotent: true, sale: existing });
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const items = [];
        for (const item of input.productos) {
          const product = await tx.productos.findUnique({ where: { id: item.producto_id } });
          if (!product)
            throw Object.assign(new Error('Producto no encontrado'), { statusCode: 404 });
          const stock = Number(product.stock_actual);
          if (stock < item.cantidad) {
            throw Object.assign(new Error('Stock insuficiente'), {
              statusCode: 409,
              code: 'INSUFFICIENT_STOCK',
            });
          }
          items.push({ ...item, product });
        }

        const total = items.reduce((sum, item) => sum + item.cantidad * item.precio, 0);

        const sale = await tx.facturas.create({
          data: {
            cliente_id: input.cliente_id ?? null,
            sesion_caja_id: input.sesion_caja_id ?? null,
            forma_pago: input.forma_pago || 'efectivo',
            total,
            subtotal: total,
            idempotency_key: key ?? null,
            detalle_factura: {
              create: items.map((item) => ({
                producto_id: item.producto_id,
                cantidad: item.cantidad,
                precio_unitario: item.precio,
                subtotal: item.cantidad * item.precio,
              })),
            },
          },
          include: { detalle_factura: true },
        });

        for (const item of items) {
          await tx.productos.update({
            where: { id: item.producto_id },
            data: { stock_actual: Number(item.product.stock_actual) - item.cantidad },
          });
        }

        return sale;
      });

      return reply.status(201).send({ idempotent: false, sale: result });
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message || 'Error interno' });
    }
  });
}
