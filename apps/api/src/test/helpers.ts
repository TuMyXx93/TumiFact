import type { FastifyInstance } from 'fastify';

export const ADMIN_CREDENTIALS = { credential: 'admin@tumifact.com', password: 'Password*2026' };
export const EMPLEADO_CREDENTIALS = { credential: 'kelly@tumifact.com', password: 'Password*2026' };

/** Inicia sesión y devuelve el header Authorization listo para usar. */
export async function loginAs(
  app: FastifyInstance,
  credenciales: { credential: string; password: string } = ADMIN_CREDENTIALS
): Promise<{ authorization: string; token: string }> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: credenciales,
  });
  if (res.statusCode !== 200) {
    throw new Error(`Login falló: ${res.statusCode} ${res.body}`);
  }
  const token = res.json().token;
  return { token, authorization: `Bearer ${token}` };
}
