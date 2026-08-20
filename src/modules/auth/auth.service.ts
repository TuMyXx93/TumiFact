import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../../config/security';
import { db } from '../../db';
import { usuarios } from '../../db/schema/usuarios';
import { roles } from '../../db/schema/roles';
import { empleados } from '../../db/schema/empleados';
import { eq, or } from 'drizzle-orm';
import type { LoginInput, RegisterUserInput } from './auth.dto';
import { recordAudit } from '../../shared/utils/audit';
import type { Request } from 'express';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { authSessions } from '../../db/schema/auth_sessions';
import { and, isNull } from 'drizzle-orm';

const JWT_EXPIRES_IN = '15m';
const REFRESH_DAYS = 7;

const hashRefreshToken = (token: string) => createHash('sha256').update(token).digest('hex');

export class AuthService {
  async login(input: LoginInput, req?: Request) {
    const cred = input.credential.trim();

    // Dual lookup: email OR numero_identificacion
    const rows = await db
      .select({
        id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        numero_identificacion: usuarios.numero_identificacion,
        password_hash: usuarios.password_hash,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        permisos: roles.permisos,
        activo: usuarios.activo,
        intentos_fallidos: usuarios.intentos_fallidos,
        bloqueado_hasta: usuarios.bloqueado_hasta
      })
      .from(usuarios)
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .where(or(eq(usuarios.email, cred), eq(usuarios.numero_identificacion, cred)))
      .limit(1);

    const user = rows[0];

    if (!user) {
      await recordAudit({
        accion: 'LOGIN_FALLIDO',
        entidad: 'usuarios',
        resultado: 'error',
        mensajeError: `Credencial no encontrada: ${cred}`,
        req
      });
      const error: any = new Error('Credenciales incorrectas');
      error.statusCode = 401;
      throw error;
    }

    if (!user.activo) {
      await recordAudit({
        usuarioId: user.id,
        accion: 'LOGIN_RECHAZADO',
        entidad: 'usuarios',
        resultado: 'rechazado',
        mensajeError: 'Usuario inactivo',
        req
      });
      const error: any = new Error('La cuenta se encuentra inactiva. Contacte al administrador.');
      error.statusCode = 403;
      throw error;
    }

    // Verificar bloqueo por intentos fallidos
    if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
      const remainingMinutes = Math.ceil((new Date(user.bloqueado_hasta).getTime() - Date.now()) / 60000);
      const error: any = new Error(`Cuenta bloqueada temporalmente por seguridad. Intente de nuevo en ${remainingMinutes} minutos.`);
      error.statusCode = 429;
      throw error;
    }

