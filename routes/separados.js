const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const estado = req.query.estado;
    let query = `
      SELECT s.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.telefono as cliente_telefono
      FROM separados s
      JOIN clientes c ON s.cliente_id = c.id
    `;
    const params = [];
    if (estado) {
      query += ` WHERE s.estado = $1`;
      params.push(estado);
    }
    query += ` ORDER BY s.created_at DESC`;

    const result = await db.query(query, params);
    res.json(result.rows || []);
  } catch (err) {
    console.error('Error al listar separados:', err);
    res.status(500).json({ error: 'Error al consultar separados' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const sepRes = await db.query(
      `SELECT s.*, c.nombre as cliente_nombre, c.apellido as cliente_apellido, c.telefono as cliente_telefono
       FROM separados s
       JOIN clientes c ON s.cliente_id = c.id
       WHERE s.id = $1`,
      [id]
    );

    const separado = sepRes.rows[0];
    if (!separado) {
      return res.status(404).json({ error: 'Separado no encontrado' });
    }

    const prodsRes = await db.query(
      `SELECT sp.*, p.nombre as producto_nombre, p.codigo as producto_codigo
       FROM separados_productos sp
       JOIN productos p ON sp.producto_id = p.id
       WHERE sp.separado_id = $1`,
      [id]
    );

    const abonosRes = await db.query(
      `SELECT * FROM abonos_separado WHERE separado_id = $1 ORDER BY numero_abono ASC`,
      [id]
    );

    res.json({
      ...separado,
      productos: prodsRes.rows || [],
      abonos: abonosRes.rows || []
    });
  } catch (err) {
    console.error('Error al consultar detalle de separado:', err);
    res.status(500).json({ error: 'Error al consultar separado' });
  }
});

router.post('/', async (req, res) => {
  const client = await db.connect();
  try {
    const { cliente_id, descripcion, valor_total, abono_inicial, dias_plazo, productos: prods } = req.body;

    if (!cliente_id || !descripcion || !valor_total || !abono_inicial || !prods || prods.length === 0) {
      return res.status(400).json({ error: 'Faltan campos requeridos para el separado' });
    }

    await client.query('BEGIN');

    const total = parseFloat(valor_total);
    const abono = parseFloat(abono_inicial);
    const saldo = total - abono;
    const dias = dias_plazo || 30;
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + dias);
    const fechaLimiteStr = fechaLimite.toISOString().split('T')[0];

    const sepRes = await client.query(
      `INSERT INTO separados (
         cliente_id, usuario_apertura_id, descripcion, valor_total,
         abono_inicial, total_abonado, saldo_pendiente, dias_plazo,
         fecha_limite, estado
       ) VALUES ($1, 1, $2, $3, $4, $4, $5, $6, $7, 'activo')
       RETURNING *`,
      [cliente_id, descripcion, total, abono, saldo, dias, fechaLimiteStr]
    );

    const newSep = sepRes.rows[0];

    for (const p of prods) {
      await client.query(
        `INSERT INTO separados_productos (separado_id, producto_id, cantidad, precio_unitario, subtotal)
         VALUES ($1, $2, $3, $4, $5)`,
        [newSep.id, p.producto_id, p.cantidad, p.precio_unitario, p.subtotal || p.cantidad * p.precio_unitario]
      );
    }

    await client.query(
      `INSERT INTO abonos_separado (separado_id, usuario_id, numero_abono, monto, forma_pago, es_abono_final)
       VALUES ($1, 1, 1, $2, 'efectivo', $3)`,
      [newSep.id, abono, saldo <= 0]
    );

    await client.query('COMMIT');

    // Emitir evento Socket.io
    try {
      const { emitEvent } = require('../src/server/socket');
      emitEvent('separado:creado', {
        id: newSep.id,
        cliente_id,
        total,
        abono,
        saldo,
        timestamp: new Date().toISOString()
      });
    } catch (_) {}

    res.status(201).json({
      message: 'Separado creado exitosamente',
      separado: newSep
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear separado:', err);
    res.status(500).json({ error: 'Error al crear separado' });
  } finally {
    client.release();
  }
});

router.post('/:id/abonos', async (req, res) => {
  const client = await db.connect();
  try {
    const id = parseInt(req.params.id, 10);
    const { monto, forma_pago } = req.body;

    if (!monto || parseFloat(monto) <= 0) {
      return res.status(400).json({ error: 'El monto a abonar debe ser mayor a 0' });
    }

    await client.query('BEGIN');

    const sepRes = await client.query(`SELECT * FROM separados WHERE id = $1 FOR UPDATE`, [id]);
    const sep = sepRes.rows[0];

    if (!sep) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Separado no encontrado' });
    }

    if (sep.estado !== 'activo') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'El separado no está activo' });
    }

    const montoAbono = parseFloat(monto);
    const prevAbonado = parseFloat(sep.total_abonado);
    const valorTotal = parseFloat(sep.valor_total);
    const newTotalAbonado = prevAbonado + montoAbono;
    const newSaldo = Math.max(0, valorTotal - newTotalAbonado);
    const isCompleted = newSaldo <= 0.01;

    const countRes = await client.query(`SELECT COUNT(*) as count FROM abonos_separado WHERE separado_id = $1`, [id]);
    const nextNum = parseInt(countRes.rows[0].count, 10) + 1;

    const abonoRes = await client.query(
      `INSERT INTO abonos_separado (separado_id, usuario_id, numero_abono, monto, forma_pago, es_abono_final)
       VALUES ($1, 1, $2, $3, $4, $5)
       RETURNING *`,
      [id, nextNum, montoAbono, forma_pago || 'efectivo', isCompleted]
    );

    await client.query(
      `UPDATE separados
       SET total_abonado = $1, saldo_pendiente = $2, estado = $3, updated_at = NOW()
       WHERE id = $4`,
      [newTotalAbonado, newSaldo, isCompleted ? 'completado' : 'activo', id]
    );

    await client.query('COMMIT');

    // Emitir evento Socket.io
    try {
      const { emitEvent } = require('../src/server/socket');
      emitEvent('separado:abono', {
        separado_id: id,
        monto: montoAbono,
        forma_pago: forma_pago || 'efectivo',
        completado: isCompleted,
        saldo_pendiente: newSaldo,
        timestamp: new Date().toISOString()
      });
    } catch (_) {}

    res.status(201).json({
      message: isCompleted ? 'Separado completado en su totalidad' : 'Abono registrado exitosamente',
      abono: abonoRes.rows[0],
      completado: isCompleted
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar abono:', err);
    res.status(500).json({ error: 'Error al registrar abono' });
  } finally {
    client.release();
  }
});

module.exports = router;
