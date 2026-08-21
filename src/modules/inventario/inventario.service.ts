import { eq } from 'drizzle-orm';
import type { Request } from 'express';
import { db } from '../../db';
import { movimientosInventario } from '../../db/schema/inventario';
import { productos } from '../../db/schema/productos';
import { recordAudit } from '../../shared/utils/audit';
import type { AjusteStockRapidoInput, MovimientoInventarioInput } from './inventario.dto';
import { InventarioRepository } from './inventario.repository';

export class InventarioService {
  constructor(private repo: InventarioRepository = new InventarioRepository()) {}

  async getMovimientos(limit = 50, productoId?: number) {
    return await this.repo.getMovimientos(limit, productoId);
  }

  async getStockCritico() {
    return await this.repo.getStockCritico();
  }

  async registrarMovimiento(input: MovimientoInventarioInput, userId?: number, req?: Request) {
    // Idempotency check
    if (input.idempotency_key) {
      const existing = await this.repo.findByIdempotencyKey(input.idempotency_key);
      if (existing) {
        return {
          idempotent: true,
          movimiento: existing,
        };
      }
    }

    return await db.transaction(async (tx) => {
      const prodRows = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, input.producto_id))
        .limit(1);
      const prod = prodRows[0];
      if (!prod) {
        const error: any = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      const stockActual = parseFloat(prod.stock_actual);
      let cantidadDelta = input.cantidad;
      let nuevoStock = stockActual;

      if (['salida_manual', 'ajuste_negativo', 'perdida'].includes(input.tipo)) {
        nuevoStock = Math.max(0, stockActual - cantidadDelta);
        cantidadDelta = -cantidadDelta;
      } else {
        nuevoStock = stockActual + cantidadDelta;
      }

      // Actualizar stock en productos
      await tx
        .update(productos)
        .set({
          stock_actual: nuevoStock.toString(),
          updated_at: new Date(),
        })
        .where(eq(productos.id, prod.id));

      // Insertar movimiento
      const movRows = await tx
        .insert(movimientosInventario)
        .values({
          idempotency_key: input.idempotency_key || null,
          producto_id: prod.id,
          usuario_id: userId || null,
          tipo: input.tipo,
          cantidad: input.cantidad.toString(),
          stock_anterior: stockActual.toString(),
          stock_nuevo: nuevoStock.toString(),
          costo_unitario: input.costo_unitario?.toString() || null,
          referencia_tipo: 'manual',
          notas: input.notas || null,
        })
        .returning();

      await recordAudit({
        usuarioId: userId,
        accion: 'INVENTARIO_MOVIMIENTO',
        entidad: 'productos',
        entidadId: prod.id,
        datosPrevios: { stock: stockActual },
        datosNuevos: {
          stock: nuevoStock,
          delta: cantidadDelta,
          tipo: input.tipo,
        },
        req,
      });

      return {
        message: 'Movimiento de inventario registrado exitosamente',
        movimiento: movRows[0],
        producto: {
          id: prod.id,
          nombre: prod.nombre,
          stock_anterior: stockActual,
          stock_nuevo: nuevoStock,
        },
      };
    });
  }

  async ajusteStockRapido(input: AjusteStockRapidoInput, userId?: number, req?: Request) {
    return await db.transaction(async (tx) => {
      const prodRows = await tx
        .select()
        .from(productos)
        .where(eq(productos.id, input.producto_id))
        .limit(1);
      const prod = prodRows[0];
      if (!prod) {
        const error: any = new Error('Producto no encontrado');
        error.statusCode = 404;
        throw error;
      }

      const stockActual = parseFloat(prod.stock_actual);
      const nuevoStock = input.nuevo_stock;
      const diferencia = nuevoStock - stockActual;
      const tipo = diferencia >= 0 ? 'ajuste_positivo' : 'ajuste_negativo';

      await tx
        .update(productos)
        .set({
          stock_actual: nuevoStock.toString(),
          updated_at: new Date(),
        })
        .where(eq(productos.id, prod.id));

      const movRows = await tx
        .insert(movimientosInventario)
        .values({
          producto_id: prod.id,
          usuario_id: userId || null,
          tipo,
          cantidad: Math.abs(diferencia).toString(),
          stock_anterior: stockActual.toString(),
          stock_nuevo: nuevoStock.toString(),
          referencia_tipo: 'ajuste_rapido',
          notas: input.motivo,
        })
        .returning();

      await recordAudit({
        usuarioId: userId,
        accion: 'INVENTARIO_AJUSTE_RAPIDO',
        entidad: 'productos',
        entidadId: prod.id,
        datosPrevios: { stock: stockActual },
        datosNuevos: { stock: nuevoStock, motivo: input.motivo },
        req,
      });

      return {
        message: 'Ajuste de inventario realizado exitosamente',
        producto: {
          id: prod.id,
          nombre: prod.nombre,
          stock_anterior: stockActual,
          stock_nuevo: nuevoStock,
        },
        movimiento: movRows[0],
      };
    });
  }
}
