import { createHash, randomUUID } from 'node:crypto';
import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';
export const JWT_TTL_SECONDS = 8 * 60 * 60;

export interface Actor {
  id: number;
  rol_id: number;
  rol_nombre: string;
  nombre: string;
  apellido: string;
  email: string;
  /** `roles.permisos` verificado contra la BD (JSONB). */
  permisos: Record<string, unknown>;
  /** Límites de descuento del perfil de empleado. */
  descuento_max_porcentaje: number;
  descuento_max_monto: number;
}

/** SHA-256 del token: nunca almacenamos el JWT en claro. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number; rol_id?: number; rol_nombre?: string };
}

export function getBearerToken(request: { headers: { authorization?: string } }): string | null {
  const authHeader = request.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
}

export function hasRole(
  user: { rol_nombre?: string } | null | undefined,
  roles: string[]
): boolean {
  if (!user) return false;
  return user.rol_nombre === 'admin' || roles.includes(user.rol_nombre || '');
}

/**
 * Resuelve el actor desde el request: valida el JWT, confirma que la sesión
 * siga viva en BD y que el usuario continúe activo.
 * Devuelve `null` si cualquiera de las condiciones falla.
 */
export async function resolveActor(request: FastifyRequest): Promise<Actor | null> {
  const token = getBearerToken(request);
  if (!token) return null;

  let payload: { id?: number };
  try {
    payload = verifyToken(token);
  } catch {
    return null;
  }
  if (!payload?.id) return null;

  const session = await prisma.auth_sessions.findFirst({
    where: {
      usuario_id: payload.id,
      token_hash: hashToken(token),
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
  });
  if (!session) return null;

  const user = await prisma.usuarios.findUnique({
    where: { id: payload.id },
    include: { roles: true, empleados: true },
  });
  if (!user || !user.activo) return null;

  const perfil = user.empleados;

  return {
    id: user.id,
    rol_id: user.rol_id,
    rol_nombre: user.roles?.nombre || 'empleado',
    nombre: user.nombre,
    apellido: user.apellido,
    email: user.email,
    permisos: (user.roles?.permisos as Record<string, unknown>) || {},
    descuento_max_porcentaje: Number(perfil?.descuento_max_porcentaje ?? 0),
    descuento_max_monto: Number(perfil?.descuento_max_monto ?? 0),
  };
}

/** Actor ya resuelto en el request (seteado por `authenticate`). */
export function getActor(request: FastifyRequest): Actor | null {
  return ((request as any).actor as Actor) || null;
}

/**
 * Actor obligatorio. Se usa tras `authenticate`, donde la sesión ya fue
 * validada; si falta, es un bug de ruteo y se responde 401.
 */
export function requireActor(request: FastifyRequest): Actor {
  const actor = getActor(request);
  if (!actor) {
    throw Object.assign(new Error('No autorizado'), { statusCode: 401 });
  }
  return actor;
}

/** PreHandler: exige sesión válida. Responde 401 y corta el flujo. */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const actor = await resolveActor(request);
  if (!actor) {
    return reply.status(401).send({ error: 'No autorizado' });
  }
  (request as any).actor = actor;
}

/** PreHandler: exige rol. Responde 403 y registra el intento. */
export function requireRole(roles: string[]) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const actor = getActor(request);
    if (!actor) {
      return reply.status(401).send({ error: 'No autorizado' });
    }
    if (!hasRole(actor, roles)) {
      const { recordAudit } = await import('./audit');
      await recordAudit({
        usuarioId: actor.id,
        accion: 'ACCESO_DENEGADO',
        entidad: 'endpoint',
        datosNuevos: {
          metodo: request.method,
          ruta: request.url,
          rol_requerido: roles,
          rol_actual: actor.rol_nombre,
        },
      });
      return reply.status(403).send({ error: 'Acceso denegado' });
    }
  };
}

/** Crea la sesión persistida que habilita la revocación inmediata. */
export async function createSession(params: {
  usuarioId: number;
  token: string;
  ip?: string;
  userAgent?: string;
}) {
  const expiresAt = new Date(Date.now() + JWT_TTL_SECONDS * 1000);
  await prisma.auth_sessions.create({
    data: {
      usuario_id: params.usuarioId,
      token_hash: hashToken(params.token),
      family_id: randomUUID(),
      expires_at: expiresAt,
      ip_address: params.ip || null,
      user_agent: params.userAgent ? params.userAgent.slice(0, 512) : null,
    },
  });
  return expiresAt;
}

/** Revoca todas las sesiones vivas de un usuario (al desactivarlo). */
export async function revokeUserSessions(usuarioId: number): Promise<number> {
  const result = await prisma.auth_sessions.updateMany({
    where: { usuario_id: usuarioId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
  return result.count;
}
