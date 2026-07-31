// =====================================================
// DEFINICIONES DE TIPOS ENTERPRISE DE TUMIFACT
// =====================================================

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  precio_kg: number;
  precio_unidad: number;
  precio_libra: number;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  direccion?: string | null;
  telefono?: string | null;
  nit?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DetalleFacturaInput {
  producto_id: number;
  cantidad: number;
  precio: number;
  unidad: 'KG' | 'LB' | 'UND';
  subtotal?: number;
}

export interface DetalleFactura extends DetalleFacturaInput {
  id: number;
  factura_id: number;
  producto_nombre?: string;
  created_at?: string;
}

export interface FacturaInput {
  cliente_id: number;
  total: number;
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta' | string;
  productos: DetalleFacturaInput[];
}

export interface Factura extends FacturaInput {
  id: number;
  fecha: string;
  created_at?: string;
  cliente_nombre?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
}

export interface ConfiguracionImpresion {
  id?: number;
  nombre_negocio: string;
  direccion?: string | null;
  telefono?: string | null;
  nit?: string | null;
  pie_pagina?: string | null;
  ancho_papel: 80 | 58 | number;
  font_size: number;
  logo_tipo?: string | null;
  qr_tipo?: string | null;
  created_at?: string;
  updated_at?: string;
}
