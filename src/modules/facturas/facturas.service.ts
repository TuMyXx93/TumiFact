import { FacturasRepository } from './facturas.repository';
import type { CreateFacturaInput } from './facturas.dto';
import { db } from '../../db';
import { configuracionImpresion } from '../../db/schema/configuracion';

export class FacturasService {
  constructor(private repo: FacturasRepository = new FacturasRepository()) {}

  async createFactura(input: CreateFacturaInput) {
    let calculatedTotal = 0;
    const itemCalculations = input.productos.map((prod) => {
      const subtotal = Math.round(prod.cantidad * prod.precio * 100) / 100;
      calculatedTotal += subtotal;
      return {
        producto_id: prod.producto_id,
        cantidad: prod.cantidad,
        precio_unitario: prod.precio,
        unidad_medida: prod.unidad || 'KG',
        subtotal
      };
    });

    calculatedTotal = Math.round(calculatedTotal * 100) / 100;

    if (input.total !== undefined && Math.abs(input.total - calculatedTotal) > 0.01) {
      const error: any = new Error(`Total manipulado o incorrecto. Esperado: ${calculatedTotal}, Recibido: ${input.total}`);
      error.statusCode = 400;
      throw error;
    }

    const { factura, detalles } = await this.repo.createWithDetails(
      {
        cliente_id: input.cliente_id,
        total: calculatedTotal.toString(),
        forma_pago: input.forma_pago || 'efectivo'
      },
      itemCalculations
    );

    return {
      message: 'Factura creada exitosamente',
      id: factura.id,
      cliente_id: factura.cliente_id,
      total: parseFloat(factura.total),
      forma_pago: factura.forma_pago,
      fecha: factura.fecha,
      detalles: detalles.map((d) => ({ ...d, subtotal: parseFloat(d.subtotal) }))
    };
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
      font_size: 1
    };

    return {
      factura: data.factura,
      detalles: data.detalles.map((d) => ({ ...d, subtotal: parseFloat(d.subtotal || '0') })),
      config: configData
    };
  }

  async getFacturaDetailsOnly(id: number) {
    const data = await this.repo.findByIdWithDetails(id);
    if (!data) return null;

    return {
      factura: data.factura,
      productos: data.detalles.map((d) => ({
        ...d,
        subtotal: parseFloat(d.subtotal || '0'),
        precio_unitario: parseFloat(d.precio_unitario || '0'),
        cantidad: parseFloat(d.cantidad || '0')
      }))
    };
  }

  async getSalesHistory(desde?: string, hasta?: string) {
    return await this.repo.findAllSales(desde, hasta);
  }
}
