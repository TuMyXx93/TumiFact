/**
 * Motor de descuentos determinista.
 *
 * Función pura: sin acceso a base de datos, sin `Date.now()` implícito.
 * La vigencia se recibe como parámetro (`hoy`) para que el cálculo sea
 * reproducible y testeable. Web y API comparten este mismo motor para que
 * el total que ve el cajero sea exactamente el que cobra el backend.
 */

export type TipoDescuento = 'porcentaje' | 'monto_fijo';
export type AplicaA = 'linea' | 'total';

export type MotivoRechazo =
  | 'DESCUENTO_INEXISTENTE'
  | 'DESCUENTO_INACTIVO'
  | 'FUERA_DE_VIGENCIA'
  | 'NO_APLICA_A_PRODUCTO'
  | 'EXCEDE_LIMITE_EMPLEADO'
  | 'REQUIERE_APROBACION';

export interface DescuentoCatalogo {
  id: number;
  nombre: string;
  tipo: TipoDescuento;
  valor: number;
  aplica_a: AplicaA;
  requiere_aprobacion: boolean;
  activo: boolean;
  vigencia_desde: Date | null;
  vigencia_hasta: Date | null;
}

export interface LineaVenta {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
}

export interface SolicitudDescuento {
  descuento_id: number;
  /** Requerido cuando el descuento aplica a línea. */
  producto_id?: number | null;
}

export interface LimitesEmpleado {
  /** Porcentaje máximo que el empleado puede aplicar sin aprobación. */
  descuento_max_porcentaje: number;
  /** Monto máximo que el empleado puede aplicar sin aprobación. */
  descuento_max_monto: number;
  /** Si el actor tiene el permiso `descuentos:aprobar`. */
  puede_aprobar_descuentos: boolean;
}

export interface LineaCalculada {
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal_bruto: number;
  descuento_id: number | null;
  descuento_tipo: TipoDescuento | null;
  descuento_valor: number | null;
  descuento_aplicado: number;
  subtotal: number;
}

export interface DescuentoAplicado {
  descuento_id: number;
  nombre: string;
  tipo: TipoDescuento;
  valor: number;
  monto: number;
  producto_id: number | null;
  requiere_aprobacion: boolean;
}

export interface DescuentoRechazado {
  descuento_id: number;
  producto_id: number | null;
  motivo: MotivoRechazo;
  detalle?: string;
}

export interface ResultadoCalculo {
  lineas: LineaCalculada[];
  aplicados: DescuentoAplicado[];
  rechazados: DescuentoRechazado[];
  subtotal: number;
  descuento_total: number;
  total: number;
}

const round2 = (value: number) => Math.round(value * 100) / 100;

function estaVigente(descuento: DescuentoCatalogo, hoy: Date): boolean {
  if (descuento.vigencia_desde && hoy < descuento.vigencia_desde) return false;
  if (descuento.vigencia_hasta && hoy > descuento.vigencia_hasta) return false;
  return true;
}

