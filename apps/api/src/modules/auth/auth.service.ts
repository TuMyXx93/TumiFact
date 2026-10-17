import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export async function login(credential: string, password: string) {
  const user = await prisma.usuarios.findFirst({
    where: {
      OR: [{ email: credential }, { numero_identificacion: credential }],
    },
    include: { roles: true },
  });

  if (!user || !user.activo) {
    throw Object.assign(new Error('Credenciales incorrectas'), { statusCode: 401 });
  }

  const ok = await argon2.verify(user.password_hash, password);
  if (!ok) {
    throw Object.assign(new Error('Credenciales incorrectas'), { statusCode: 401 });
  }

  await prisma.usuarios.update({
    where: { id: user.id },
    data: { ultimo_login: new Date(), intentos_fallidos: 0 },
  });

  const token = jwt.sign(
    {
      id: user.id,
      rol_id: user.rol_id,
      rol_nombre: user.roles?.nombre || 'empleado',
    },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  return {
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      rol_id: user.rol_id,
      rol_nombre: user.roles?.nombre || 'empleado',
    },
  };
}
