const express = require('express');
const router = express.Router();
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tumifact-super-secret-jwt-key-2026';

router.post('/login', async (req, res) => {
  try {
    const { credential, password } = req.body;
    if (!credential || !password) {
      return res.status(400).json({ error: 'Credencial y contraseña son requeridas' });
    }

    const userRes = await db.query(
      `SELECT u.*, r.nombre as rol_nombre, r.permisos
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.email = $1 OR u.numero_identificacion = $1
       LIMIT 1`,
      [credential.trim()]
    );

    const user = userRes.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Credenciales incorrectas' });
    }

    if (!user.activo) {
      return res.status(403).json({ error: 'Usuario inactivo' });
    }

    let passwordMatches = false;
    try {
      passwordMatches = await argon2.verify(user.password_hash, password);
    } catch (_) {
      passwordMatches = false;
    }

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Actualizar último login
    await db.query('UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1', [user.id]);

    const token = jwt.sign(
      {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        rol_nombre: user.rol_nombre
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    const userPayload = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      numero_identificacion: user.numero_identificacion,
      rol_nombre: user.rol_nombre || 'empleado'
    };

    // Emitir evento de socket si io está activo
    try {
      const { emitEvent } = require('../src/server/socket');
      emitEvent('usuario:conectado', { user: userPayload, timestamp: new Date().toISOString() });
    } catch (_) {}

    res.json({
      message: 'Inicio de sesión exitoso',
      token,
      user: userPayload
    });
  } catch (err) {
    console.error('Error en auth login:', err);
    res.status(500).json({ error: 'Error interno en autenticación' });
  }
});

router.post('/logout', (req, res) => {
  res.clearCookie('tumifact_token');
  res.json({ message: 'Sesión finalizada correctamente' });
});

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' });
  }
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    res.json(decoded);
  } catch (_) {
    res.status(401).json({ error: 'Token inválido' });
  }
});

const { verifyAuth, requireRole } = require('../middleware/auth');

// Endpoint administrativo para ver el estado en tiempo real de todos los empleados
router.get('/empleados-estado', verifyAuth, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const result = await db.query(`
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
  } catch (err) {
    console.error('Error al listar estado de empleados:', err);
    res.status(500).json({ error: 'Error al consultar estado de empleados' });
  }
});

module.exports = router;
