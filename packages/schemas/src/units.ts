export const UNIDADES_BASE = [
  'UND',
  'KG',
  'G',
  'LB',
  'OZ',
  'M',
  'CM',
  'L',
  'ML',
  'PAR',
  'SET',
  'CAJA',
] as const;

export type UnidadBase = (typeof UNIDADES_BASE)[number];

export interface Presentacion {
  nombre: string;
  factorConversion: number;
}

export const PRESENTACIONES_COMUNES: Record<string, Presentacion[]> = {
  caja: [{ nombre: 'Caja x12', factorConversion: 12 }],
  blister: [{ nombre: 'Blister x3', factorConversion: 3 }],
};

export interface ConversionPresentacion {
  cantidad: number;
  presentacion: Presentacion;
}

export function convertirAPresentacion(cantidadBase: number, factorConversion: number): number {
  if (factorConversion <= 0) return cantidadBase;
  return Math.round((cantidadBase / factorConversion) * 100) / 100;
}

export function convertirABase(cantidadPresentacion: number, factorConversion: number): number {
  if (factorConversion <= 0) return cantidadPresentacion;
  return Math.round(cantidadPresentacion * factorConversion * 100) / 100;
}

export interface VarianteProducto {
  sku: string;
  precio: number;
  stock: number;
  atributos: Record<string, string | number>;
  imagenUrl?: string;
}

export interface HistorialPrecio {
  productoId: number;
  precioAnterior: number;
  precioNuevo: number;
  usuarioId?: number;
  fecha: string;
}

export function crearHistorialPrecio(
  productoId: number,
  precioAnterior: number,
  precioNuevo: number,
  usuarioId?: number
): HistorialPrecio {
  return {
    productoId,
    precioAnterior,
    precioNuevo,
    usuarioId,
    fecha: new Date().toISOString(),
  };
}
