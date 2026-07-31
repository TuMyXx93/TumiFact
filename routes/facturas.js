const express = require('express');
const router = express.Router();
const db = require('../db');
const { validateFacturas } = require('../middleware/validate');

// Crear nueva factura
router.post('/', validateFacturas, async (req, res) => {
    const { cliente_id, total, forma_pago, productos } = req.body;

    console.log('Datos recibidos:', req.body);

    if (!cliente_id || !productos || productos.length === 0) {
        return res.status(400).json({ error: 'Datos incompletos' });
    }

    const client = await db.connect();

    try {
        await client.query('BEGIN');

        const facturaResult = await client.query(
            'INSERT INTO facturas (cliente_id, total, forma_pago) VALUES ($1, $2, $3) RETURNING id',
            [cliente_id, 0, forma_pago || 'efectivo']
        );

        const factura_id = facturaResult.rows[0].id;

        let total_calculado = 0;

        for (const p of productos) {
            const precio_unitario = parseFloat(p.precio);
            const cantidad = parseFloat(p.cantidad);
            const subtotal = Math.round(cantidad * precio_unitario * 100) / 100;

            total_calculado = Math.round((total_calculado + subtotal) * 100) / 100;

            await client.query(
                'INSERT INTO detalle_factura (factura_id, producto_id, cantidad, precio_unitario, unidad_medida, subtotal) VALUES ($1, $2, $3, $4, $5, $6)',
                [factura_id, p.producto_id, cantidad, precio_unitario, p.unidad || 'KG', subtotal]
            );
        }

        if (total !== undefined && total !== null) {
            const diff = Math.abs(parseFloat(total) - total_calculado);
            if (diff > 0.01) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Total manipulado', total_enviado: total, total_calculado });
            }
        }

        await client.query(
            'UPDATE facturas SET total = $1 WHERE id = $2',
            [total_calculado, factura_id]
        );

        await client.query('COMMIT');

        res.status(201).json({ id: factura_id });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al crear factura:', error);
        res.status(500).json({ error: 'Error al crear factura' });
    } finally {
        client.release();
    }
});

// Vista previa e impresión de factura
router.get('/:id/imprimir', async (req, res) => {
    const factura_id = req.params.id;

    try {
        // Obtener configuración
        const configResult = await db.query(
            'SELECT * FROM configuracion_impresion LIMIT 1'
        );

        if (!configResult || configResult.rows.length === 0) {
            return res.status(400).json({ error: 'No se ha configurado la información de impresión' });
        }

        const config = configResult.rows[0];

        // Convertir imágenes a formato data URL si existen
        if (config.logo_data) {
            const logoBuffer = Buffer.isBuffer(config.logo_data) ? config.logo_data : Buffer.from(config.logo_data);
            config.logo_src = `data:image/${config.logo_tipo};base64,${logoBuffer.toString('base64')}`;
        }
        if (config.qr_data) {
            const qrBuffer = Buffer.isBuffer(config.qr_data) ? config.qr_data : Buffer.from(config.qr_data);
            config.qr_src = `data:image/${config.qr_tipo};base64,${qrBuffer.toString('base64')}`;
        }

        // Obtener datos de la factura
        const facturasResult = await db.query(
            `SELECT f.*, c.nombre as cliente_nombre, c.direccion, c.telefono
             FROM facturas f
             JOIN clientes c ON f.cliente_id = c.id
             WHERE f.id = $1`,
            [factura_id]
        );

        if (!facturasResult || facturasResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        // Obtener detalles de la factura
        const detallesResult = await db.query(
            `SELECT d.*, p.nombre as producto_nombre
             FROM detalle_factura d
             JOIN productos p ON d.producto_id = p.id
             WHERE d.factura_id = $1`,
            [factura_id]
        );

        if (!detallesResult || detallesResult.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontraron detalles de la factura' });
        }

        res.json({
            factura: facturasResult.rows[0],
            detalles: detallesResult.rows,
            config: config
        });

    } catch (error) {
        console.error('Error al obtener datos de factura:', error);
        res.status(500).json({ error: 'Error al obtener datos de factura' });
    }
});

// Ruta para obtener detalles de una factura
router.get('/:id/detalles', async (req, res) => {
    try {
        // Obtener información de la factura
        const facturasResult = await db.query(
            'SELECT f.*, c.nombre as cliente_nombre, c.direccion, c.telefono FROM facturas f ' +
            'JOIN clientes c ON f.cliente_id = c.id ' +
            'WHERE f.id = $1',
            [req.params.id]
        );

        if (facturasResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const factura = facturasResult.rows[0];

        // Obtener productos de la factura
        const productosResult = await db.query(
            'SELECT d.cantidad, d.precio_unitario, d.unidad_medida, d.subtotal, p.nombre ' +
            'FROM detalle_factura d ' +
            'JOIN productos p ON d.producto_id = p.id ' +
            'WHERE d.factura_id = $1',
            [req.params.id]
        );

        // Estructurar la respuesta asegurando que los valores numéricos sean válidos
        res.json({
            factura: {
                id: factura.id,
                fecha: factura.fecha,
                total: parseFloat(factura.total || 0),
                forma_pago: factura.forma_pago
            },
            cliente: {
                nombre: factura.cliente_nombre || '',
                direccion: factura.direccion || '',
                telefono: factura.telefono || ''
            },
            productos: productosResult.rows.map(p => ({
                nombre: p.nombre || '',
                cantidad: parseFloat(p.cantidad || 0),
                unidad: p.unidad_medida || '',
                precio: parseFloat(p.precio_unitario || 0),
                subtotal: parseFloat(p.subtotal || 0)
            }))
        });
    } catch (error) {
        console.error('Error al obtener detalles de la factura:', error);
        res.status(500).json({ error: 'Error al obtener detalles de la factura' });
    }
});

module.exports = router;
