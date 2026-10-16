import type { Request } from 'express';
import { db } from '../../db';
import { configuracionImpresion } from '../../db/schema/configuracion';
import type { CreateFacturaInput } from './facturas.dto';
import { FacturasRepository, isIdempotencyConflict } from './facturas.repository';

export class FacturasService {
  constructor(private repo: FacturasRepository = new FacturasRepository()) {}

  async createFactura(
    input: CreateFacturaInput,
    userId?: number,
    sesionCajaId?: number,
    req?: Request
  ) {
    // Idempotency check
    if (input.idempotency_key) {
      const existing = await this.repo.findByIdempotencyKey(input.idempotency_key);
      if (existing) {
        const full = await this.getFacturaWithDetails(existing.id);
        if (full) {
          return {
            idempotent: true,
            message: 'Factura recuperada exitosamente (Idempotente)',
            id: full.factura.id,
            cliente_id: full.factura.cliente_id,
            subtotal: parseFloat(String(full.factura.subtotal ?? '0')),
            descuento_total: parseFloat(String(full.factura.descuento_total ?? '0')),
            total: parseFloat(String(full.factura.total ?? '0')),
            forma_pago: full.factura.forma_pago,
            fecha: full.factura.fecha,
            tipo: full.factura.tipo,
            detalles: (full.detalles || []).map((d: any) => ({
              ...d,
              subtotal: parseFloat(String(d.subtotal ?? '0')),
            })),
          };
        }
      }
    }

    let calculatedSubtotal = 0;
    let totalDescuentosItems = 0;

    const itemCalculations = input.productos.map((prod) => {
      const precioOriginal = prod.precio_original || prod.precio;
      const baseSubtotal = Math.round(prod.cantidad * precioOriginal * 100) / 100;
      let descuentoItem = prod.descuento_aplicado || 0;

      if (prod.descuento_inline_tipo === 'porcentaje' && prod.descuento_inline_valor) {
        descuentoItem =
          Math.round(((baseSubtotal * prod.descuento_inline_valor) / 100) * 100) / 100;
      } else if (prod.descuento_inline_tipo === 'monto_fijo' && prod.descuento_inline_valor) {
        descuentoItem = Math.min(baseSubtotal, prod.descuento_inline_valor);
      }

      const itemSubtotal = Math.max(0, Math.round((baseSubtotal - descuentoItem) * 100) / 100);

      calculatedSubtotal += baseSubtotal;
      totalDescuentosItems += descuentoItem;

      return {
        producto_id: prod.producto_id,
        cantidad: prod.cantidad,
        precio_original: precioOriginal,
        precio_unitario: prod.precio,
        descuento_id: prod.descuento_id || null,
        descuento_inline_tipo: prod.descuento_inline_tipo || null,
        descuento_inline_valor: prod.descuento_inline_valor || 0,
        descuento_aplicado: descuentoItem,
        unidad_medida: prod.unidad || 'KG',
        subtotal: itemSubtotal,
      };
    });

    const descuentoGlobal = input.descuento_total || 0;
    const totalDescuentos =
      Math.round(
        (totalDescuentosItems +
          (descuentoGlobal > totalDescuentosItems ? descuentoGlobal - totalDescuentosItems : 0)) *
          100
      ) / 100;
    const calculatedTotal = Math.max(
      0,
      Math.round((calculatedSubtotal - totalDescuentos) * 100) / 100
    );

    if (input.total !== undefined && Math.abs(input.total - calculatedTotal) > 0.05) {
      const error: any = new Error(
        `Total manipulado o discrepancia de cálculo. Esperado: ${calculatedTotal}, Recibido: ${input.total}`
      );
      error.statusCode = 400;
      throw error;
    }

    let created: { factura: any; detalles: any[] };

    try {
      created = await this.repo.createWithDetails(
        {
          idempotency_key: input.idempotency_key || null,
          cliente_id: input.cliente_id,
          usuario_id: userId || null,
          sesion_caja_id: sesionCajaId || null,
          subtotal: calculatedSubtotal.toString(),
          descuento_total: totalDescuentos.toString(),
          descuento_detalle: input.descuento_detalle || [],
          total: calculatedTotal.toString(),
          forma_pago: input.forma_pago || 'efectivo',
          tipo: input.tipo || 'contado',
          estado: 'completada',
        },
        itemCalculations,
        {
          usuarioId: userId || null,
          sesionCajaId: sesionCajaId || null,
          datosNuevos: {
            total: calculatedTotal,
            cliente_id: input.cliente_id,
            forma_pago: input.forma_pago,
          },
          req,
        }
      );
    } catch (error) {
      if (!input.idempotency_key || !isIdempotencyConflict(error)) {
        throw error;
      }

      // Reintento/concurrencia: hidratar la factura ya confirmada.
      let replay = await this.getFacturaWithDetailsByIdempotency(input.idempotency_key);
      if (!replay) {
        // Pequeño retry por carrera de commit/lectura.
        for (let i = 0; i < 3; i += 1) {
          await new Promise((resolve) => setTimeout(resolve, 25));
          replay = await this.getFacturaWithDetailsByIdempotency(input.idempotency_key);
          if (replay) break;
        }
      }

      if (!replay) {
        throw error;
      }

      const detalles = replay.detalles || [];
      return {
        idempotent: true,
        message: 'Factura recuperada exitosamente (Idempotente)',
        id: replay.factura.id,
        cliente_id: replay.factura.cliente_id,
        subtotal: parseFloat(String(replay.factura.subtotal ?? '0')),
        descuento_total: parseFloat(String(replay.factura.descuento_total ?? '0')),
        total: parseFloat(String(replay.factura.total ?? '0')),
        forma_pago: replay.factura.forma_pago,
        fecha: replay.factura.fecha,
        tipo: replay.factura.tipo,
        detalles: detalles.map((d: any) => ({
          ...d,
          subtotal: parseFloat(String(d.subtotal ?? '0')),
        })),
      };
    }

    const { factura, detalles } = created;

    return {
      idempotent: false,
      message: 'Factura creada exitosamente',
      id: factura.id,
      cliente_id: factura.cliente_id,
      subtotal: parseFloat(factura.subtotal),
      descuento_total: parseFloat(factura.descuento_total),
      total: parseFloat(factura.total),
      forma_pago: factura.forma_pago,
      fecha: factura.fecha,
      tipo: factura.tipo,
      detalles: detalles.map((d) => ({
        ...d,
        subtotal: parseFloat(d.subtotal),
      })),
    };
  }

