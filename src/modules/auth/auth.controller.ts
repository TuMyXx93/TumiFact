import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { RedisStore } from 'rate-limit-redis';
import { redisSendCommand } from '../../config/redis';
import { pool } from '../../db';
import { requireRole, verifyAuth } from '../../shared/middleware/auth';
import { refreshRateLimiter } from '../../shared/middleware/rate-limit';
import { validateDTO } from '../../shared/middleware/validate';
import { LoginDTO, RegisterUserDTO } from './auth.dto';
import { AuthService } from './auth.service';

export const authRouter = Router();
const service = new AuthService();
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 15 * 60 * 1000,
};
const refreshCookieOptions = {
  ...cookieOptions,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

// Rate limiter estricto para intentos de login (10 intentos por minuto por IP)
// En test se relaja a 1000 para permitir múltiples logins por suite sin 429
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 1000 : 10,
  message: {
    error: 'Demasiados intentos de inicio de sesión. Por favor intente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    prefix: 'tumifact:rl:login:',
    sendCommand: redisSendCommand,
  }),
});

// POST /api/auth/login — Inicio de sesión con correo O número de identificación
authRouter.post('/login', loginLimiter, validateDTO(LoginDTO), async (req, res, next) => {
  try {
    const result = await service.login(req.body, req);

    // Configurar cookie HTTP-only
    res.cookie('tumifact_token', result.token, cookieOptions);
    res.cookie('tumifact_refresh', result.refreshToken, refreshCookieOptions);

    const response = {
      message: 'Inicio de sesión exitoso',
      user: result.user,
    } as { message: string; user: typeof result.user; token?: string };

    // Browser clients use the HttpOnly cookie. Explicit API clients may opt in
    // to receiving the access token for Authorization: Bearer usage.
    if (req.get('Accept')?.includes('application/vnd.tumifact.auth+json')) {
      response.token = result.token;
    }

    res.json(response);
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout — Cerrar sesión
authRouter.post('/logout', (req, res) => {
  service.revokeRefreshToken(req.cookies?.tumifact_refresh).finally(() => {
    res.clearCookie('tumifact_token');
    res.clearCookie('tumifact_refresh');
    res.json({ message: 'Sesión finalizada correctamente' });
  });
});

authRouter.post('/refresh', refreshRateLimiter, async (req, res, next) => {
  try {
    const result = await service.refresh(req.cookies?.tumifact_refresh, req);
    res.cookie('tumifact_token', result.accessToken, cookieOptions);
    res.cookie('tumifact_refresh', result.refreshToken, refreshCookieOptions);
    res.json({ message: 'Sesión renovada correctamente', user: result.user });
  } catch (error) {
    next(error);
  }
});

authRouter.post('/logout-all', verifyAuth, async (req, res, next) => {
  try {
    await service.revokeAllSessions(req.user!.id);
    res.clearCookie('tumifact_token');
    res.clearCookie('tumifact_refresh');
    res.json({ message: 'Todas las sesiones fueron revocadas' });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me — Perfil del usuario autenticado
authRouter.get('/me', verifyAuth, async (req, res, next) => {
  try {
    const user = await service.getMe(req.user!.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/empleados-estado — Monitoreo en tiempo real de todos los empleados y sus turnos (Admin / Gerente)
authRouter.get(
  '/empleados-estado',
  verifyAuth,
  requireRole('admin', 'gerente'),
  async (req, res, next) => {
    try {
      const result = await pool.query(`
      SELECT 
        u.id, 
        u.nombre, 
        u.apellido, 
        u.email, 
        u.numero_identificacion,
        r.nombre as rol_nombre,
        u.ultimo_login,
        u.activo,
        sc.id as sesion_caja_activa_id,
        sc.monto_apertura as caja_monto_apertura,
        sc.abierta_at as caja_abierta_at,
        COALESCE((
          SELECT SUM(f.total) 
          FROM facturas f 
          WHERE f.sesion_caja_id = sc.id
        ), 0) as caja_total_ventas,
        COALESCE((
          SELECT COUNT(f.id) 
          FROM facturas f 
          WHERE f.sesion_caja_id = sc.id
        ), 0) as caja_total_facturas
      FROM usuarios u
      LEFT JOIN roles r ON u.rol_id = r.id
      LEFT JOIN sesiones_caja sc ON u.id = sc.usuario_id AND sc.estado = 'abierta'
      WHERE u.activo = true
      ORDER BY sc.id IS NOT NULL DESC, u.ultimo_login DESC NULLS LAST
    `);

      res.json(result.rows || []);
    } catch (error) {
      next(error);
    }
  }
);
