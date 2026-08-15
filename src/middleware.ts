import { defineMiddleware } from 'astro:middleware';
import { jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'tumifact-super-secret-jwt-key-2026';
const secretKey = new TextEncoder().encode(JWT_SECRET);

// Rutas totalmente públicas que no requieren autenticación
const PUBLIC_PREFIXES = [
  '/login',
  '/logout',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/health',
  '/_astro',
  '/favicon.svg',
  '/static'
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Verificar si la ruta es pública
  const isPublic = PUBLIC_PREFIXES.some(prefix => 
    pathname === prefix || pathname.startsWith(prefix + '/')
  );

  // Leer token desde cookies o header Authorization
  const cookieToken = context.cookies.get('tumifact_token')?.value;
  const authHeader = context.request.headers.get('Authorization');
  const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;
  const token = cookieToken || bearerToken;

  let validatedUser = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secretKey);
      validatedUser = payload;
      context.locals.user = validatedUser;
    } catch (_err) {
      // Token inválido o expirado
      context.cookies.delete('tumifact_token', { path: '/' });
    }
  }

  // Si ya está autenticado y entra a /login, redirigir al Dashboard principal
  if (validatedUser && pathname === '/login') {
    return context.redirect('/');
  }

  // Si no está autenticado y la ruta no es pública, redirigir al Login
  if (!validatedUser && !isPublic) {
    // Si es un request de API que no es login/health, responder 401 JSON
    if (pathname.startsWith('/api/')) {
      return new Response(JSON.stringify({ error: 'No autorizado. Se requiere inicio de sesión.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return context.redirect('/login');
  }

  return next();
});
