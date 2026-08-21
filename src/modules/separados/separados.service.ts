import { eq, sql } from 'drizzle-orm';
import type { Request } from 'express';
import { db } from '../../db';
import { abonosSeparado } from '../../db/schema/abonos_separado';
import { detalleFactura } from '../../db/schema/detalle_factura';
import { facturas } from '../../db/schema/facturas';
import { movimientosInventario } from '../../db/schema/inventario';
import { productos } from '../../db/schema/productos';
import { separados, separadosProductos } from '../../db/schema/separados';
import { recordAudit } from '../../shared/utils/audit';
import type { CreateSeparadoInput, RegistrarAbonoInput } from './separados.dto';
import { SeparadosRepository } from './separados.repository';

export class SeparadosService {
  constructor(private repo: SeparadosRepository = new SeparadosRepository()) {}

  async getAllSeparados(estado?: string, usuarioId?: number) {
    const list = await this.repo.findAll(estado, usuarioId);
    return list.map((s) => ({
      ...s,
      valor_total: parseFloat(s.valor_total),
      abono_inicial: parseFloat(s.abono_inicial),
      total_abonado: parseFloat(s.total_abonado),
      saldo_pendiente: parseFloat(s.saldo_pendiente),
    }));
  }

  async getSeparadoById(id: number) {
    const s = await this.repo.findById(id);
    if (!s) return null;
    return {
      ...s,
      valor_total: parseFloat(s.valor_total),
      abono_inicial: parseFloat(s.abono_inicial),
      total_abonado: parseFloat(s.total_abonado),
      saldo_pendiente: parseFloat(s.saldo_pendiente),
      productos: s.productos.map((p) => ({
        ...p,
        cantidad: parseFloat(p.cantidad),
        precio_unitario: parseFloat(p.precio_unitario),
        subtotal: parseFloat(p.subtotal),
        descuento_aplicado: parseFloat(p.descuento_aplicado),
      })),
      abonos: s.abonos.map((a) => ({
        ...a,
        monto: parseFloat(a.monto),
      })),
    };
  }

  async createSeparado(
    input: CreateSeparadoInput,
    userId: number,
    sesionCajaId?: number,
    req?: Request
  ) {
    // Check idempotency
    if (input.idempotency_key) {
      const existing = await this.repo.findByIdempotencyKey(input.idempotency_key);
      if (existing) {
        return await this.getSeparadoById(existing.id);
      }
    }

    const diasPlazo = input.dias_plazo || 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + diasPlazo);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const valorTotal = Math.round(input.valor_total * 100) / 100;
    const abonoInicial = Math.round(input.abono_inicial * 100) / 100;
    const saldoPendiente = Math.round((valorTotal - abonoInicial) * 100) / 100;

    let newSeparadoId: number;
    await db.transaction(async (tx) => {
      // 1. Insertar Separado
      const sepRows = await tx
        .insert(separados)
        .values({
          idempotency_key: input.idempotency_key || null,
          cliente_id: input.cliente_id,
          usuario_apertura_id: userId,
          sesion_caja_id: sesionCajaId || null,
          descripcion: input.descripcion,
          observaciones: input.observaciones || null,
          valor_total: valorTotal.toString(),
          abono_inicial: abonoInicial.toString(),
          total_abonado: abonoInicial.toString(),
          saldo_pendiente: saldoPendiente.toString(),
          dias_plazo: diasPlazo,
          fecha_limite: fechaLimiteStr,
          estado: 'activo',
        })
        .returning();

      const newSeparado = sepRows[0];
      newSeparadoId = newSeparado.id;

      // 2. Insertar productos del separado y reservar en inventario
      for (const prod of input.productos) {
        await tx.insert(separadosProductos).values({
          separado_id: newSeparado.id,
          producto_id: prod.producto_id,
          cantidad: prod.cantidad.toString(),
          precio_unitario: prod.precio_unitario.toString(),
          unidad_medida: prod.unidad_medida || 'UND',
          subtotal: prod.subtotal.toString(),
          descuento_aplicado: (prod.descuento_aplicado || 0).toString(),
        });

        // Decrementar stock / reservar
        const pRows = await tx
          .select()
          .from(productos)
          .where(eq(productos.id, prod.producto_id))
          .limit(1);
        if (pRows[0]) {
          const currentStock = parseFloat(pRows[0].stock_actual);
          const newStock = Math.max(0, currentStock - prod.cantidad);

          await tx
            .update(productos)
            .set({ stock_actual: newStock.toString() })
            .where(eq(productos.id, prod.producto_id));

          await tx.insert(movimientosInventario).values({
            producto_id: prod.producto_id,
            usuario_id: userId,
            sesion_caja_id: sesionCajaId || null,
            tipo: 'separado_reserva',
            cantidad: prod.cantidad.toString(),
            stock_anterior: currentStock.toString(),
            stock_nuevo: newStock.toString(),
            referencia_tipo: 'separado',
            referencia_id: newSeparado.id,
            notas: `Reserva por separado #${newSeparado.id}`,
          });
        }
      }

      // 3. Insertar Primer Abono (Abono Inicial)
      await tx.insert(abonosSeparado).values({
        separado_id: newSeparado.id,
        usuario_id: userId,
        sesion_caja_id: sesionCajaId || null,
        numero_abono: 1,
        monto: abonoInicial.toString(),
        forma_pago: input.forma_pago_abono || 'efectivo',
        referencia_pago: input.referencia_pago || null,
        notas: 'Abono inicial de apertura de separado',
        es_abono_final: saldoPendiente <= 0,
      });

      await recordAudit({
        usuarioId: userId,
        sesionCajaId: sesionCajaId || null,
        accion: 'SEPARADO_CREADO',
        entidad: 'separados',
        entidadId: newSeparado.id,
        datosNuevos: {
          valor_total: valorTotal,
          abono_inicial: abonoInicial,
          fecha_limite: fechaLimiteStr,
        },
        req,
      });
    });

