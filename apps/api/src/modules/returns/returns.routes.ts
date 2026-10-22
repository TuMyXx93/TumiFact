import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit';
import { authenticate, requireActor } from '../../lib/auth';
import { prisma } from '../../lib/prisma';
import { emitEvent } from '../../lib/socket';

const itemSchema = z.object({
  detalle_factura_id: z.coerce.number().int().positive().optional(),
  producto_id: z.coerce.number().int().positive(),
  cantidad_devuelta: z.coerce.number().positive(),
  motivo_item: z.string().optional(),
  condicion: z.enum(['bueno', 'dañado', 'defectuoso']).default('bueno'),
  reingresa_inventario: z.boolean().default(true),
});

const cambioSchema = z.object({
  producto_id: z.coerce.number().int().positive(),
  cantidad: z.coerce.number().positive(),
  precio_unitario: z.coerce.number().min(0),
});

const returnSchema = z.object({
  factura_id: z.coerce.number().int().positive(),
  tipo: z.enum(['devolucion', 'cambio']),
  motivo: z.string().min(1),
  descripcion_detallada: z.string().optional(),
  forma_devolucion: z.enum(['efectivo', 'tarjeta', 'transferencia', 'mixto']).default('efectivo'),
  sesion_caja_id: z.coerce.number().int().positive().optional(),
  idempotency_key: z.string().uuid().optional(),
  items: z.array(itemSchema).min(1),
  cambios: z.array(cambioSchema).optional().default([]),
});

const round2 = (value: number) => Math.round(value * 100) / 100;

