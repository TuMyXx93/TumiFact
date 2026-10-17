import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit';
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

      await recordAudit({
        usuarioId: 1,
        accion: 'SEPARADO_CREADO',
        entidad: 'separados',
        entidadId: result.id,
        datosNuevos: { valor_total: input.valor_total },
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

  app.post('/separados/:id/abonos', async (request, reply) => {
    const separadoId = Number((request.params as any).id);
    const body = request.body as any;
    const monto = Number(body?.monto || 0);
    if (!Number.isFinite(monto) || monto <= 0) {
      return reply.status(400).send({ error: 'Monto de abono inválido' });
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${separadoId})`);

        const sep = await tx.separados.findUnique({ where: { id: separadoId } });
        if (!sep) throw Object.assign(new Error('Separado no encontrado'), { statusCode: 404 });
        if (sep.estado !== 'activo')
          throw Object.assign(new Error('El separado no está activo'), { statusCode: 400 });

        const saldo = Number(sep.saldo_pendiente);
        if (monto > saldo + 0.01) {
          throw Object.assign(
            new Error('El monto del abono no puede superar el saldo pendiente.'),
            { statusCode: 400 }
          );
        }

        const totalAbonado = Number(sep.total_abonado) + monto;
        const nuevoSaldo = Math.max(0, Number(sep.valor_total) - totalAbonado);
        const completado = nuevoSaldo <= 0.01;

        const abono = await tx.abonos_separado.create({
          data: {
            separado_id: separadoId,
            usuario_id: 1,
            numero_abono:
              (await tx.abonos_separado.count({ where: { separado_id: separadoId } })) + 1,
            monto,
            forma_pago: body?.forma_pago || 'efectivo',
            es_abono_final: completado,
          },
        });

        let facturaId: number | null = null;
        if (completado) {
          const sepProducts = await tx.separados_productos.findMany({
            where: { separado_id: separadoId },
          });
          const factura = await tx.facturas.create({
            data: {
              cliente_id: sep.cliente_id,
              usuario_id: 1,
              subtotal: Number(sep.valor_total),
              total: Number(sep.valor_total),
              forma_pago: body?.forma_pago || 'efectivo',
              tipo: 'separado_final',
              estado: 'completada',
              detalle_factura: {
                create: sepProducts.map((p) => ({
                  producto_id: p.producto_id,
                  cantidad: Number(p.cantidad),
                  precio_unitario: Number(p.precio_unitario),
                  subtotal: Number(p.subtotal),
                })),
              },
            },
          });
          facturaId = factura.id;
        }

        await tx.separados.update({
          where: { id: separadoId },
          data: {
            total_abonado: totalAbonado,
            saldo_pendiente: nuevoSaldo,
            estado: completado ? 'completado' : 'activo',
            factura_id: facturaId,
            updated_at: new Date(),
          },
        });

        return { abono, completado, saldo: nuevoSaldo, factura_id: facturaId };
      });

      await recordAudit({
        usuarioId: 1,
        accion: result.completado ? 'SEPARADO_COMPLETADO' : 'SEPARADO_ABONO_REGISTRADO',
        entidad: 'separados',
        entidadId: separadoId,
        datosNuevos: { monto, saldo: result.saldo },
      });
      return reply.status(201).send(result);
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message || 'Error interno' });
    }
  });
}
