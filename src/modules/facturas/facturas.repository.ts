import { db } from '../../db';
import { facturas, FacturaItem, NewFactura } from '../../db/schema/facturas';
import { detalleFactura, DetalleFacturaItem } from '../../db/schema/detalle_factura';
import { clientes } from '../../db/schema/clientes';
import { productos } from '../../db/schema/productos';
import { eq, desc } from 'drizzle-orm';

export class FacturasRepository {
  async createWithDetails(
    facturaData: NewFactura,
    items: { producto_id: number; cantidad: number; precio_unitario: number; unidad_medida: string; subtotal: number }[]
  ): Promise<{ factura: FacturaItem; detalles: DetalleFacturaItem[] }> {
    return await db.transaction(async (tx) => {
      const insertedFacturas = await tx.insert(facturas).values(facturaData).returning();
      const newFactura = insertedFacturas[0];

      const detailsToInsert = items.map((item) => ({
        factura_id: newFactura.id,
        producto_id: item.producto_id,
        cantidad: item.cantidad.toString(),
        precio_unitario: item.precio_unitario.toString(),
        unidad_medida: item.unidad_medida,
        subtotal: item.subtotal.toString()
      }));

      const insertedDetails = await tx.insert(detalleFactura).values(detailsToInsert).returning();

      return { factura: newFactura, detalles: insertedDetails };
    });
  }

  async findByIdWithDetails(id: number) {
    const facturaRows = await db
      .select({
        id: facturas.id,
        cliente_id: facturas.cliente_id,
        fecha: facturas.fecha,
        total: facturas.total,
        forma_pago: facturas.forma_pago,
        cliente_nombre: clientes.nombre,
        direccion: clientes.direccion,
        telefono: clientes.telefono
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.cliente_id, clientes.id))
      .where(eq(facturas.id, id))
      .limit(1);

    if (!facturaRows[0]) return null;

    const detallesRows = await db
      .select({
        id: detalleFactura.id,
        factura_id: detalleFactura.factura_id,
        producto_id: detalleFactura.producto_id,
        cantidad: detalleFactura.cantidad,
        precio_unitario: detalleFactura.precio_unitario,
        unidad_medida: detalleFactura.unidad_medida,
        subtotal: detalleFactura.subtotal,
        producto_nombre: productos.nombre
      })
      .from(detalleFactura)
      .leftJoin(productos, eq(detalleFactura.producto_id, productos.id))
      .where(eq(detalleFactura.factura_id, id));

    return { factura: facturaRows[0], detalles: detallesRows };
  }

  async findAllSales() {
    return await db
      .select({
        id: facturas.id,
        cliente_id: facturas.cliente_id,
        fecha: facturas.fecha,
        total: facturas.total,
        forma_pago: facturas.forma_pago,
        cliente_nombre: clientes.nombre
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.cliente_id, clientes.id))
      .orderBy(desc(facturas.fecha));
  }
}