    return await this.getSeparadoById(newSeparadoId!);
  }

  async registrarAbono(
    separadoId: number,
    input: RegistrarAbonoInput,
    userId: number,
    sesionCajaId?: number,
    req?: Request
  ) {
    // Check idempotency
    if (input.idempotency_key) {
      const existingAbono = await this.repo.findAbonoByIdempotencyKey(input.idempotency_key);
      if (existingAbono) {
        return {
          idempotent: true,
          separado: await this.getSeparadoById(separadoId),
          abono: existingAbono,
        };
      }
    }

    let _insertedAbono: any = null;
    let _esCompletado = false;
    let _facturaId: number | null = null;

    await db.transaction(async (tx) => {
      const sepRows = await tx
        .select()
        .from(separados)
        .where(eq(separados.id, separadoId))
        .limit(1);
      const sep = sepRows[0];

      if (!sep) {
        const error: any = new Error('Separado no encontrado');
        error.statusCode = 404;
        throw error;
      }

      if (sep.estado !== 'activo') {
        const error: any = new Error(`El separado no está activo (estado actual: ${sep.estado})`);
        error.statusCode = 400;
        throw error;
      }

      const montoAbono = Math.round(input.monto * 100) / 100;
      const totalAbonadoPrevio = parseFloat(sep.total_abonado);
      const valorTotal = parseFloat(sep.valor_total);
      const nuevoTotalAbonado = Math.round((totalAbonadoPrevio + montoAbono) * 100) / 100;
      const nuevoSaldo = Math.round(Math.max(0, valorTotal - nuevoTotalAbonado) * 100) / 100;
      const esCompletado = nuevoSaldo <= 0.01;
      _esCompletado = esCompletado;

      // Obtener conteo de abonos anteriores
      const prevAbonos = await tx
        .select({ count: sql<number>`COUNT(*)` })
        .from(abonosSeparado)
        .where(eq(abonosSeparado.separado_id, separadoId));
      const nextNumeroAbono = Number(prevAbonos[0]?.count || 0) + 1;

      // Insertar nuevo abono
      const insertedAbonos = await tx
        .insert(abonosSeparado)
        .values({
          idempotency_key: input.idempotency_key || null,
          separado_id: separadoId,
          usuario_id: userId,
          sesion_caja_id: sesionCajaId || null,
          numero_abono: nextNumeroAbono,
          monto: montoAbono.toString(),
          forma_pago: input.forma_pago || 'efectivo',
          referencia_pago: input.referencia_pago || null,
          notas: input.notas || null,
          es_abono_final: esCompletado,
        })
        .returning();

      _insertedAbono = insertedAbonos[0];

      // Si el separado se completa, generar factura final y registrar movimiento
      let facturaGeneradaId: number | null = null;
      if (esCompletado) {
        // Crear factura definitiva
        const fRows = await tx
          .insert(facturas)
          .values({
            cliente_id: sep.cliente_id,
            usuario_id: userId,
            sesion_caja_id: sesionCajaId || null,
            subtotal: valorTotal.toString(),
            total: valorTotal.toString(),
            forma_pago: input.forma_pago || 'efectivo',
            tipo: 'separado_final',
            estado: 'completada',
          })
          .returning();

        facturaGeneradaId = fRows[0].id;

        // Trasladar productos a detalle_factura
        const sepProds = await tx
          .select()
          .from(separadosProductos)
          .where(eq(separadosProductos.separado_id, separadoId));
        for (const sp of sepProds) {
          await tx.insert(detalleFactura).values({
            factura_id: facturaGeneradaId,
            producto_id: sp.producto_id,
            cantidad: sp.cantidad,
            precio_unitario: sp.precio_unitario,
            unidad_medida: sp.unidad_medida,
            subtotal: sp.subtotal,
            descuento_aplicado: sp.descuento_aplicado,
          });
        }
      }

      _facturaId = facturaGeneradaId;

      // Actualizar separado
      await tx
        .update(separados)
        .set({
          total_abonado: nuevoTotalAbonado.toString(),
          saldo_pendiente: nuevoSaldo.toString(),
          estado: esCompletado ? 'completado' : 'activo',
          factura_id: facturaGeneradaId || sep.factura_id,
          updated_at: new Date(),
        })
        .where(eq(separados.id, separadoId));

      await recordAudit({
        usuarioId: userId,
        sesionCajaId: sesionCajaId || null,
        accion: esCompletado ? 'SEPARADO_COMPLETADO' : 'SEPARADO_ABONO_REGISTRADO',
        entidad: 'separados',
        entidadId: separadoId,
        datosNuevos: {
          monto: montoAbono,
          saldo_restante: nuevoSaldo,
          completado: esCompletado,
        },
        req,
      });
    });

    const separadoFinal = await this.getSeparadoById(separadoId);
    return {
      message: _esCompletado
        ? '¡Separado cancelado en su totalidad y completado exitosamente!'
        : 'Abono registrado exitosamente',
      separado: separadoFinal,
      abono: _insertedAbono,
      completado: _esCompletado,
      factura_id: _facturaId,
    };
  }
}
