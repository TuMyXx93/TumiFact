import { db } from '../../db';
import { facturas } from '../../db/schema/facturas';
import type { FacturaItem, NewFactura } from '../../db/schema/facturas';
import { detalleFactura } from '../../db/schema/detalle_factura';
import type { DetalleFacturaItem, NewDetalleFactura } from '../../db/schema/detalle_factura';
import { clientes } from '../../db/schema/clientes';
import { productos } from '../../db/schema/productos';
import { usuarios } from '../../db/schema/usuarios';
import { movimientosInventario } from '../../db/schema/inventario';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';

export class FacturasRepository {
  async createWithDetails(
    facturaData: NewFactura,
    items: Array<{
      producto_id: number;
      cantidad: number;
      precio_original?: number;
      precio_unitario: number;
      descuento_id?: number | null;
      descuento_inline_tipo?: string | null;
      descuento_inline_valor?: number;
      descuento_aplicado?: number;
      unidad_medida: string;
      subtotal: number;
    }>
  ): Promise<{ factura: FacturaItem; detalles: DetalleFacturaItem[] }> {
    return await db.transaction(async (tx) => {
      // 1. Insertar Factura
      const insertedFacturas = await tx.insert(facturas).values(facturaData).returning();
      const newFactura = insertedFacturas[0];

      // 2. Insertar Detalles de Factura y Actualizar Stock en Inventario
      const detailsToInsert = [];

      for (const item of items) {
        detailsToInsert.push({
          factura_id: newFactura.id,
          producto_id: item.producto_id,
          descuento_id: item.descuento_id || null,
          descuento_inline_tipo: item.descuento_inline_tipo || null,
          descuento_inline_valor: (item.descuento_inline_valor || 0).toString(),
          descuento_aplicado: (item.descuento_aplicado || 0).toString(),
          precio_original: (item.precio_original || item.precio_unitario).toString(),
          cantidad: item.cantidad.toString(),
          precio_unitario: item.precio_unitario.toString(),
          unidad_medida: item.unidad_medida,
          subtotal: item.subtotal.toString()
        });

        // Decrementar stock en productos
        const prodRows = await tx.select().from(productos).where(eq(productos.id, item.producto_id)).limit(1);
        if (prodRows[0]) {
          const currentStock = parseFloat(prodRows[0].stock_actual);
          const newStock = Math.max(0, currentStock - item.cantidad);

          await tx.update(productos).set({ stock_actual: newStock.toString(), updated_at: new Date() }).where(eq(productos.id, item.producto_id));

          // Registrar movimiento de inventario
          await tx.insert(movimientosInventario).values({
            producto_id: item.producto_id,
            usuario_id: facturaData.usuario_id || null,
            sesion_caja_id: facturaData.sesion_caja_id || null,
            tipo: 'salida_venta',
            cantidad: item.cantidad.toString(),
            stock_anterior: currentStock.toString(),
            stock_nuevo: newStock.toString(),
            referencia_tipo: 'factura',
            referencia_id: newFactura.id,
            notas: `Venta POS en Factura #${newFactura.id}`
          });
        }
      }

      const insertedDetails = await tx.insert(detalleFactura).values(detailsToInsert).returning();

      // 3. Actualizar métricas acumuladas del cliente
      if (facturaData.cliente_id) {
        const facturaTotal = parseFloat(facturaData.total);
        await tx
          .update(clientes)
          .set({
            total_compras: sql`CAST(${clientes.total_compras} AS NUMERIC) + ${facturaTotal}`,
            numero_facturas: sql`${clientes.numero_facturas} + 1`,
            ultima_compra: new Date(),
            updated_at: new Date()
          })
          .where(eq(clientes.id, facturaData.cliente_id));
      }

      return { factura: newFactura, detalles: insertedDetails };
    });
  }

  async findByIdempotencyKey(key: string): Promise<FacturaItem | null> {
    const rows = await db.select().from(facturas).where(eq(facturas.idempotency_key, key)).limit(1);
    return rows[0] || null;
  }

  async findByIdWithDetails(id: number) {
    const facturaRows = await db
      .select({
        id: facturas.id,
        idempotency_key: facturas.idempotency_key,
        cliente_id: facturas.cliente_id,
        usuario_id: facturas.usuario_id,
        cajero_nombre: usuarios.nombre,
        cajero_apellido: usuarios.apellido,
        fecha: facturas.fecha,
        subtotal: facturas.subtotal,
        descuento_total: facturas.descuento_total,
        descuento_detalle: facturas.descuento_detalle,
        total: facturas.total,
        forma_pago: facturas.forma_pago,
        tipo: facturas.tipo,
        estado: facturas.estado,
        created_at: facturas.created_at,
        cliente_nombre: clientes.nombre,
        cliente_apellido: clientes.apellido,
        cliente_identificacion: clientes.numero_identificacion,
        direccion: clientes.direccion_texto,
        telefono: clientes.telefono
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.cliente_id, clientes.id))
      .leftJoin(usuarios, eq(facturas.usuario_id, usuarios.id))
      .where(eq(facturas.id, id))
      .limit(1);

    if (!facturaRows[0]) return null;

    const detallesRows = await db
      .select({
        id: detalleFactura.id,
        factura_id: detalleFactura.factura_id,
        producto_id: detalleFactura.producto_id,
        producto_nombre: productos.nombre,
        producto_codigo: productos.codigo,
        descuento_id: detalleFactura.descuento_id,
        descuento_inline_tipo: detalleFactura.descuento_inline_tipo,
        descuento_inline_valor: detalleFactura.descuento_inline_valor,
        descuento_aplicado: detalleFactura.descuento_aplicado,
        precio_original: detalleFactura.precio_original,
        cantidad: detalleFactura.cantidad,
        precio_unitario: detalleFactura.precio_unitario,
        unidad_medida: detalleFactura.unidad_medida,
        subtotal: detalleFactura.subtotal
      })
      .from(detalleFactura)
      .leftJoin(productos, eq(detalleFactura.producto_id, productos.id))
      .where(eq(detalleFactura.factura_id, id));

    return { factura: facturaRows[0], detalles: detallesRows };
  }

  async findAllSales(desde?: string, hasta?: string, usuarioId?: number, estado?: string) {
    const conditions = [];

    if (desde) {
      const startDate = new Date(`${desde}T00:00:00.000`);
      conditions.push(gte(facturas.fecha, startDate));
    }

    if (hasta) {
      const endDate = new Date(`${hasta}T23:59:59.999`);
      conditions.push(lte(facturas.fecha, endDate));
    }

    if (usuarioId) {
      conditions.push(eq(facturas.usuario_id, usuarioId));
    }

    if (estado) {
      conditions.push(eq(facturas.estado, estado));
    }

    let query = db
      .select({
        id: facturas.id,
        cliente_id: facturas.cliente_id,
        usuario_id: facturas.usuario_id,
        cajero_nombre: usuarios.nombre,
        fecha: facturas.fecha,
        subtotal: facturas.subtotal,
        descuento_total: facturas.descuento_total,
        total: facturas.total,
        forma_pago: facturas.forma_pago,
        tipo: facturas.tipo,
        estado: facturas.estado,
        cliente_nombre: clientes.nombre,
        cliente_apellido: clientes.apellido
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.cliente_id, clientes.id))
      .leftJoin(usuarios, eq(facturas.usuario_id, usuarios.id));

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(facturas.fecha));
    }

    return await query.orderBy(desc(facturas.fecha));
  }
}
