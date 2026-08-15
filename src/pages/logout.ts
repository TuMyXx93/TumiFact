/**
 * GET /logout — Endpoint de cierre de sesión server-side.
 *
 * Elimina la cookie `tumifact_token` en el Set-Cookie del response
 * (garantizado por el servidor) y redirige a /login.
 * Esto evita la condición de carrera donde el middleware de Astro
 * todavía veía el token antes de que el cliente lo borrase.
 */
export const GET = async ({ cookies, redirect }: { cookies: any; redirect: any }) => {
  // Eliminar cookie server-side — esto se incluye en el header Set-Cookie de la respuesta
  cookies.delete('tumifact_token', { path: '/' });
  // Redirigir al login con status 302
  return redirect('/login', 302);
};
