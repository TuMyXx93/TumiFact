import { z } from 'zod';

export const ATRIBUTOS_POR_CATEGORIA: Record<string, string[]> = {
  tecnologia: ['memoria', 'almacenamiento', 'garantia_meses'],
  ropa: ['talla', 'color', 'material'],
  cocina: ['capacidad', 'material', 'voltaje'],
};

export const AtributosSchema = z.record(z.string(), z.union([z.string(), z.number()]));

export function validarAtributos(categoria: string, atributos: Record<string, unknown>) {
  const permitidos = ATRIBUTOS_POR_CATEGORIA[categoria.toLowerCase()] || [];
  const invalidos = Object.keys(atributos).filter((key) => !permitidos.includes(key));
  return {
    valid: invalidos.length === 0,
    invalidos,
  };
}
