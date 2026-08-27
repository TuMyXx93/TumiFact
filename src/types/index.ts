// =====================================================
// DEFINICIONES DE TIPOS DE TUMIFACT v2.0
// =====================================================

export interface TipoIdentificacion {
  id: number;
  codigo: 'CC' | 'NIT' | 'CE' | 'PP' | 'TI' | 'RUT' | string;
  nombre: string;
  aplica_a: 'persona' | 'empresa' | 'todos' | string;
}

export interface Direccion {
  id?: number;
  calle?: string | null;
  barrio?: string | null;
  ciudad: string;
  departamento?: string | null;
  pais?: string;
  codigo_postal?: string | null;
  referencia?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Rol {
  id: number;
  nombre: 'admin' | 'gerente' | 'empleado' | string;
  descripcion?: string | null;
  permisos: Record<string, boolean | number | string>;
  created_at?: string;
}

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  tipo_identificacion_id?: number | null;
  tipo_identificacion_codigo?: string | null;
  numero_identificacion?: string | null;
  email: string;
  telefono?: string | null;
  direccion_id?: number | null;
  direccion?: Direccion | null;
  rol_id: number;
  rol_nombre?: string;
  activo: boolean;
  ultimo_login?: string | null;
  intentos_fallidos?: number;
  bloqueado_hasta?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Empleado {
  id: number;
  usuario_id: number;
  usuario?: Usuario;
  cargo: string;
  departamento?: string | null;
  salario?: number | string;
  fecha_ingreso?: string;
  turno?: 'mañana' | 'tarde' | 'noche' | 'completo' | string;
  descuento_max_porcentaje: number;
  descuento_max_monto: number;
  created_at?: string;
  updated_at?: string;
}

export interface SesionCaja {
  id: number;
  usuario_id: number;
  usuario_nombre?: string;
  estado: 'abierta' | 'cerrada' | string;
  monto_apertura: number;
  monto_cierre_declarado?: number | null;
  monto_cierre_calculado?: number;
  diferencia_caja?: number;
  ventas_efectivo: number;
  ventas_transferencia: number;
  ventas_tarjeta: number;
  total_ventas: number;
  total_devoluciones: number;
  total_separados_abonos: number;
  numero_transacciones: number;
  notas?: string | null;
  abierta_at: string;
  cerrada_at?: string | null;
}

export interface CategoriaProducto {
  id: number;
  nombre: string;
  tipo:
    | 'ropa'
    | 'calzado'
    | 'tecnologia'
    | 'articulos'
    | string;
  descripcion?: string | null;
  campos_extra?: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
  }>;
  aplica_inventario: boolean;
  activo: boolean;
  created_at?: string;
}

