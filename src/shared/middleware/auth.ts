import { eq } from 'drizzle-orm';
import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/security';
import { db } from '../../db';
import { roles } from '../../db/schema/roles';
import { usuarios } from '../../db/schema/usuarios';

export interface AuthenticatedUser {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  numero_identificacion?: string | null;
  rol_id: number;
  rol_nombre: string;
  permisos: Record<string, unknown>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.cookies && req.cookies.tumifact_token) {
    return req.cookies.tumifact_token;
  }
  return null;
}

export async function verifyAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: number;
      email: string;
    };

    const userRows = await db
      .select({
        id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        numero_identificacion: usuarios.numero_identificacion,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        permisos: roles.permisos,
        activo: usuarios.activo,
        bloqueado_hasta: usuarios.bloqueado_hasta,
      })
      .from(usuarios)
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .where(eq(usuarios.id, decoded.id))
      .limit(1);

    const user = userRows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado' });
    }

    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      return res.status(403).json({ error: 'Cuenta bloqueada temporalmente por seguridad' });
    }

    req.user = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      numero_identificacion: user.numero_identificacion,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre || 'empleado',
      permisos: (user.permisos as Record<string, unknown>) || {},
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.rol_nombre === 'admin' || allowedRoles.includes(req.user.rol_nombre)) {
      return next();
    }

    return res.status(403).json({
      error: `Acceso denegado: Se requiere rol ${allowedRoles.join(' o ')}`,
    });
  };
}

// Fase 2: RBAC granular por permisos JSONB (preparación Workspaces)
// Usa roles.permisos {"facturas:create":true} en vez de rol hardcode.
// Mantiene requireRole como alias para compatibilidad.
// Ejemplo: requirePermission('caja:abrir'), requirePermission('reportes:read')
export function requirePermission(...requiredPerms: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado', code: 'NOT_AUTHENTICATED' });
    }
    // admin bypass
    if (req.user.rol_nombre === 'admin') return next();

    const perms = req.user.permisos || {};
    const hasAll = requiredPerms.every((p) => perms[p] === true || (perms as any)[p] === 1);
    // Fallback compat: si permisos es {"admin":true} antiguo, respeta requireRole
    if (!hasAll) {
      return res.status(403).json({
        error: `Permiso denegado: requiere ${requiredPerms.join(', ')}`,
        code: 'FORBIDDEN_PERMISSION',
      });
    }
    next();
  };
}

export async function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) return next();

    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const userRows = await db
      .select({
        id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        numero_identificacion: usuarios.numero_identificacion,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        permisos: roles.permisos,
        activo: usuarios.activo,
      })
      .from(usuarios)
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .where(eq(usuarios.id, decoded.id))
      .limit(1);

    if (userRows[0] && userRows[0].activo) {
      req.user = {
        id: userRows[0].id,
        nombre: userRows[0].nombre,
        apellido: userRows[0].apellido,
        email: userRows[0].email,
        numero_identificacion: userRows[0].numero_identificacion,
        rol_id: userRows[0].rol_id,
        rol_nombre: userRows[0].rol_nombre || 'empleado',
        permisos: (userRows[0].permisos as Record<string, unknown>) || {},
      };
    }
  } catch (_) {
    // Optional, ignore error
  }
  next();
}