  async getFacturaWithDetailsByIdempotency(key: string) {
    const existing = await this.repo.findByIdempotencyKey(key);
    if (!existing) return null;
    return this.getFacturaWithDetails(existing.id);
  }

  async getFacturaWithDetails(id: number) {
    const data = await this.repo.findByIdWithDetails(id);
    if (!data) return null;

    const configRows = await db.select().from(configuracionImpresion).limit(1);
    const configData = configRows[0] || {
      nombre_negocio: 'TumiFact',
      direccion: '',
      telefono: '',
      nit: '',
      pie_pagina: '¡Gracias por su compra!',
      ancho_papel: 80,
      font_size: 1,
    };

    return {
      factura: {
        ...data.factura,
        subtotal: parseFloat(data.factura.subtotal || '0'),
        descuento_total: parseFloat(data.factura.descuento_total || '0'),
        total: parseFloat(data.factura.total),
      },
      detalles: data.detalles.map((d) => ({
        ...d,
        cantidad: parseFloat(d.cantidad),
        precio_unitario: parseFloat(d.precio_unitario),
        precio_original: parseFloat(d.precio_original || d.precio_unitario),
        descuento_aplicado: parseFloat(d.descuento_aplicado || '0'),
        subtotal: parseFloat(String(d.subtotal ?? '0')),
      })),
      config: configData,
    };
  }

  async getFacturaDetailsOnly(id: number) {
    const data = await this.repo.findByIdWithDetails(id);
    if (!data) return null;

    return {
      factura: data.factura,
      productos: data.detalles.map((d) => ({
        ...d,
        subtotal: parseFloat(String(d.subtotal ?? '0')),
        precio_unitario: parseFloat(d.precio_unitario || '0'),
        cantidad: parseFloat(d.cantidad || '0'),
      })),
    };
  }

  async getSalesHistory(desde?: string, hasta?: string, usuarioId?: number, estado?: string) {
    return await this.repo.findAllSales(desde, hasta, usuarioId, estado);
  }
}
