import { randomUUID } from 'node:crypto';
import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { createSession, JWT_SECRET, JWT_TTL_SECONDS } from '../../lib/auth';
import { prisma } from '../../lib/prisma';

const MAX_INTENTOS = 5;
const BLOQUEO_MINUTOS = 15;

export async function login(
  credential: string,
  password: string,
  meta?: { ip?: string; userAgent?: string }
) {
  const user = await prisma.usuarios.findFirst({
    where: {
      OR: [{ email: credential }, { numero_identificacion: credential }],
    },
    include: { roles: true },
  });

  const credencialesInvalidas = Object.assign(new Error('Credenciales incorrectas'), {
    statusCode: 401,
  });

  if (!user) {
    // Verificación dummy para no filtrar por temporización si el usuario existe.
    await argon2
      .verify('$argon2id$v=19$m=65536,t=3,p=4$dummy$dummy', password)
      .catch(() => undefined);
    throw credencialesInvalidas;
  }

  if (!user.activo) {
    throw Object.assign(new Error('La cuenta se encuentra inactiva. Contacte al administrador.'), {
      statusCode: 403,
    });
  }

  if (user.bloqueado_hasta && user.bloqueado_hasta > new Date()) {
    const minutos = Math.max(1, Math.ceil((user.bloqueado_hasta.getTime() - Date.now()) / 60000));
    throw Object.assign(
      new Error(`Cuenta bloqueada temporalmente. Intente de nuevo en ${minutos} minuto(s).`),
      { statusCode: 429 }
    );
  }

  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) {
    const intentos = (user.intentos_fallidos || 0) + 1;
    const debeBloquear = intentos >= MAX_INTENTOS;
    await prisma.usuarios.update({
      where: { id: user.id },
      data: {
        intentos_fallidos: intentos,
        bloqueado_hasta: debeBloquear ? new Date(Date.now() + BLOQUEO_MINUTOS * 60 * 1000) : null,
      },
    });
    throw Object.assign(
      new Error(
        debeBloquear
          ? `Cuenta bloqueada por ${BLOQUEO_MINUTOS} minutos tras ${intentos} intentos.`
          : `Contraseña incorrecta. Intentos restantes: ${MAX_INTENTOS - intentos}.`
      ),
      { statusCode: 401 }
    );
  }

  const rolNombre = user.roles?.nombre || 'empleado';

  const token = jwt.sign(
    {
      id: user.id,
      rol_id: user.rol_id,
      rol_nombre: rolNombre,
      // `jti` garantiza unicidad del token: sin él, dos sesiones emitidas
      // dentro del mismo segundo serían idénticas (mismo `iat`) y colisionarían
      // en el índice único de `auth_sessions.token_hash`.
      jti: randomUUID(),
    },
    JWT_SECRET,
    { expiresIn: JWT_TTL_SECONDS }
  );

  // La sesión persistida permite revocación inmediata (R-006).
  await createSession({
    usuarioId: user.id,
    token,
    ip: meta?.ip,
    userAgent: meta?.userAgent,
  });

  await prisma.usuarios.update({
    where: { id: user.id },
    data: { ultimo_login: new Date(), intentos_fallidos: 0, bloqueado_hasta: null },
  });

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: rolNombre,
    },
  };
}
