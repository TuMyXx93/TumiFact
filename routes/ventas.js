const express = require('express');
const router = express.Router();
const db = require('../db');

// Ruta principal de ventas con filtros opcionales por fecha
router.get('/', async (req, res) => {
    try {
        let query = `
            SELECT f.*, c.nombre as cliente_nombre
            FROM facturas f
            JOIN clientes c ON f.cliente_id = c.id
        `;
        const params = [];
        let paramIndex = 1;

        // Aplicar filtros de fecha si existen
        if (req.query.desde && req.query.hasta) {
            query += ` WHERE DATE(f.fecha) BETWEEN $${paramIndex} AND $${paramIndex + 1}`;
            params.push(req.query.desde, req.query.hasta);
            paramIndex += 2;
        }

        // Ordenar por fecha descendente
        query += ` ORDER BY f.fecha DESC`;

        const result = await db.query(query, params);
        res.render('ventas', { ventas: result.rows || [] });
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).send('Error al cargar el historial de ventas');
    }
});

module.exports = router;
