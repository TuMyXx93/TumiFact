const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateProductos } = require('../middleware/validate');

// GET /productos - Obtener catálogo de productos
router.get('/', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT p.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
            FROM productos p
            LEFT JOIN categorias_producto c ON p.categoria_id = c.id
            ORDER BY p.nombre
        `);
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
            SELECT p.*, c.nombre as categoria_nombre, c.tipo as categoria_tipo
            FROM productos p
            LEFT JOIN categorias_producto c ON p.categoria_id = c.id
            WHERE p.nombre ILIKE $1 OR p.codigo ILIKE $2
            ORDER BY p.nombre
            LIMIT 15
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
        const {
            codigo,
            nombre,
            descripcion,
            categoria_id,
            proveedor_id,
            precio_kg,
            precio_unidad,
            precio_libra,
            precio_detal,
            precio_mayorista,
            cantidad_mayorista,
            stock_actual,
            stock_minimo,
            atributos
        } = req.body;

        const result = await db.query(`
            INSERT INTO productos (
                codigo, nombre, descripcion, categoria_id, proveedor_id,
                precio_kg, precio_unidad, precio_libra, precio_detal, precio_mayorista,
                cantidad_mayorista, stock_actual, stock_minimo, atributos
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [
            codigo.trim(),
            nombre.trim(),
            descripcion || null,
            categoria_id || null,
            proveedor_id || null,
            precio_kg || 0,
            precio_unidad || 0,
            precio_libra || 0,
            precio_detal || (precio_unidad || precio_kg || 0),
            precio_mayorista || 0,
            cantidad_mayorista || 10,
            stock_actual || 0,
            stock_minimo || 5,
            JSON.stringify(atributos || {})
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
        const {
            codigo,
            nombre,
            descripcion,
            categoria_id,
            proveedor_id,
            precio_kg,
            precio_unidad,
            precio_libra,
            precio_detal,
            precio_mayorista,
            cantidad_mayorista,
            stock_actual,
            stock_minimo,
            atributos
        } = req.body;
        const id = req.params.id;

        const result = await db.query(`
            UPDATE productos 
            SET codigo = $1, 
                nombre = $2, 
                descripcion = $3,
                categoria_id = $4,
                proveedor_id = $5,
                precio_kg = $6, 
                precio_unidad = $7, 
                precio_libra = $8,
                precio_detal = $9,
                precio_mayorista = $10,
                cantidad_mayorista = $11,
                stock_actual = $12,
                stock_minimo = $13,
                atributos = $14,
                updated_at = NOW()
            WHERE id = $15
            RETURNING *
        `, [
            codigo.trim(),
            nombre.trim(),
            descripcion || null,
            categoria_id || null,
            proveedor_id || null,
            precio_kg || 0,
            precio_unidad || 0,
            precio_libra || 0,
            precio_detal || (precio_unidad || precio_kg || 0),
            precio_mayorista || 0,
            cantidad_mayorista || 10,
            stock_actual || 0,
            stock_minimo || 5,
            JSON.stringify(atributos || {}),
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
