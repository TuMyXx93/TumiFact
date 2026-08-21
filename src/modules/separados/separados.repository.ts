import { and, desc, eq, sql } from 'drizzle-orm';
import { db } from '../../db';
import type { AbonoSeparadoItem, NewAbonoSeparado } from '../../db/schema/abonos_separado';
import { abonosSeparado } from '../../db/schema/abonos_separado';
import { clientes } from '../../db/schema/clientes';
import { productos } from '../../db/schema/productos';
import type { NewSeparado, SeparadoItem } from '../../db/schema/separados';
import { separados, separadosProductos } from '../../db/schema/separados';
import { usuarios } from '../../db/schema/usuarios';

export class SeparadosRepository {
  async findAll(estado?: string, usuarioId?: number) {
    const query = db
      .select({
        id: separados.id,
        idempotency_key: separados.idempotency_key,
        cliente_id: separados.cliente_id,
        cliente_nombre: clientes.nombre,
        cliente_apellido: clientes.apellido,
        cliente_telefono: clientes.telefono,
        cliente_identificacion: clientes.numero_identificacion,
        usuario_apertura_id: separados.usuario_apertura_id,
        cajero_nombre: usuarios.nombre,
        descripcion: separados.descripcion,
        observaciones: separados.observaciones,
        valor_total: separados.valor_total,
        abono_inicial: separados.abono_inicial,
        total_abonado: separados.total_abonado,
        saldo_pendiente: separados.saldo_pendiente,
        fecha_inicio: separados.fecha_inicio,
        fecha_limite: separados.fecha_limite,
        dias_plazo: separados.dias_plazo,
        estado: separados.estado,
        factura_id: separados.factura_id,
        created_at: separados.created_at,
      })
      .from(separados)
      .leftJoin(clientes, eq(separados.cliente_id, clientes.id))
      .leftJoin(usuarios, eq(separados.usuario_apertura_id, usuarios.id));

    if (estado && usuarioId)
      return await query
        .where(and(eq(separados.estado, estado), eq(separados.usuario_apertura_id, usuarioId)))
        .orderBy(desc(separados.created_at));
    if (estado)
      return await query.where(eq(separados.estado, estado)).orderBy(desc(separados.created_at));
    if (usuarioId)
      return await query
        .where(eq(separados.usuario_apertura_id, usuarioId))
        .orderBy(desc(separados.created_at));

    return await query.orderBy(desc(separados.created_at));
  }

  async findById(id: number) {
    const rows = await db
      .select({
        id: separados.id,
        idempotency_key: separados.idempotency_key,
        cliente_id: separados.cliente_id,
        cliente_nombre: clientes.nombre,
        cliente_apellido: clientes.apellido,
        cliente_telefono: clientes.telefono,
        cliente_identificacion: clientes.numero_identificacion,
        cliente_direccion: clientes.direccion_texto,
        usuario_apertura_id: separados.usuario_apertura_id,
        cajero_nombre: usuarios.nombre,
        descripcion: separados.descripcion,
        observaciones: separados.observaciones,
        valor_total: separados.valor_total,
        abono_inicial: separados.abono_inicial,
        total_abonado: separados.total_abonado,
        saldo_pendiente: separados.saldo_pendiente,
        fecha_inicio: separados.fecha_inicio,
        fecha_limite: separados.fecha_limite,
        dias_plazo: separados.dias_plazo,
        estado: separados.estado,
        factura_id: separados.factura_id,
        created_at: separados.created_at,
      })
      .from(separados)
      .leftJoin(clientes, eq(separados.cliente_id, clientes.id))
      .leftJoin(usuarios, eq(separados.usuario_apertura_id, usuarios.id))
      .where(eq(separados.id, id))
      .limit(1);

    if (!rows[0]) return null;

    // Productos asociados al separado
    const prods = await db
      .select({
        id: separadosProductos.id,
        producto_id: separadosProductos.producto_id,
        producto_nombre: productos.nombre,
        producto_codigo: productos.codigo,
        cantidad: separadosProductos.cantidad,
        precio_unitario: separadosProductos.precio_unitario,
        unidad_medida: separadosProductos.unidad_medida,
        subtotal: separadosProductos.subtotal,
        descuento_aplicado: separadosProductos.descuento_aplicado,
      })
      .from(separadosProductos)
      .leftJoin(productos, eq(separadosProductos.producto_id, productos.id))
      .where(eq(separadosProductos.separado_id, id));

    // Historial de abonos
    const abonos = await db
      .select({
        id: abonosSeparado.id,
        idempotency_key: abonosSeparado.idempotency_key,
        separado_id: abonosSeparado.separado_id,
        usuario_id: abonosSeparado.usuario_id,
        cajero_nombre: usuarios.nombre,
        numero_abono: abonosSeparado.numero_abono,
        monto: abonosSeparado.monto,
        forma_pago: abonosSeparado.forma_pago,
        referencia_pago: abonosSeparado.referencia_pago,
        notas: abonosSeparado.notas,
        es_abono_final: abonosSeparado.es_abono_final,
        created_at: abonosSeparado.created_at,
      })
      .from(abonosSeparado)
      .leftJoin(usuarios, eq(abonosSeparado.usuario_id, usuarios.id))
      .where(eq(abonosSeparado.separado_id, id))
      .orderBy(abonosSeparado.numero_abono);

    return {
      ...rows[0],
      productos: prods,
      abonos,
    };
  }

  async findByIdempotencyKey(key: string): Promise<SeparadoItem | null> {
    const rows = await db
      .select()
      .from(separados)
      .where(eq(separados.idempotency_key, key))
      .limit(1);
    return rows[0] || null;
  }

  async findAbonoByIdempotencyKey(key: string): Promise<AbonoSeparadoItem | null> {
    const rows = await db
      .select()
      .from(abonosSeparado)
      .where(eq(abonosSeparado.idempotency_key, key))
      .limit(1);
    return rows[0] || null;
  }
}
