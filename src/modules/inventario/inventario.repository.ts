import { db } from '../../db';
import { movimientosInventario } from '../../db/schema/inventario';
import type { MovimientoInventarioItem } from '../../db/schema/inventario';
import { productos } from '../../db/schema/productos';
import { usuarios } from '../../db/schema/usuarios';
import { eq, desc, lte, sql } from 'drizzle-orm';

export class InventarioRepository {
  async getMovimientos(limit = 50, productoId?: number) {
    let query = db
      .select({
        id: movimientosInventario.id,
        idempotency_key: movimientosInventario.idempotency_key,
        producto_id: movimientosInventario.producto_id,
        producto_nombre: productos.nombre,
        producto_codigo: productos.codigo,
        usuario_id: movimientosInventario.usuario_id,
        usuario_nombre: usuarios.nombre,
        usuario_apellido: usuarios.apellido,
        tipo: movimientosInventario.tipo,
        cantidad: movimientosInventario.cantidad,
        stock_anterior: movimientosInventario.stock_anterior,
        stock_nuevo: movimientosInventario.stock_nuevo,
        costo_unitario: movimientosInventario.costo_unitario,
        referencia_tipo: movimientosInventario.referencia_tipo,
        referencia_id: movimientosInventario.referencia_id,
        notas: movimientosInventario.notas,
        created_at: movimientosInventario.created_at
      })
      .from(movimientosInventario)
      .leftJoin(productos, eq(movimientosInventario.producto_id, productos.id))
      .leftJoin(usuarios, eq(movimientosInventario.usuario_id, usuarios.id));

    if (productoId) {
      return await query.where(eq(movimientosInventario.producto_id, productoId)).orderBy(desc(movimientosInventario.created_at)).limit(limit);
    }

    return await query.orderBy(desc(movimientosInventario.created_at)).limit(limit);
  }

  async getStockCritico() {
    return await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        stock_actual: productos.stock_actual,
        stock_minimo: productos.stock_minimo,
        precio_detal: productos.precio_detal
      })
      .from(productos)
      .where(sql`CAST(${productos.stock_actual} AS NUMERIC) <= CAST(${productos.stock_minimo} AS NUMERIC)`)
      .orderBy(productos.stock_actual);
  }

  async findByIdempotencyKey(key: string): Promise<MovimientoInventarioItem | null> {
    const rows = await db.select().from(movimientosInventario).where(eq(movimientosInventario.idempotency_key, key)).limit(1);
    return rows[0] || null;
  }
}
