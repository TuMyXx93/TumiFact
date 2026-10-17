import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../../lib/prisma';

const itemSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  precio_unitario: z.coerce.number().min(0),
  subtotal: z.coerce.number().min(0),
});

const createSchema = z.object({
  cliente_id: z.coerce.number().int().positive(),
  descripcion: z.string().min(1),
  valor_total: z.coerce.number().positive(),
  abono_inicial: z.coerce.number().min(0),
  dias_plazo: z.coerce.number().int().positive().default(30),
  productos: z.array(itemSchema).min(1),
});

export async function separadosRoutes(app: FastifyInstance) {
  app.post('/separados', async (request, reply) => {
    const parsed = createSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    const input = parsed.data;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + input.dias_plazo);

    try {
      const result = await prisma.$transaction(async (tx) => {
        const separado = await tx.separados.create({
          data: {
            cliente_id: input.cliente_id,
            usuario_apertura_id: 1,
            descripcion: input.descripcion,
            valor_total: input.valor_total,
            abono_inicial: input.abono_inicial,
            total_abonado: input.abono_inicial,
            saldo_pendiente: input.valor_total - input.abono_inicial,
            fecha_limite: fechaLimite,
            dias_plazo: input.dias_plazo,
            estado: 'activo',
          },
        });

        for (const item of input.productos) {
          await tx.separados_productos.create({
            data: {
              separado_id: separado.id,
              producto_id: item.producto_id,
              cantidad: item.cantidad,
              precio_unitario: item.precio_unitario,
              subtotal: item.subtotal,
            },
          });

          const product = await tx.productos.findUnique({ where: { id: item.producto_id } });
          if (product) {
            await tx.productos.update({
              where: { id: item.producto_id },
              data: { stock_actual: Number(product.stock_actual) - item.cantidad },
            });
          }
        }

        await tx.abonos_separado.create({
          data: {
            separado_id: separado.id,
            usuario_id: 1,
            numero_abono: 1,
            monto: input.abono_inicial,
            forma_pago: 'efectivo',
            es_abono_final: input.abono_inicial >= input.valor_total,
          },
        });

        return separado;
      });

      return reply.status(201).send({ data: result });
    } catch (error: any) {
      return reply.status(500).send({ error: error.message || 'Error interno' });
    }
  });

  app.get('/separados', async (_request, reply) => {
    const list = await prisma.separados.findMany({ orderBy: { created_at: 'desc' }, take: 50 });
    return reply.send({ data: list });
  });
}
