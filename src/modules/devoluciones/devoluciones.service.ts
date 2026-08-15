import { DevolucionesRepository } from './devoluciones.repository';
import type { CreateDevolucionInput } from './devoluciones.dto';
import { db } from '../../db';
import { devoluciones, detalleDevolucion } from '../../db/schema/devoluciones';
import { facturas } from '../../db/schema/facturas';
import { productos } from '../../db/schema/productos';
import { movimientosInventario } from '../../db/schema/inventario';
import { eq } from 'drizzle-orm';
import { recordAudit } from '../../shared/utils/audit';
import type { Request } from 'express';

export class DevolucionesService {
  constructor(private repo: DevolucionesRepository = new DevolucionesRepository()) {}

  async getAll() {
    const list = await this.repo.findAll();
    return list.map((d) => ({
      ...d,
      monto_devuelto: parseFloat(d.monto_devuelto)
    }));
  }

  async getById(id: number) {
    const d = await this.repo.findById(id);
    if (!d) return null;
    return {
      ...d,
      monto_devuelto: parseFloat(d.monto_devuelto),
      items: d.items.map((i) => ({
        ...i,
        cantidad_devuelta: parseFloat(i.cantidad_devuelta),
        precio_unitario: parseFloat(i.precio_unitario),
        subtotal_devuelto: parseFloat(i.subtotal_devuelto)
      }))
    };
  }

  async create(input: CreateDevolucionInput, userId: number, sesionCajaId?: number, req?: Request) {
    // Idempotency
    if (input.idempotency_key) {
      const existing = await this.repo.findByIdempotencyKey(input.idempotency_key);
      if (existing) {
        return await this.getById(existing.id);
      }
    }

    return await db.transaction(async (tx) => {
      // 1. Validar existencia de factura
      const fRows = await tx.select().from(facturas).where(eq(facturas.id, input.factura_id)).limit(1);
      const factura = fRows[0];
      if (!factura) {
        const error: any = new Error('Factura de referencia no encontrada');
        error.statusCode = 404;
        throw error;
      }

      let totalMontoDevuelto = 0;
      for (const it of input.items) {
        const sub = Math.round(it.cantidad_devuelta * it.precio_unitario * 100) / 100;
        totalMontoDevuelto += sub;
      }
      totalMontoDevuelto = Math.round(totalMontoDevuelto * 100) / 100;

      // 2. Insertar Devolución
      const devRows = await tx
        .insert(devoluciones)
        .values({
          idempotency_key: input.idempotency_key || null,
          factura_id: input.factura_id,
          usuario_solicitante_id: userId,
          sesion_caja_id: sesionCajaId || null,
          tipo: input.tipo,
          motivo: input.motivo,
          descripcion_detallada: input.descripcion_detallada || null,
          monto_devuelto: totalMontoDevuelto.toString(),
          forma_devolucion: input.forma_devolucion || 'efectivo',
          estado: 'aprobada',
          fecha_aprobacion: new Date()
        })
        .returning();

      const newDev = devRows[0];

      // 3. Insertar items y reingresar stock si aplica
      for (const item of input.items) {
        const subtotalItem = Math.round(item.cantidad_devuelta * item.precio_unitario * 100) / 100;

        await tx.insert(detalleDevolucion).values({
          devolucion_id: newDev.id,
          detalle_factura_id: item.detalle_factura_id || null,
          producto_id: item.producto_id,
          cantidad_devuelta: item.cantidad_devuelta.toString(),
          precio_unitario: item.precio_unitario.toString(),
          subtotal_devuelto: subtotalItem.toString(),
          motivo_item: item.motivo_item || null,
          condicion: item.condicion || 'bueno',
          reingresa_inventario: item.reingresa_inventario !== undefined ? item.reingresa_inventario : true
        });

        // Reingreso de inventario
        if (item.reingresa_inventario !== false && item.condicion === 'bueno') {
          const pRows = await tx.select().from(productos).where(eq(productos.id, item.producto_id)).limit(1);
          if (pRows[0]) {
            const stockActual = parseFloat(pRows[0].stock_actual);
            const newStock = stockActual + item.cantidad_devuelta;

            await tx.update(productos).set({ stock_actual: newStock.toString() }).where(eq(productos.id, item.producto_id));

            await tx.insert(movimientosInventario).values({
              producto_id: item.producto_id,
              usuario_id: userId,
              sesion_caja_id: sesionCajaId || null,
              tipo: 'devolucion_entrada',
              cantidad: item.cantidad_devuelta.toString(),
              stock_anterior: stockActual.toString(),
              stock_nuevo: newStock.toString(),
              referencia_tipo: 'devolucion',
              referencia_id: newDev.id,
              notas: `Reingreso por devolución #${newDev.id}`
            });
          }
        }
      }

      // 4. Actualizar estado de factura
      const nuevoEstadoFactura = input.tipo === 'devolucion_total' ? 'devuelta' : 'parcialmente_devuelta';
      await tx.update(facturas).set({ estado: nuevoEstadoFactura }).where(eq(facturas.id, input.factura_id));

      await recordAudit({
        usuarioId: userId,
        sesionCajaId: sesionCajaId || null,
        accion: 'DEVOLUCION_CREADA',
        entidad: 'devoluciones',
        entidadId: newDev.id,
        datosNuevos: { factura_id: input.factura_id, monto: totalMontoDevuelto, tipo: input.tipo },
        req
      });

      return await this.getById(newDev.id);
    });
  }
}
