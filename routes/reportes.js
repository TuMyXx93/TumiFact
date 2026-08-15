const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');

router.get('/ventas', async (req, res) => {
  try {
    const format = (req.query.format || 'json').toLowerCase();
    const result = await db.query(`
      SELECT f.*, c.nombre as cliente_nombre
      FROM facturas f
      LEFT JOIN clientes c ON f.cliente_id = c.id
      ORDER BY f.fecha DESC
    `);

    const data = result.rows || [];

    if (format === 'csv') {
      const headers = ['ID', 'Fecha', 'Cliente', 'Forma Pago', 'Total', 'Estado'];
      const rows = data.map((f) => [
        f.id,
        f.fecha ? new Date(f.fecha).toISOString() : '',
        `"${f.cliente_nombre || 'Cliente General'}"`,
        f.forma_pago,
        f.total,
        f.estado || 'completada'
      ]);
      const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="ventas.csv"');
      return res.send(csv);
    }

    if (format === 'pdf') {
      const doc = new PDFDocument({ margin: 36 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="ventas.pdf"');
      doc.pipe(res);

      doc.fontSize(16).text('REPORTE DE VENTAS TUMIFACT', { align: 'center' });
      doc.moveDown();
      doc.fontSize(10).text(`Total Registros: ${data.length}`);
      doc.moveDown();

      data.forEach((f) => {
        doc.fontSize(9).text(`#${f.id} - ${new Date(f.fecha).toLocaleDateString()} - $${f.total} - ${f.forma_pago}`);
      });

      doc.end();
      return;
    }

    res.json(data);
  } catch (err) {
    console.error('Error al generar reporte de ventas:', err);
    res.status(500).json({ error: 'Error al generar reporte' });
  }
});

router.get('/inventario', async (req, res) => {
  try {
    const result = await db.query(`SELECT * FROM productos WHERE activo = true ORDER BY nombre ASC`);
    const data = result.rows || [];

    const headers = ['ID', 'Código', 'Nombre', 'Precio Detal', 'Stock Actual', 'Stock Mínimo'];
    const rows = data.map((p) => [
      p.id,
      `"${p.codigo}"`,
      `"${p.nombre}"`,
      p.precio_detal || p.precio_unidad,
      p.stock_actual,
      p.stock_minimo
    ]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="inventario.csv"');
    res.send(csv);
  } catch (err) {
    console.error('Error al exportar inventario:', err);
    res.status(500).json({ error: 'Error al exportar inventario' });
  }
});

module.exports = router;
