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
