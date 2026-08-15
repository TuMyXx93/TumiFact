const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/movimientos', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT m.*, p.nombre as producto_nombre, p.codigo as producto_codigo
      FROM movimientos_inventario m
      JOIN productos p ON m.producto_id = p.id
      ORDER BY m.created_at DESC
      LIMIT 50
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error al obtener movimientos de inventario:', err);
    res.status(500).json({ error: 'Error al consultar inventario' });
  }
});

router.get('/stock-critico', async (req, res) => {
  try {
    const result = await db.query(`
      SELECT * FROM productos
      WHERE activo = true AND stock_actual <= stock_minimo
      ORDER BY stock_actual ASC
    `);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error al obtener stock crítico:', err);
    res.status(500).json({ error: 'Error al consultar stock crítico' });
  }
});

router.post('/movimientos', async (req, res) => {
  const client = await db.connect();
  try {
    const { producto_id, tipo, cantidad, notas } = req.body;
    if (!producto_id || !tipo || !cantidad) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    await client.query('BEGIN');

    const pRes = await client.query(`SELECT * FROM productos WHERE id = $1 FOR UPDATE`, [producto_id]);
    const prod = pRes.rows[0];
    if (!prod) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Producto no encontrado' });
    }

    const current = parseFloat(prod.stock_actual || 0);
    const cant = parseFloat(cantidad);
    let nuevo = current;

    if (['salida_manual', 'ajuste_negativo', 'perdida'].includes(tipo)) {
      nuevo = Math.max(0, current - cant);
    } else {
      nuevo = current + cant;
    }

    await client.query(`UPDATE productos SET stock_actual = $1, updated_at = NOW() WHERE id = $2`, [nuevo, producto_id]);

    const movRes = await client.query(
      `INSERT INTO movimientos_inventario (
         producto_id, usuario_id, tipo, cantidad, stock_anterior, stock_nuevo, notas
       ) VALUES ($1, 1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [producto_id, tipo, cant, current, nuevo, notas || null]
    );

    await client.query('COMMIT');
    res.status(201).json({
      message: 'Movimiento registrado exitosamente',
      movimiento: movRes.rows[0],
      stock_nuevo: nuevo
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar movimiento:', err);
    res.status(500).json({ error: 'Error al registrar movimiento' });
  } finally {
    client.release();
  }
});

module.exports = router;
