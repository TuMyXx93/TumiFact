import { Router } from 'express';
import { AuthService } from './auth.service';
import { validateDTO } from '../../shared/middleware/validate';
import { LoginDTO, RegisterUserDTO } from './auth.dto';
import { verifyAuth, requireRole } from '../../shared/middleware/auth';
import { pool } from '../../db';
import rateLimit from 'express-rate-limit';

export const authRouter = Router();
const service = new AuthService();

// Rate limiter estricto para intentos de login (10 intentos por minuto por IP)
const loginLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: { error: 'Demasiados intentos de inicio de sesión. Por favor intente más tarde.' },
  standardHeaders: true,
  legacyHeaders: false
});

// POST /api/auth/login — Inicio de sesión con correo O número de identificación
authRouter.post('/login', loginLimiter, validateDTO(LoginDTO), async (req, res, next) => {
  try {
    const result = await service.login(req.body, req);
    
    // Configurar cookie HTTP-only
    res.cookie('tumifact_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000 // 12 horas
    });

    res.json({
      message: 'Inicio de sesión exitoso',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/auth/logout — Cerrar sesión
authRouter.post('/logout', (req, res) => {
  res.clearCookie('tumifact_token');
  res.json({ message: 'Sesión finalizada correctamente' });
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
authRouter.get('/empleados-estado', verifyAuth, requireRole('admin', 'gerente'), async (req, res, next) => {
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
});
