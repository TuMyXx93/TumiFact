const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/estado', async (req, res) => {
  try {
    const userId = req.user ? req.user.id : (process.env.NODE_ENV === 'test' ? (parseInt(req.query.usuario_id || '1', 10)) : null);
    if (!userId) {
      return res.json({ abierta: false, sesion: null });
    }
    const result = await db.query(
      `SELECT * FROM sesiones_caja WHERE usuario_id = $1 AND estado = 'abierta' ORDER BY abierta_at DESC LIMIT 1`,
      [userId]
    );

    const session = result.rows[0];
    if (!session) {
      return res.json({ abierta: false, sesion: null });
    }

    // Calcular estadísticas de ventas en tiempo real
    const statsRes = await db.query(
      `SELECT forma_pago, COALESCE(SUM(total), 0) as total, COUNT(*) as count
       FROM facturas
       WHERE sesion_caja_id = $1
       GROUP BY forma_pago`,
      [session.id]
    );

    let efectivo = 0;
    let transferencia = 0;
    let tarjeta = 0;
    let totalVentas = 0;

    for (const row of statsRes.rows) {
      const amount = parseFloat(row.total || 0);
      totalVentas += amount;
      if (row.forma_pago === 'efectivo') efectivo += amount;
      else if (row.forma_pago === 'transferencia') transferencia += amount;
      else if (row.forma_pago === 'tarjeta') tarjeta += amount;
      else efectivo += amount;
    }

    session.ventas_efectivo = efectivo;
    session.ventas_transferencia = transferencia;
    session.ventas_tarjeta = tarjeta;
    session.total_ventas = totalVentas;

    res.json({
      abierta: true,
      sesion: session
    });
  } catch (err) {
    console.error('Error al obtener estado de caja:', err);
    res.status(500).json({ error: 'Error al consultar sesión de caja' });
  }
});

router.post('/abrir', async (req, res) => {
  try {
    const { monto_apertura, notas } = req.body;
    const userId = req.user ? req.user.id : (req.body.usuario_id || 1);

    const existing = await db.query(
      `SELECT id FROM sesiones_caja WHERE usuario_id = $1 AND estado = 'abierta' LIMIT 1`,
      [userId]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Ya tiene una sesión de caja abierta' });
    }

    const inserted = await db.query(
      `INSERT INTO sesiones_caja (usuario_id, monto_apertura, estado, notas)
       VALUES ($1, $2, 'abierta', $3)
       RETURNING *`,
      [userId, monto_apertura || 0, notas || null]
    );

    const sesionNueva = inserted.rows[0];

    // Emitir evento Socket.io
    try {
      const { emitEvent } = require('../src/server/socket');
      emitEvent('caja:abierta', { sesion: sesionNueva, timestamp: new Date().toISOString() });
    } catch (_) {}

    res.status(201).json({
      message: 'Caja abierta exitosamente',
      sesion: sesionNueva
    });
  } catch (err) {
    console.error('Error al abrir caja:', err);
    res.status(500).json({ error: 'Error al abrir caja' });
  }
});

router.post('/cerrar', async (req, res) => {
  try {
    const { monto_cierre_declarado, notas } = req.body;
    const userId = req.user ? req.user.id : (req.body.usuario_id || 1);

    const sessionRes = await db.query(
      `SELECT * FROM sesiones_caja WHERE usuario_id = $1 AND estado = 'abierta' ORDER BY abierta_at DESC LIMIT 1`,
      [userId]
    );

    const session = sessionRes.rows[0];
    if (!session) {
      return res.status(400).json({ error: 'No hay una sesión de caja abierta para cerrar' });
    }

    const statsRes = await db.query(
      `SELECT COALESCE(SUM(total), 0) as efectivo
       FROM facturas
       WHERE sesion_caja_id = $1 AND forma_pago = 'efectivo'`,
      [session.id]
    );
    const ventasEfectivo = parseFloat(statsRes.rows[0]?.efectivo || 0);

    const montoApertura = parseFloat(session.monto_apertura || 0);
    const declared = parseFloat(monto_cierre_declarado || 0);
    const calculated = montoApertura + ventasEfectivo - parseFloat(session.total_devoluciones || 0);
    const diff = declared - calculated;

    const updated = await db.query(
      `UPDATE sesiones_caja
       SET estado = 'cerrada',
           ventas_efectivo = $1,
           total_ventas = $1,
           monto_cierre_declarado = $2,
           monto_cierre_calculado = $3,
           diferencia_caja = $4,
           cerrada_at = NOW(),
           notas = COALESCE($5, notas)
       WHERE id = $6
       RETURNING *`,
      [ventasEfectivo, declared, calculated, diff, notas || null, session.id]
    );

    const sesionCerrada = updated.rows[0];

    // Emitir evento Socket.io
    try {
      const { emitEvent } = require('../src/server/socket');
      emitEvent('caja:cerrada', { sesion: sesionCerrada, timestamp: new Date().toISOString() });
    } catch (_) {}

    res.json({
      message: 'Caja cerrada exitosamente',
      reporte: sesionCerrada
    });
  } catch (err) {
    console.error('Error al cerrar caja:', err);
    res.status(500).json({ error: 'Error al cerrar caja' });
  }
});

const { verifyAuth, requireRole } = require('../middleware/auth');

// Endpoint administrativo para consultar todas las cajas abiertas activas con desglose en tiempo real
router.get('/activas', verifyAuth, requireRole('admin', 'gerente'), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        sc.id,
        sc.usuario_id,
        u.nombre as usuario_nombre,
        u.apellido as usuario_apellido,
        u.email as usuario_email,
        sc.estado,
        sc.monto_apertura,
        sc.abierta_at,
        sc.notas,
        COALESCE(SUM(f.total), 0) as total_ventas,
        COUNT(f.id) as total_facturas,
        COALESCE(SUM(CASE WHEN f.forma_pago = 'efectivo' THEN f.total ELSE 0 END), 0) as ventas_efectivo,
        COALESCE(SUM(CASE WHEN f.forma_pago = 'transferencia' THEN f.total ELSE 0 END), 0) as ventas_transferencia,
        COALESCE(SUM(CASE WHEN f.forma_pago = 'tarjeta' THEN f.total ELSE 0 END), 0) as ventas_tarjeta
      FROM sesiones_caja sc
      JOIN usuarios u ON sc.usuario_id = u.id
      LEFT JOIN facturas f ON f.sesion_caja_id = sc.id
      WHERE sc.estado = 'abierta'
      GROUP BY sc.id, u.id
      ORDER BY sc.abierta_at DESC
    `);

    res.json(result.rows || []);
  } catch (err) {
    console.error('Error al consultar cajas activas:', err);
    res.status(500).json({ error: 'Error al consultar cajas activas' });
  }
});

module.exports = router;
