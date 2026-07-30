const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');

// Configuración de multer para memoria
// Nota: Multer 2.x mantiene compatibilidad con memoryStorage()
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: function (req, file, cb) {
        // Validar tipo de archivo
        const allowedMimes = ['image/jpeg', 'image/png', 'image/gif'];
        
        if (!allowedMimes.includes(file.mimetype)) {
            return cb(new Error('Solo se permiten imágenes (JPG, PNG, GIF)'));
        }
        
        // Validar extensión del archivo
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
            // Crear configuración inicial
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

// Verificar configuración al iniciar
verificarConfiguracion();

// Obtener configuración
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM configuracion_impresion LIMIT 1');
        const config = result.rows;
        
        // Si solicita JSON (API), devolver datos sin imágenes binarias
        if (req.headers.accept && req.headers.accept.includes('application/json')) {
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
            return res.json(configJSON);
        }

        // Si solicita HTML (navegador), renderizar vista
        if (!config || config.length === 0) {
            return res.render('configuracion', { 
                config: {
                    nombre_negocio: '',
                    direccion: '',
                    telefono: '',
                    nit: '',
                    pie_pagina: '',
                    ancho_papel: 80,
                    font_size: 1
                }
            });
        }

        const configSinImagenes = { ...config[0] };
        delete configSinImagenes.logo_data;
        delete configSinImagenes.qr_data;

        res.render('configuracion', { config: configSinImagenes });
    } catch (error) {
        console.error('Error al obtener configuración:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
});

// Guardar configuración
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

        // Validar que el nombre del negocio sea requerido
        if (!nombre_negocio || nombre_negocio.trim() === '') {
            return res.status(400).json({ error: 'El nombre del negocio es requerido' });
        }

        const result = await db.query('SELECT * FROM configuracion_impresion LIMIT 1');
        const results = result.rows;

        let values = [
            nombre_negocio,
            direccion || null,
            telefono || null,
            nit || null,
            pie_pagina || null,
            ancho_papel || 80,
            font_size || 1
        ];

        let paramCount = 7; // Comenzamos desde $8

        // Agregar datos de imágenes si se subieron nuevas
        if (req.files?.logo) {
            values.push(req.files.logo[0].buffer);
            values.push(req.files.logo[0].mimetype.split('/')[1]);
            paramCount += 2;
        }
        if (req.files?.qr) {
            values.push(req.files.qr[0].buffer);
            values.push(req.files.qr[0].mimetype.split('/')[1]);
            paramCount += 2;
        }

        if (!results || results.length === 0) {
            // Insertar nueva configuración
            let sql = `
                INSERT INTO configuracion_impresion 
                (nombre_negocio, direccion, telefono, nit, pie_pagina, 
                 ancho_papel, font_size
            `;
            let params = [];
            let paramIndex = 1;
            
            // Construir dinámicamente los parámetros
            sql += `) VALUES ($${paramIndex++}`;
            params.push(nombre_negocio);
            
            for (let i = 1; i < 6; i++) {
                sql += `, $${paramIndex++}`;
                params.push(values[i]);
            }
            
            if (req.files?.logo) {
                sql += ', $' + paramIndex++ + ', $' + paramIndex++;
                params.push(req.files.logo[0].buffer);
                params.push(req.files.logo[0].mimetype.split('/')[1]);
                sql = sql.replace(')', ', logo_data, logo_tipo)');
            }
            if (req.files?.qr) {
                sql += ', $' + paramIndex++ + ', $' + paramIndex++;
                params.push(req.files.qr[0].buffer);
                params.push(req.files.qr[0].mimetype.split('/')[1]);
                if (!req.files?.logo) {
                    sql = sql.replace(')', ', qr_data, qr_tipo)');
                }
            }
            
            sql += ')';
            await db.query(sql, params);
        } else {
            // Actualizar configuración existente
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

        res.redirect('/configuracion');
    } catch (error) {
        console.error('Error en el procesamiento:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Eliminar la ruta de impresoras que no se usa
router.get('/impresoras', (req, res) => {
    res.json([]);
});

// Middleware de manejo de errores de Multer 2.x
// Captura errores específicos de Multer (validación de archivos, límites, etc.)
router.use((err, req, res, next) => {
    // Errores de multer
    if (err instanceof multer.MulterError) {
        console.error('MulterError:', err);
        
        if (err.code === 'FILE_TOO_LARGE') {
            return res.status(413).json({ error: 'El archivo es demasiado grande (máximo 5MB)' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ error: 'Demasiados archivos subidos' });
        }
        
        return res.status(400).json({ error: `Error en la subida: ${err.message}` });
    }
    
    // Errores custom de fileFilter
    if (err) {
        console.error('Upload error:', err);
        return res.status(400).json({ error: err.message || 'Error al procesar el archivo' });
    }
    
    next();
});

module.exports = router; 