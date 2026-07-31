const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateClientes } = require('../middleware/validate');

// GET /clientes - Obtener lista de clientes
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clientes ORDER BY nombre');
        const clientes = result.rows || [];
        res.json(clientes);
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).json({
            error: 'Error al obtener clientes',
            message: process.env.NODE_ENV === 'development' ? error.message : ''
        });
    }
});

// GET /clientes/buscar - Buscar clientes
router.get('/buscar', async (req, res) => {
    try {
        const query = req.query.q || '';
        const searchTerm = `%${query}%`;
        const sql = `
            SELECT * FROM clientes 
            WHERE nombre ILIKE $1 OR telefono ILIKE $2 OR direccion ILIKE $3
            ORDER BY nombre
            LIMIT 10
        `;
        const result = await db.query(sql, [searchTerm, searchTerm, searchTerm]);
        res.json(result.rows || []);
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({ error: 'Error al buscar clientes' });
    }
});

// GET /clientes/:id - Obtener cliente por ID
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clientes WHERE id = $1', [req.params.id]);
        const cliente = result.rows[0];
        if (!cliente) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(cliente);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({ error: 'Error al obtener cliente' });
    }
});

// POST /clientes - Crear nuevo cliente
router.post('/', validateClientes, async (req, res) => {
    try {
        const { nombre, direccion, telefono } = req.body;

        const result = await db.query(`
            INSERT INTO clientes (nombre, direccion, telefono)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [
            nombre.trim(),
            direccion ? direccion.trim() : null,
            telefono ? telefono.trim() : null
        ]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// PUT /clientes/:id - Actualizar cliente
router.put('/:id', validateClientes, async (req, res) => {
    try {
        const { nombre, direccion, telefono } = req.body;
        const id = req.params.id;

        const result = await db.query(`
            UPDATE clientes
            SET nombre = $1, direccion = $2, telefono = $3
            WHERE id = $4
            RETURNING *
        `, [
            nombre.trim(),
            direccion ? direccion.trim() : null,
            telefono ? telefono.trim() : null,
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// DELETE /clientes/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.query('DELETE FROM clientes WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ message: 'Cliente eliminado exitosamente', id: parseInt(id, 10) });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene facturas asociadas' });
        }
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

module.exports = router;