    // Verificar contraseña con Argon2id
    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(user.password_hash, input.password);
    } catch (e) {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      const newAttempts = (user.intentos_fallidos || 0) + 1;
      let blockTime: Date | null = null;

      if (newAttempts >= 5) {
        // Bloquear por 15 minutos tras 5 intentos
        blockTime = new Date(Date.now() + 15 * 60 * 1000);
      }

      await db
        .update(usuarios)
        .set({
          intentos_fallidos: newAttempts,
          bloqueado_hasta: blockTime
        })
        .where(eq(usuarios.id, user.id));

      await recordAudit({
        usuarioId: user.id,
        accion: 'LOGIN_PASSWORD_ERRONEA',
        entidad: 'usuarios',
        entidadId: user.id,
        resultado: 'error',
        mensajeError: `Intento fallido ${newAttempts}/5`,
        req
      });

      const error: any = new Error(
        newAttempts >= 5
          ? 'Ha excedido el número de intentos. Cuenta bloqueada por 15 minutos.'
          : `Contraseña incorrecta. Intentos restantes: ${5 - newAttempts}`
      );
      error.statusCode = 401;
      throw error;
    }

    // Reset intentos fallidos y actualizar último login
    await db
      .update(usuarios)
      .set({
        intentos_fallidos: 0,
        bloqueado_hasta: null,
        ultimo_login: new Date()
      })
      .where(eq(usuarios.id, user.id));

    // Obtener detalles de empleado si existen
    const empRows = await db.select().from(empleados).where(eq(empleados.usuario_id, user.id)).limit(1);
    const empData = empRows[0];

    // Generar JWT
    const payload = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      numero_identificacion: user.numero_identificacion,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = await this.createRefreshSession(user.id, req);

    await recordAudit({
      usuarioId: user.id,
      accion: 'LOGIN_EXITOSO',
      entidad: 'usuarios',
      entidadId: user.id,
      resultado: 'ok',
      req
    });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        numero_identificacion: user.numero_identificacion,
        rol_id: user.rol_id,
        rol_nombre: user.rol_nombre || 'empleado',
        permisos: user.permisos,
        cargo: empData?.cargo || 'Colaborador',
        descuento_max_porcentaje: empData ? parseFloat(empData.descuento_max_porcentaje) : 10,
        descuento_max_monto: empData ? parseFloat(empData.descuento_max_monto) : 50000
      }
    };
  }

  async createRefreshSession(userId: number, req?: Request, familyId: `${string}-${string}-${string}-${string}-${string}` = randomUUID()) {
    const refreshToken = randomBytes(48).toString('base64url');
    const expiresAt = new Date(Date.now() + REFRESH_DAYS * 24 * 60 * 60 * 1000);
    await db.insert(authSessions).values({
      usuario_id: userId,
      token_hash: hashRefreshToken(refreshToken),
      family_id: familyId,
      expires_at: expiresAt,
      ip_address: req?.ip || null,
      user_agent: req?.get('user-agent')?.slice(0, 512) || null
    });
    return refreshToken;
  }

  async refresh(refreshToken: string | undefined, req?: Request) {
    if (!refreshToken) {
      const error: any = new Error('Refresh token no proporcionado');
      error.statusCode = 401;
      throw error;
    }
    const tokenHash = hashRefreshToken(refreshToken);
    const rows = await db.select().from(authSessions).where(eq(authSessions.token_hash, tokenHash)).limit(1);
    const session = rows[0];
    if (!session) {
      const error: any = new Error('Refresh token inválido, expirado o revocado');
      error.statusCode = 401;
      error.code = 'AUTH_REFRESH_REJECTED';
      throw error;
    }
    if (session.revoked_at || session.expires_at <= new Date()) {
      if (session.revoked_at) await db.update(authSessions).set({ revoked_at: new Date() }).where(eq(authSessions.family_id, session.family_id));
      const error: any = new Error('Refresh token inválido, expirado o revocado');
      error.statusCode = 401;
      error.code = 'AUTH_REFRESH_REJECTED';
      throw error;
    }
    const user = await this.getMe(session.usuario_id);
    if (!user) {
      const error: any = new Error('Usuario no encontrado');
      error.statusCode = 401;
      throw error;
    }
    const accessToken = jwt.sign({ id: user.id, email: user.email, rol_nombre: user.rol_nombre }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const replacement = await this.createRefreshSession(session.usuario_id, req, session.family_id as `${string}-${string}-${string}-${string}-${string}`);
    const replacementHash = hashRefreshToken(replacement);
    const replacementRow = await db.select({ id: authSessions.id }).from(authSessions).where(eq(authSessions.token_hash, replacementHash)).limit(1);
    await db.update(authSessions).set({ revoked_at: new Date(), replaced_by: replacementRow[0]?.id || null, last_used_at: new Date() }).where(eq(authSessions.id, session.id));
    return { accessToken, refreshToken: replacement, user };
  }

  async revokeRefreshToken(refreshToken?: string) {
    if (!refreshToken) return;
    await db.update(authSessions).set({ revoked_at: new Date() }).where(and(eq(authSessions.token_hash, hashRefreshToken(refreshToken)), isNull(authSessions.revoked_at)));
  }

  async revokeAllSessions(userId: number) {
    await db.update(authSessions).set({ revoked_at: new Date() }).where(and(eq(authSessions.usuario_id, userId), isNull(authSessions.revoked_at)));
  }

  async register(input: RegisterUserInput, req?: Request) {
    // Hash de contraseña con Argon2id
    const password_hash = await argon2.hash(input.password, {
      type: argon2.argon2id,
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4
    });

    return await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(usuarios)
        .values({
          nombre: input.nombre,
          apellido: input.apellido,
          tipo_identificacion_id: input.tipo_identificacion_id || null,
          numero_identificacion: input.numero_identificacion || null,
          email: input.email.toLowerCase().trim(),
          telefono: input.telefono || null,
          password_hash,
          rol_id: input.rol_id,
          activo: true
        })
        .returning();

      const newUser = inserted[0];

      // Crear perfil de empleado asociado
      await tx.insert(empleados).values({
        usuario_id: newUser.id,
        cargo: input.cargo || 'Vendedor/Cajero',
        departamento: input.departamento || null,
        salario: input.salario?.toString() || '0',
        descuento_max_porcentaje: (input.descuento_max_porcentaje || 10).toString(),
        descuento_max_monto: (input.descuento_max_monto || 50000).toString()
      });

      await recordAudit({
        usuarioId: req?.user?.id || newUser.id,
        accion: 'USUARIO_CREADO',
        entidad: 'usuarios',
        entidadId: newUser.id,
        datosNuevos: { email: newUser.email, nombre: `${newUser.nombre} ${newUser.apellido}`, rol_id: newUser.rol_id },
        req
      });

      return {
        id: newUser.id,
        nombre: newUser.nombre,
        apellido: newUser.apellido,
        email: newUser.email,
        numero_identificacion: newUser.numero_identificacion,
        rol_id: newUser.rol_id
      };
    });
  }

  async getMe(userId: number) {
    const rows = await db
      .select({
        id: usuarios.id,
        nombre: usuarios.nombre,
        apellido: usuarios.apellido,
        email: usuarios.email,
        telefono: usuarios.telefono,
        numero_identificacion: usuarios.numero_identificacion,
        rol_id: usuarios.rol_id,
        rol_nombre: roles.nombre,
        permisos: roles.permisos,
        activo: usuarios.activo,
        cargo: empleados.cargo,
        departamento: empleados.departamento,
        descuento_max_porcentaje: empleados.descuento_max_porcentaje,
        descuento_max_monto: empleados.descuento_max_monto
      })
      .from(usuarios)
      .leftJoin(roles, eq(usuarios.rol_id, roles.id))
      .leftJoin(empleados, eq(usuarios.id, empleados.usuario_id))
      .where(eq(usuarios.id, userId))
      .limit(1);

    const user = rows[0];
    if (!user) return null;

    return {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      telefono: user.telefono,
      numero_identificacion: user.numero_identificacion,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre,
      permisos: user.permisos,
      cargo: user.cargo || 'Colaborador',
      descuento_max_porcentaje: user.descuento_max_porcentaje ? parseFloat(user.descuento_max_porcentaje) : 10,
      descuento_max_monto: user.descuento_max_monto ? parseFloat(user.descuento_max_monto) : 50000
    };
  }
}