export async function returnsRoutes(app: FastifyInstance) {
  app.post('/returns', { preHandler: [authenticate] }, async (request, reply) => {
    const parsed = returnSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply
        .status(400)
        .send({ error: 'Validación DTO fallida', details: parsed.error.flatten() });
    }

    const input = parsed.data;
    const actor = requireActor(request);
    const key = (request.headers['idempotency-key'] as string) || input.idempotency_key;

    if (key) {
      const existing = await prisma.devoluciones.findUnique({ where: { idempotency_key: key } });
      if (existing) {
        return reply.send({ idempotent: true, devolucion: existing });
      }
    }

    try {
      const result = await prisma.$transaction(async (tx) => {
        const factura = await tx.facturas.findUnique({ where: { id: input.factura_id } });
        if (!factura) throw Object.assign(new Error('Factura no encontrada'), { statusCode: 404 });

        // Serializa por producto para evitar stock corrupto ante concurrencia.
        const productIds = [
          ...new Set([
            ...input.items.map((i) => i.producto_id),
            ...input.cambios.map((c) => c.producto_id),
          ]),
        ];
        for (const productId of productIds.sort((a, b) => a - b)) {
          await tx.$executeRawUnsafe(`SELECT pg_advisory_xact_lock(${productId})`);
        }

        // --- Validar líneas originales y calcular valor devuelto ---
        let totalDevuelto = 0;
        const lineas = [];
        for (const item of input.items) {
          const detalle = item.detalle_factura_id
            ? await tx.detalle_factura.findUnique({ where: { id: item.detalle_factura_id } })
            : await tx.detalle_factura.findFirst({
                where: { factura_id: input.factura_id, producto_id: item.producto_id },
              });

          if (!detalle || detalle.factura_id !== input.factura_id) {
            throw Object.assign(
              new Error('La línea de la factura no existe o no pertenece a la factura'),
              { statusCode: 400 }
            );
          }

          const yaDevuelto = await tx.detalle_devolucion.aggregate({
            where: { detalle_factura_id: detalle.id },
            _sum: { cantidad_devuelta: true },
          });
          const disponible =
            Number(detalle.cantidad) - Number(yaDevuelto._sum.cantidad_devuelta || 0);

          if (item.cantidad_devuelta > disponible) {
            throw Object.assign(
              new Error(
                `Cantidad devuelta excede lo disponible (${disponible}) para el producto ${item.producto_id}`
              ),
              { statusCode: 400, code: 'INVALID_RETURN_QUANTITY' }
            );
          }

          const precioUnitario = Number(detalle.precio_unitario);
          const subtotal = round2(item.cantidad_devuelta * precioUnitario);
          totalDevuelto = round2(totalDevuelto + subtotal);

          lineas.push({
            ...item,
            detalle_factura_id: detalle.id,
            precio_unitario: precioUnitario,
            subtotal_devuelto: subtotal,
          });
        }

        // --- Validar stock del producto nuevo antes de tocar nada ---
        let totalCambio = 0;
        for (const cambio of input.cambios) {
          const producto = await tx.productos.findUnique({ where: { id: cambio.producto_id } });
          if (!producto)
            throw Object.assign(new Error('Producto de cambio no encontrado'), { statusCode: 404 });
          if (Number(producto.stock_actual) < cambio.cantidad) {
            throw Object.assign(new Error('Stock insuficiente para el producto del cambio'), {
              statusCode: 409,
              code: 'INSUFFICIENT_STOCK',
            });
          }
          totalCambio = round2(totalCambio + round2(cambio.cantidad * cambio.precio_unitario));
        }

        const diferencia = round2(totalCambio - totalDevuelto);

        // --- Crear devolución ---
        const devolucion = await tx.devoluciones.create({
          data: {
            idempotency_key: key ?? null,
            factura_id: input.factura_id,
            usuario_solicitante_id: actor.id,
            sesion_caja_id: input.sesion_caja_id ?? null,
            tipo: input.tipo,
            motivo: input.motivo,
            descripcion_detallada: input.descripcion_detallada || null,
            monto_devuelto: totalDevuelto,
            forma_devolucion: input.forma_devolucion,
            estado: 'aprobada',
            fecha_aprobacion: new Date(),
          },
        });

        // --- Detalle + reingreso de inventario ---
        for (const linea of lineas) {
          await tx.detalle_devolucion.create({
            data: {
              devolucion_id: devolucion.id,
              detalle_factura_id: linea.detalle_factura_id,
              producto_id: linea.producto_id,
              cantidad_devuelta: linea.cantidad_devuelta,
              precio_unitario: linea.precio_unitario,
              subtotal_devuelto: linea.subtotal_devuelto,
              motivo_item: linea.motivo_item || null,
              condicion: linea.condicion,
              reingresa_inventario: linea.reingresa_inventario,
            },
          });

          if (linea.reingresa_inventario && linea.condicion === 'bueno') {
            const producto = await tx.productos.findUnique({ where: { id: linea.producto_id } });
            if (producto) {
              const stockAnterior = Number(producto.stock_actual);
              const stockNuevo = round2(stockAnterior + linea.cantidad_devuelta);
              await tx.productos.update({
                where: { id: linea.producto_id },
                data: { stock_actual: stockNuevo },
              });
              await tx.movimientos_inventario.create({
                data: {
                  producto_id: linea.producto_id,
                  usuario_id: actor.id,
                  sesion_caja_id: input.sesion_caja_id ?? null,
                  tipo: 'devolucion_entrada',
                  cantidad: linea.cantidad_devuelta,
                  stock_anterior: stockAnterior,
                  stock_nuevo: stockNuevo,
                  referencia_tipo: 'devolucion',
                  referencia_id: devolucion.id,
                  notas: `Reingreso por devolución #${devolucion.id}`,
                },
              });
            }
          }
        }

        // --- Factura / nota de cambio vinculada ---
        let facturaCambioId: number | null = null;
        if (input.cambios.length > 0) {
          const facturaCambio = await tx.facturas.create({
            data: {
              cliente_id: factura.cliente_id,
              usuario_id: actor.id,
              sesion_caja_id: input.sesion_caja_id ?? null,
              subtotal: totalCambio,
              total: totalCambio,
              forma_pago: input.forma_devolucion,
              tipo: 'cambio',
              estado: 'completada',
              detalle_factura: {
                create: input.cambios.map((cambio) => ({
                  producto_id: cambio.producto_id,
                  cantidad: cambio.cantidad,
                  precio_unitario: cambio.precio_unitario,
                  subtotal: round2(cambio.cantidad * cambio.precio_unitario),
                })),
              },
            },
          });
          facturaCambioId = facturaCambio.id;

          for (const cambio of input.cambios) {
            const producto = await tx.productos.findUnique({ where: { id: cambio.producto_id } });
            if (!producto) continue;
            const stockAnterior = Number(producto.stock_actual);
            const stockNuevo = round2(stockAnterior - cambio.cantidad);
            await tx.productos.update({
              where: { id: cambio.producto_id },
              data: { stock_actual: stockNuevo },
            });
            await tx.movimientos_inventario.create({
              data: {
                producto_id: cambio.producto_id,
                usuario_id: actor.id,
                sesion_caja_id: input.sesion_caja_id ?? null,
                tipo: 'salida_venta',
                cantidad: cambio.cantidad,
                stock_anterior: stockAnterior,
                stock_nuevo: stockNuevo,
                referencia_tipo: 'factura',
                referencia_id: facturaCambio.id,
                notas: `Cambio por devolución #${devolucion.id}`,
              },
            });
          }
        }

        // --- Estado de la factura original (sin alterar líneas ni totales) ---
        const totalDevueltoAcumulado = await tx.detalle_devolucion.aggregate({
          where: { devoluciones: { factura_id: input.factura_id } },
          _sum: { cantidad_devuelta: true },
        });
        const cantidadFactura = await tx.detalle_factura.aggregate({
          where: { factura_id: input.factura_id },
          _sum: { cantidad: true },
        });
        const esTotal =
          Number(totalDevueltoAcumulado._sum?.cantidad_devuelta || 0) >=
          Number(cantidadFactura._sum?.cantidad || 0);
        await tx.facturas.update({
          where: { id: input.factura_id },
          data: { estado: esTotal ? 'devuelta' : 'parcialmente_devuelta' },
        });

        return {
          devolucion,
          diferencia,
          factura_id: facturaCambioId,
          total_devuelto: totalDevuelto,
          total_cambio: totalCambio,
        };
      });

      await recordAudit({
        usuarioId: actor.id,
        accion: result.devolucion.tipo === 'cambio' ? 'CAMBIO_CREADO' : 'DEVOLUCION_CREADA',
        entidad: 'devoluciones',
        entidadId: result.devolucion.id,
        datosNuevos: {
          factura_id: input.factura_id,
          monto: result.total_devuelto,
          diferencia: result.diferencia,
          tipo: input.tipo,
        },
      });

      emitEvent('return:created', {
        id: result.devolucion.id,
        tipo: input.tipo,
        diferencia: result.diferencia,
      });

      return reply.status(201).send({ idempotent: false, ...result });
    } catch (error: any) {
      return reply
        .status(error.statusCode || 500)
        .send({ error: error.message || 'Error interno', code: error.code });
    }
  });

  app.get('/returns', { preHandler: [authenticate] }, async (_request, reply) => {
    const list = await prisma.devoluciones.findMany({
      orderBy: { created_at: 'desc' },
      take: 100,
      include: { detalle_devolucion: true },
    });
    return reply.send({ data: list });
  });
}
