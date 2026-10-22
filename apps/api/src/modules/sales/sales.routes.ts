import { calcularDescuentos, type DescuentoCatalogo } from '@tumifact/discounts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit';
import { authenticate, requireActor } from '../../lib/auth';
import { tienePermiso } from '../../lib/permissions';
import { prisma } from '../../lib/prisma';
import { emitEvent } from '../../lib/socket';

const itemSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  precio: z.coerce.number().min(0),
});

const descuentoSolicitadoSchema = z.object({
  descuento_id: z.coerce.number().int().positive(),
  producto_id: z.coerce.number().int().positive().optional(),
});

const saleSchema = z.object({
  cliente_id: z.coerce.number().int().positive().optional(),
  idempotency_key: z.string().uuid().optional(),
  forma_pago: z.string().optional(),
  sesion_caja_id: z.coerce.number().int().positive().optional(),
  total: z.coerce.number().min(0).optional(),
  productos: z.array(itemSchema).min(1),
  descuentos: z.array(descuentoSolicitadoSchema).optional().default([]),
});

const TOLERANCIA_TOTAL = 0.05;

export async function salesRoutes(app: FastifyInstance) {
  app.post('/sales', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = saleSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    const input = parsed.data;
    const actor = requireActor(request);
    const key = (request.headers['idempotency-key'] as string) || input.idempotency_key;

    if (input.sesion_caja_id) {
      const session = await prisma.sesiones_caja.findUnique({
        where: { id: input.sesion_caja_id },
      });
      if (session?.estado !== 'abierta') {
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

        // --- Motor de descuentos (determinista, compartido con el web) ---
        const catalogo = await tx.descuentos.findMany();
        const descuentosCatalogo: DescuentoCatalogo[] = catalogo.map((d) => ({
          id: d.id,
          nombre: d.nombre,
          tipo: d.tipo as DescuentoCatalogo['tipo'],
          valor: Number(d.valor),
          aplica_a: d.aplica_a as DescuentoCatalogo['aplica_a'],
          requiere_aprobacion: d.requiere_aprobacion,
          activo: d.activo,
          vigencia_desde: d.vigencia_desde,
          vigencia_hasta: d.vigencia_hasta,
        }));

        const calculo = calcularDescuentos({
          lineas: items.map((i) => ({
            producto_id: i.producto_id,
            cantidad: i.cantidad,
            precio_unitario: i.precio,
          })),
          solicitudes: input.descuentos,
          descuentos: descuentosCatalogo,
          limites: {
            descuento_max_porcentaje: actor.descuento_max_porcentaje,
            descuento_max_monto: actor.descuento_max_monto,
            puede_aprobar_descuentos: tienePermiso(actor, 'descuentos:aprobar'),
          },
          hoy: new Date(),
        });

        // Un descuento rechazado no se ignora en silencio: se informa al cajero.
        if (calculo.rechazados.length > 0) {
          throw Object.assign(new Error('Uno o más descuentos no pudieron aplicarse'), {
            statusCode: 422,
            code: 'DESCUENTOS_RECHAZADOS',
            detalles: calculo.rechazados,
          });
        }

        const total = calculo.total;
        const subtotal = calculo.subtotal;

        if (input.total !== undefined && Math.abs(input.total - total) > TOLERANCIA_TOTAL) {
          throw Object.assign(
            new Error(
              `Total manipulado o discrepancia de cálculo. Esperado: ${total}, Recibido: ${input.total}`
            ),
            { statusCode: 400, code: 'TOTAL_MISMATCH' }
          );
        }

        const lineasPorProducto = new Map<number, (typeof calculo.lineas)[number]>();
        for (const linea of calculo.lineas) {
          lineasPorProducto.set(linea.producto_id, linea);
        }

        const sale = await tx.facturas.create({
          data: {
            cliente_id: input.cliente_id ?? null,
            usuario_id: actor.id,
            sesion_caja_id: input.sesion_caja_id ?? null,
            forma_pago: input.forma_pago || 'efectivo',
            total,
            subtotal,
            descuento_total: calculo.descuento_total,
            idempotency_key: key ?? null,
            detalle_factura: {
              create: items.map((item) => {
                const linea = lineasPorProducto.get(item.producto_id);
                return {
                  producto_id: item.producto_id,
                  cantidad: item.cantidad,
                  precio_unitario: item.precio,
                  subtotal: linea?.subtotal ?? item.cantidad * item.precio,
                  // Trazabilidad del descuento aplicado (R-005).
                  descuento_id: linea?.descuento_id ?? null,
                  descuento_inline_tipo: linea?.descuento_tipo ?? null,
                  descuento_inline_valor: linea?.descuento_valor ?? 0,
                  descuento_aplicado: linea?.descuento_aplicado ?? 0,
                };
              }),
            },
          },
          include: { detalle_factura: true },
        });

        for (const item of items) {
          const stockAnterior = Number(item.product.stock_actual);
          const stockNuevo = stockAnterior - item.cantidad;
          await tx.productos.update({
            where: { id: item.producto_id },
            data: { stock_actual: stockNuevo },
          });
          await tx.movimientos_inventario.create({
            data: {
              producto_id: item.producto_id,
              usuario_id: actor.id,
              sesion_caja_id: input.sesion_caja_id ?? null,
              tipo: 'salida_venta',
              cantidad: item.cantidad,
              stock_anterior: stockAnterior,
              stock_nuevo: stockNuevo,
              referencia_tipo: 'factura',
              referencia_id: sale.id,
              notas: `Venta POS en Factura #${sale.id}`,
            },
          });
        }

        return { sale, calculo };
      });

      // Auditoría de descuentos aplicados (R-008).
      if (result.calculo.aplicados.length > 0) {
        await recordAudit({
          usuarioId: actor.id,
          accion: 'DESCUENTOS_APLICADOS',
          entidad: 'facturas',
          entidadId: result.sale.id,
          datosNuevos: {
            aplicados: result.calculo.aplicados,
            descuento_total: result.calculo.descuento_total,
          },
        });
      }

      emitEvent('sale:created', { id: result.sale.id, total: result.sale.total });
      return reply.status(201).send({
        idempotent: false,
        sale: result.sale,
        descuentos: {
          aplicados: result.calculo.aplicados,
          rechazados: result.calculo.rechazados,
          descuento_total: result.calculo.descuento_total,
        },
      });
    } catch (error: any) {
      return reply.status(error.statusCode || 500).send({
        error: error.message || 'Error interno',
        code: error.code,
        detalles: error.detalles,
      });
    }
  });
}
