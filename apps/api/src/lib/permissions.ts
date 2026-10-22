/**
 * Permisos granulares. Leen `roles.permisos` (JSONB) verificado contra la BD.
 * El admin los tiene todos implícitamente.
 */

export type Permiso =
  | 'descuentos:aprobar'
  | 'descuentos:gestionar'
  | 'reportes:read'
  | 'empleados:read'
  | 'empleados:gestionar';

export const PERMISOS_POR_ROL: Record<string, Permiso[]> = {
  admin: [],
  gerente: ['descuentos:aprobar', 'descuentos:gestionar', 'reportes:read', 'empleados:read'],
  empleado: [],
};

export interface ContextoPermisos {
  rol_nombre?: string;
  permisos?: Record<string, unknown>;
}

export function tienePermiso(
  contexto: ContextoPermisos | null | undefined,
  permiso: Permiso
): boolean {
  if (!contexto) return false;
  // El administrador tiene todos los permisos por definición.
  if (contexto.rol_nombre === 'admin') return true;
  const bag = contexto.permisos;
  if (!bag || typeof bag !== 'object') return false;
  return bag[permiso] === true || bag[permiso] === 1;
}