export interface Proveedor {
  id: number;
  nombre: string;
  razon_social?: string | null;
  tipo_identificacion_id?: number | null;
  numero_identificacion?: string | null;
  contacto_nombre?: string | null;
  email?: string | null;
  telefono?: string | null;
  telefono_secundario?: string | null;
  website?: string | null;
  direccion_id?: number | null;
  direccion?: Direccion | null;
  plazo_pago_dias: number;
  moneda: string;
  notas?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  categoria_id?: number | null;
  categoria_nombre?: string | null;
  categoria_tipo?: string | null;
  proveedor_id?: number | null;
  proveedor_nombre?: string | null;
  precio_kg: number;
  precio_unidad: number;
  precio_libra: number;
  precio_detal: number;
  precio_mayorista: number;
  cantidad_mayorista: number;
  stock_actual: number;
  stock_minimo: number;
  atributos?: Record<string, any>;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Cliente {
  id: number;
  nombre: string;
  apellido?: string | null;
  tipo_identificacion_id?: number | null;
  tipo_identificacion_codigo?: string | null;
  numero_identificacion?: string | null;
  email?: string | null;
  telefono?: string | null;
  telefono_secundario?: string | null;
  direccion_id?: number | null;
  direccion_texto?: string | null;
  direccion?: Direccion | null;
  tipo_cliente: 'detal' | 'mayorista' | 'vip' | string;
  notas?: string | null;
  total_compras: number;
  numero_facturas: number;
  ultima_compra?: string | null;
  activo: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface Descuento {
  id: number;
  nombre: string;
  descripcion?: string | null;
  tipo: 'porcentaje' | 'monto_fijo' | 'precio_especial' | string;
  valor: number;
  aplica_a: 'linea' | 'total' | string;
  requiere_aprobacion: boolean;
  activo: boolean;
  vigencia_desde?: string | null;
  vigencia_hasta?: string | null;
  created_at?: string;
}

export interface DetalleFacturaInput {
  producto_id: number;
  producto_nombre?: string;
  cantidad: number;
  precio: number;
  precio_original?: number;
  unidad: 'KG' | 'LB' | 'UND' | string;
  descuento_inline_tipo?: 'porcentaje' | 'monto_fijo' | null;
  descuento_inline_valor?: number;
  descuento_aplicado?: number;
  subtotal?: number;
}

export interface DetalleFactura extends DetalleFacturaInput {
  id: number;
  factura_id: number;
  producto_nombre?: string;
  created_at?: string;
}

export interface FacturaInput {
  idempotency_key?: string;
  cliente_id: number;
  usuario_id?: number;
  sesion_caja_id?: number;
  subtotal?: number;
  descuento_total?: number;
  descuento_detalle?: Array<{ tipo: string; valor: number; motivo?: string }>;
  total: number;
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta' | 'mixto' | string;
  tipo?: 'contado' | 'separado_final' | string;
  productos: DetalleFacturaInput[];
}

export interface Factura extends FacturaInput {
  id: number;
  fecha: string;
  estado: 'completada' | 'devuelta' | 'parcialmente_devuelta' | 'anulada' | string;
  created_at?: string;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_identificacion?: string;
  cliente_direccion?: string;
  cliente_telefono?: string;
  cajero_nombre?: string;
}

export interface SeparadoInput {
  idempotency_key?: string;
  cliente_id: number;
  descripcion: string;
  observaciones?: string;
  valor_total: number;
  abono_inicial: number;
  dias_plazo?: number;
  fecha_limite?: string;
  productos: Array<{
    producto_id: number;
    cantidad: number;
    precio_unitario: number;
    unidad_medida?: string;
    subtotal: number;
    descuento_aplicado?: number;
  }>;
}

export interface Separado {
  id: number;
  idempotency_key?: string;
  cliente_id: number;
  cliente_nombre?: string;
  cliente_apellido?: string;
  cliente_telefono?: string;
  usuario_apertura_id: number;
  cajero_nombre?: string;
  sesion_caja_id?: number;
  descripcion: string;
  observaciones?: string;
  valor_total: number;
  abono_inicial: number;
  total_abonado: number;
  saldo_pendiente: number;
  fecha_inicio: string;
  fecha_limite: string;
  dias_plazo: number;
  estado: 'activo' | 'completado' | 'vencido' | 'cancelado' | 'extendido';
  factura_id?: number | null;
  productos?: Array<{
    id: number;
    producto_id: number;
    producto_nombre?: string;
    cantidad: number;
    precio_unitario: number;
    unidad_medida: string;
    subtotal: number;
  }>;
  abonos?: AbonoSeparado[];
  created_at?: string;
  updated_at?: string;
}

export interface AbonoSeparado {
  id: number;
  idempotency_key?: string;
  separado_id: number;
  usuario_id: number;
  cajero_nombre?: string;
  sesion_caja_id?: number;
  numero_abono: number;
  monto: number;
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta' | string;
  referencia_pago?: string | null;
  notas?: string | null;
  es_abono_final: boolean;
  created_at?: string;
}

export interface DevolucionInput {
  idempotency_key?: string;
  factura_id: number;
  tipo: 'devolucion_total' | 'devolucion_parcial' | 'cambio_producto';
  motivo: string;
  descripcion_detallada?: string;
  forma_devolucion?: 'efectivo' | 'credito_tienda' | 'transferencia';
  items: Array<{
    detalle_factura_id?: number;
    producto_id: number;
    cantidad_devuelta: number;
    precio_unitario: number;
    motivo_item?: string;
    condicion?: 'bueno' | 'dañado' | 'defectuoso';
    reingresa_inventario?: boolean;
  }>;
}

export interface MovimientoInventario {
  id: number;
  idempotency_key?: string;
  producto_id: number;
  producto_nombre?: string;
  usuario_id?: number;
  usuario_nombre?: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  costo_unitario?: number;
  referencia_tipo?: string;
  referencia_id?: number;
  notas?: string;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  usuario_id?: number;
  usuario_nombre?: string;
  accion: string;
  entidad?: string;
  entidad_id?: number;
  datos_previos?: any;
  datos_nuevos?: any;
  ip_address?: string;
  user_agent?: string;
  resultado: string;
  mensaje_error?: string;
  created_at: string;
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
  esquema_colores?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
  mensaje_bienvenida?: string;
  mensaje_pie?: string;
  politica_devolucion?: string;
  politica_separados?: string;
  dias_plazo_separado_default?: number;
  redes_sociales?: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}
