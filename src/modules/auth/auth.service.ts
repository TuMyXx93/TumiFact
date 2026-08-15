import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { db } from '../../db';
import { usuarios } from '../../db/schema/usuarios';
import { roles } from '../../db/schema/roles';
import { empleados } from '../../db/schema/empleados';
import { eq, or } from 'drizzle-orm';
import type { LoginInput, RegisterUserInput } from './auth.dto';
import { recordAudit } from '../../shared/utils/audit';
import type { Request } from 'express';

const JWT_SECRET = process.env.JWT_SECRET || 'tumifact-super-secret-jwt-key-2026';
const JWT_EXPIRES_IN = '12h';

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
