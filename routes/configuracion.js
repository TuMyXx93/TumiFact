const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');

// Configuración de multer para memoria
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF)'));
        }
        const validExtensions = /\.(jpg|jpeg|png|gif)$/i;
        if (!file.originalname.match(validExtensions)) {
            return cb(new Error('Extensión de archivo no permitida'));
        }
        cb(null, true);
    },
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

// Función para verificar y crear configuración inicial
async function verificarConfiguracion() {
    try {
        const result = await db.query('SELECT * FROM configuracion_impresion LIMIT 1');
        const config = result.rows;
        
        if (!config || config.length === 0) {
            await db.query(`
                INSERT INTO configuracion_impresion 
                (nombre_negocio, direccion, telefono, pie_pagina) 
                VALUES 
                ($1, $2, $3, $4)
            `, ['Mi Negocio', 'Dirección del Negocio', 'Teléfono', '¡Gracias por su compra!']);
            console.log('✓ Configuración inicial creada');
        }
    } catch (error) {
        console.error('Error al verificar configuración:', error);
    }
}

verificarConfiguracion();

// GET /configuracion - Obtener datos de configuración en JSON
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM configuracion_impresion LIMIT 1');
        const config = result.rows;
        
        if (!config || config.length === 0) {
            return res.json({
                nombre_negocio: '',
                direccion: '',
                telefono: '',
                nit: '',
                pie_pagina: '',
                ancho_papel: 80,
                font_size: 1
            });
        }

        const configJSON = { ...config[0] };
        delete configJSON.logo_data;
        delete configJSON.qr_data;
        res.json(configJSON);
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// POST /configuracion - Guardar configuración
router.post('/', upload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'qr', maxCount: 1 }
]), async (req, res) => {
    try {
        const {
            nombre_negocio,
            direccion,
            telefono,
            nit,
            pie_pagina,
            ancho_papel,
            font_size
        } = req.body;

        if (!nombre_negocio || nombre_negocio.trim() === '') {
            return res.status(400).json({ error: 'El nombre del negocio es requerido' });
        }

        const result = await db.query('SELECT * FROM configuracion_impresion LIMIT 1');
        const results = result.rows;

        const values = [
            nombre_negocio.trim(),
            direccion ? direccion.trim() : null,
            telefono ? telefono.trim() : null,
            nit ? nit.trim() : null,
            pie_pagina ? pie_pagina.trim() : null,
            parseInt(ancho_papel, 10) || 80,
            parseInt(font_size, 10) || 1
        ];

        if (results.length === 0) {
            let sql = `
                INSERT INTO configuracion_impresion 
                (nombre_negocio, direccion, telefono, nit, pie_pagina, ancho_papel, font_size
            `;
            let params = values;
            let paramIndex = 8;
            
            if (req.files?.logo) {
                sql += ', logo_data, logo_tipo';
                params.push(req.files.logo[0].buffer);
                params.push(req.files.logo[0].mimetype.split('/')[1]);
                paramIndex += 2;
            }
            if (req.files?.qr) {
                sql += ', qr_data, qr_tipo';
                params.push(req.files.qr[0].buffer);
                params.push(req.files.qr[0].mimetype.split('/')[1]);
                paramIndex += 2;
            }
            
            sql += ') VALUES ($1, $2, $3, $4, $5, $6, $7';
            if (req.files?.logo) {
                sql += ', $8, $9';
            }
            if (req.files?.qr) {
                sql += ', $' + (req.files?.logo ? '10, $11' : '8, $9');
            }
            sql += ')';
            await db.query(sql, params);
        } else {
            let sql = `
                UPDATE configuracion_impresion 
                SET nombre_negocio = $1, direccion = $2, telefono = $3, nit = $4,
                    pie_pagina = $5, ancho_papel = $6, font_size = $7
            `;
            let params = values.slice(0, 7);
            let paramIndex = 8;
            
            if (req.files?.logo) {
                sql += `, logo_data = $${paramIndex++}, logo_tipo = $${paramIndex++}`;
                params.push(req.files.logo[0].buffer);
                params.push(req.files.logo[0].mimetype.split('/')[1]);
            }
            if (req.files?.qr) {
                sql += `, qr_data = $${paramIndex++}, qr_tipo = $${paramIndex++}`;
                params.push(req.files.qr[0].buffer);
                params.push(req.files.qr[0].mimetype.split('/')[1]);
            }
            
            sql += ` WHERE id = $${paramIndex}`;
            params.push(results[0].id);
            
            await db.query(sql, params);
        }

        res.json({ message: 'Configuración guardada exitosamente' });
    } catch (error) {
        console.error('Error en el procesamiento de configuración:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

router.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'El archivo es demasiado grande (máximo 5MB)' });
        }
        return res.status(400).json({ error: `Error en la subida: ${err.message}` });
    }
    if (err) {
        return res.status(400).json({ error: err.message || 'Error al procesar el archivo' });
    }
    next();
});

module.exports = router;