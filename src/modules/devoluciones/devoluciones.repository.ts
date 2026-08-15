import { db } from '../../db';
import { devoluciones, detalleDevolucion } from '../../db/schema/devoluciones';
import type { DevolucionItem, NewDevolucion } from '../../db/schema/devoluciones';
import { facturas } from '../../db/schema/facturas';
import { usuarios } from '../../db/schema/usuarios';
import { productos } from '../../db/schema/productos';
import { eq, desc } from 'drizzle-orm';

export class DevolucionesRepository {
  async findAll() {
    return await db
      .select({
        id: devoluciones.id,
        factura_id: devoluciones.factura_id,
        usuario_solicitante_id: devoluciones.usuario_solicitante_id,
        solicitante_nombre: usuarios.nombre,
        tipo: devoluciones.tipo,
        motivo: devoluciones.motivo,
        monto_devuelto: devoluciones.monto_devuelto,
        forma_devolucion: devoluciones.forma_devolucion,
        estado: devoluciones.estado,
        created_at: devoluciones.created_at
      })
      .from(devoluciones)
      .leftJoin(usuarios, eq(devoluciones.usuario_solicitante_id, usuarios.id))
      .orderBy(desc(devoluciones.created_at));
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: devoluciones.id,
        idempotency_key: devoluciones.idempotency_key,
        factura_id: devoluciones.factura_id,
        usuario_solicitante_id: devoluciones.usuario_solicitante_id,
        solicitante_nombre: usuarios.nombre,
        tipo: devoluciones.tipo,
        motivo: devoluciones.motivo,
        descripcion_detallada: devoluciones.descripcion_detallada,
        monto_devuelto: devoluciones.monto_devuelto,
        forma_devolucion: devoluciones.forma_devolucion,
        estado: devoluciones.estado,
        created_at: devoluciones.created_at
      })
      .from(devoluciones)
      .leftJoin(usuarios, eq(devoluciones.usuario_solicitante_id, usuarios.id))
      .where(eq(devoluciones.id, id))
      .limit(1);

    if (!rows[0]) return null;

    const items = await db
      .select({
        id: detalleDevolucion.id,
        producto_id: detalleDevolucion.producto_id,
        producto_nombre: productos.nombre,
        producto_codigo: productos.codigo,
        cantidad_devuelta: detalleDevolucion.cantidad_devuelta,
        precio_unitario: detalleDevolucion.precio_unitario,
        subtotal_devuelto: detalleDevolucion.subtotal_devuelto,
        motivo_item: detalleDevolucion.motivo_item,
        condicion: detalleDevolucion.condicion,
        reingresa_inventario: detalleDevolucion.reingresa_inventario
      })
      .from(detalleDevolucion)
      .leftJoin(productos, eq(detalleDevolucion.producto_id, productos.id))
      .where(eq(detalleDevolucion.devolucion_id, id));

    return {
      ...rows[0],
      items
    };
  }

  async findByIdempotencyKey(key: string): Promise<DevolucionItem | null> {
    const rows = await db.select().from(devoluciones).where(eq(devoluciones.idempotency_key, key)).limit(1);
    return rows[0] || null;
  }
}