export function calcularDescuentos(params: {
  lineas: LineaVenta[];
  solicitudes: SolicitudDescuento[];
  descuentos: DescuentoCatalogo[];
  limites: LimitesEmpleado;
  hoy: Date;
}): ResultadoCalculo {
  const { lineas, solicitudes, descuentos, limites, hoy } = params;

  const lineasCalculadas: LineaCalculada[] = lineas.map((linea) => {
    const subtotalBruto = round2(linea.cantidad * linea.precio_unitario);
    return {
      producto_id: linea.producto_id,
      cantidad: linea.cantidad,
      precio_unitario: linea.precio_unitario,
      subtotal_bruto: subtotalBruto,
      descuento_id: null,
      descuento_tipo: null,
      descuento_valor: null,
      descuento_aplicado: 0,
      subtotal: subtotalBruto,
    };
  });

  const subtotal = round2(lineasCalculadas.reduce((sum, l) => sum + l.subtotal_bruto, 0));

  const aplicados: DescuentoAplicado[] = [];
  const rechazados: DescuentoRechazado[] = [];

  for (const solicitud of solicitudes) {
    const descuento = descuentos.find((d) => d.id === solicitud.descuento_id);

    if (!descuento) {
      rechazados.push({
        descuento_id: solicitud.descuento_id,
        producto_id: solicitud.producto_id ?? null,
        motivo: 'DESCUENTO_INEXISTENTE',
      });
      continue;
    }

    if (!descuento.activo) {
      rechazados.push({
        descuento_id: descuento.id,
        producto_id: solicitud.producto_id ?? null,
        motivo: 'DESCUENTO_INACTIVO',
      });
      continue;
    }

    if (!estaVigente(descuento, hoy)) {
      rechazados.push({
        descuento_id: descuento.id,
        producto_id: solicitud.producto_id ?? null,
        motivo: 'FUERA_DE_VIGENCIA',
      });
      continue;
    }

    // Base de cálculo: línea o total de la venta.
    let monto = 0;
    let lineaObjetivo: LineaCalculada | undefined;

    if (descuento.aplica_a === 'linea') {
      lineaObjetivo = lineasCalculadas.find((l) => l.producto_id === solicitud.producto_id);
      if (!lineaObjetivo) {
        rechazados.push({
          descuento_id: descuento.id,
          producto_id: solicitud.producto_id ?? null,
          motivo: 'NO_APLICA_A_PRODUCTO',
        });
        continue;
      }
      monto =
        descuento.tipo === 'porcentaje'
          ? round2((lineaObjetivo.subtotal_bruto * descuento.valor) / 100)
          : round2(Math.min(descuento.valor, lineaObjetivo.subtotal_bruto));
    } else {
      monto =
        descuento.tipo === 'porcentaje'
          ? round2((subtotal * descuento.valor) / 100)
          : round2(Math.min(descuento.valor, subtotal));
    }

    // Límites del empleado (R-003).
    if (descuento.tipo === 'porcentaje' && descuento.valor > limites.descuento_max_porcentaje) {
      rechazados.push({
        descuento_id: descuento.id,
        producto_id: solicitud.producto_id ?? null,
        motivo: 'EXCEDE_LIMITE_EMPLEADO',
        detalle: `Máximo autorizado: ${limites.descuento_max_porcentaje}%`,
      });
      continue;
    }

    if (monto > limites.descuento_max_monto) {
      rechazados.push({
        descuento_id: descuento.id,
        producto_id: solicitud.producto_id ?? null,
        motivo: 'EXCEDE_LIMITE_EMPLEADO',
        detalle: `Máximo autorizado: ${limites.descuento_max_monto}`,
      });
      continue;
    }

    // Aprobación requerida (R-004).
    if (descuento.requiere_aprobacion && !limites.puede_aprobar_descuentos) {
      rechazados.push({
        descuento_id: descuento.id,
        producto_id: solicitud.producto_id ?? null,
        motivo: 'REQUIERE_APROBACION',
      });
      continue;
    }

    aplicados.push({
      descuento_id: descuento.id,
      nombre: descuento.nombre,
      tipo: descuento.tipo,
      valor: descuento.valor,
      monto,
      producto_id: solicitud.producto_id ?? null,
      requiere_aprobacion: descuento.requiere_aprobacion,
    });

    if (lineaObjetivo) {
      lineaObjetivo.descuento_id = descuento.id;
      lineaObjetivo.descuento_tipo = descuento.tipo;
      lineaObjetivo.descuento_valor = descuento.valor;
      lineaObjetivo.descuento_aplicado = monto;
      lineaObjetivo.subtotal = round2(lineaObjetivo.subtotal_bruto - monto);
    }
  }

  const descuentoTotal = round2(aplicados.reduce((sum, d) => sum + d.monto, 0));

  return {
    lineas: lineasCalculadas,
    aplicados,
    rechazados,
    subtotal,
    descuento_total: descuentoTotal,
    // El total nunca es negativo (R-006).
    total: round2(Math.max(0, subtotal - descuentoTotal)),
  };
}
