import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-only-secret-change-me';

export function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET) as { id: number; rol_nombre?: string };
}

export function getBearerToken(request: { headers: { authorization?: string } }) {
  const authHeader = request.headers.authorization;
  return authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
}

export function hasRole(user: any, roles: string[]) {
  return user?.rol_nombre === 'admin' || roles.includes(user?.rol_nombre);
}
