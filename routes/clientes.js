const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateClientes } = require('../middleware/validate');

// GET /clientes - Mostrar página de clientes
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM clientes ORDER BY nombre');
        const clientes = result.rows || [];
        res.render('clientes', { clientes });
    } catch (error) {
        console.error('Error al obtener clientes:', error);
        res.status(500).render('error', { 
            error: {
                message: 'Error al obtener clientes',
                stack: error.stack
            }
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
            WHERE nombre ILIKE $1 OR telefono ILIKE $2
            ORDER BY nombre
            LIMIT 10
        `;
        const result = await db.query(sql, [searchTerm, searchTerm]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error al buscar clientes:', error);
        res.status(500).json({ error: 'Error al buscar clientes' });
    }
});

// GET /clientes/:id - Obtener un cliente específico
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
        console.log('Datos recibidos:', req.body);
        const { nombre, direccion, telefono } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await db.query(
            'INSERT INTO clientes (nombre, direccion, telefono) VALUES ($1, $2, $3) RETURNING id',
            [nombre, direccion || null, telefono || null]
        );

        console.log('Cliente creado:', result.rows[0]);

        res.status(201).json({ 
            id: result.rows[0].id,
            message: 'Cliente creado exitosamente' 
        });
    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// PUT /clientes/:id - Actualizar cliente
router.put('/:id', validateClientes, async (req, res) => {
    try {
        const { nombre, direccion, telefono } = req.body;
        
        if (!nombre) {
            return res.status(400).json({ error: 'El nombre es requerido' });
        }

        const result = await db.query(
            'UPDATE clientes SET nombre = $1, direccion = $2, telefono = $3 WHERE id = $4',
            [nombre, direccion || null, telefono || null, req.params.id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ message: 'Cliente actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// DELETE /clientes/:id - Eliminar cliente
router.delete('/:id', async (req, res) => {
    try {
        const result = await db.query('DELETE FROM clientes WHERE id = $1', [req.params.id]);
        
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ message: 'Cliente eliminado exitosamente' });
    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        // PostgreSQL error code para foreign key constraint
        if (error.code === '23503') {
            return res.status(400).json({ error: 'No se puede eliminar el cliente porque tiene facturas asociadas' });
        }
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

module.exports = router;
