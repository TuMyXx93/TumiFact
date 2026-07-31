const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateProductos } = require('../middleware/validate');

// GET /productos - Obtener catálogo de productos
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM productos ORDER BY nombre');
        const productos = result.rows || [];
        res.json(productos);
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).json({ 
            error: 'Error al obtener productos',
            message: process.env.NODE_ENV === 'development' ? error.message : ''
        });
    }
});

// GET /productos/buscar - Buscar productos
router.get('/buscar', async (req, res) => {
    try {
        const query = req.query.q || '';
        const searchTerm = `%${query}%`;
        const sql = `
            SELECT * FROM productos 
            WHERE nombre ILIKE $1 OR codigo ILIKE $2
            ORDER BY nombre
            LIMIT 10
        `;
        const result = await db.query(sql, [searchTerm, searchTerm]);
        res.json(result.rows || []);
    } catch (error) {
        console.error('Error al buscar productos:', error);
        res.status(500).json({ error: 'Error al buscar productos' });
    }
});

// GET /productos/:id - Obtener un producto específico
router.get('/:id', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM productos WHERE id = $1', [req.params.id]);
        const producto = result.rows[0];
        if (!producto) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }
        res.json(producto);
    } catch (error) {
        console.error('Error al obtener producto:', error);
        res.status(500).json({ error: 'Error al obtener producto' });
    }
});

// POST /productos - Crear nuevo producto
router.post('/', validateProductos, async (req, res) => {
    try {
        const { codigo, nombre, precio_kg, precio_unidad, precio_libra } = req.body;

        const result = await db.query(`
            INSERT INTO productos (codigo, nombre, precio_kg, precio_unidad, precio_libra)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
        `, [
            codigo.trim(), 
            nombre.trim(), 
            precio_kg || 0, 
            precio_unidad || 0, 
            precio_libra || 0
        ]);

        const productoCreado = result.rows[0];
        res.status(201).json({
            message: 'Producto creado exitosamente',
            ...productoCreado
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un producto con ese código' });
        }
        res.status(500).json({ error: 'Error al crear producto' });
    }
});

// PUT /productos/:id - Actualizar producto
router.put('/:id', validateProductos, async (req, res) => {
    try {
        const { codigo, nombre, precio_kg, precio_unidad, precio_libra } = req.body;
        const id = req.params.id;

        const result = await db.query(`
            UPDATE productos 
            SET codigo = $1, nombre = $2, precio_kg = $3, precio_unidad = $4, precio_libra = $5
            WHERE id = $6
            RETURNING *
        `, [
            codigo.trim(), 
            nombre.trim(), 
            precio_kg || 0, 
            precio_unidad || 0, 
            precio_libra || 0, 
            id
        ]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({
            message: 'Producto actualizado exitosamente',
            ...result.rows[0]
        });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un producto con ese código' });
        }
        res.status(500).json({ error: 'Error al actualizar producto' });
    }
});

// DELETE /productos/:id - Eliminar producto
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.query('DELETE FROM productos WHERE id = $1 RETURNING id', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado exitosamente', id: parseInt(id, 10) });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        if (error.code === '23503') {
            return res.status(400).json({ error: 'No se puede eliminar el producto porque está referenciado en facturas' });
        }
        res.status(500).json({ error: 'Error al eliminar producto' });
    }
});

module.exports = router;
