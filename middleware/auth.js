const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'tumifact-super-secret-jwt-key-2026';

function extractToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  if (req.cookies && req.cookies.tumifact_token) {
    return req.cookies.tumifact_token;
  }
  // Extraer de cookie header raw si no hay cookie parser
  if (req.headers.cookie) {
    const match = req.headers.cookie.match(/(?:^|;\s*)tumifact_token=([^;]+)/);
    if (match) return decodeURIComponent(match[1]);
  }
  return null;
}

async function verifyAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Acceso no autorizado: Token no proporcionado' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await db.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.numero_identificacion, u.rol_id, r.nombre as rol_nombre, u.activo
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1 LIMIT 1`,
      [decoded.id]
    );

    const user = userRes.rows[0];
    if (!user || !user.activo) {
      return res.status(401).json({ error: 'Usuario inactivo o no encontrado' });
    }

    req.user = {
      id: user.id,
      nombre: user.nombre,
      apellido: user.apellido,
      email: user.email,
      numero_identificacion: user.numero_identificacion,
      rol_id: user.rol_id,
      rol_nombre: user.rol_nombre || 'empleado'
    };

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

async function optionalAuth(req, res, next) {
  try {
    const token = extractToken(req);
    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const userRes = await db.query(
      `SELECT u.id, u.nombre, u.apellido, u.email, u.numero_identificacion, u.rol_id, r.nombre as rol_nombre, u.activo
       FROM usuarios u
       LEFT JOIN roles r ON u.rol_id = r.id
       WHERE u.id = $1 LIMIT 1`,
      [decoded.id]
    );

    const user = userRes.rows[0];
    if (user && user.activo) {
      req.user = {
        id: user.id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        numero_identificacion: user.numero_identificacion,
        rol_id: user.rol_id,
        rol_nombre: user.rol_nombre || 'empleado'
      };
    }
  } catch (_) {}
  next();
}

function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    if (req.user.rol_nombre === 'admin' || allowedRoles.includes(req.user.rol_nombre)) {
      return next();
    }

    return res.status(403).json({
      error: `Acceso denegado: Se requiere rol ${allowedRoles.join(' o ')}`
    });
  };
}

module.exports = {
  verifyAuth,
  optionalAuth,
  requireRole,
  extractToken
};
