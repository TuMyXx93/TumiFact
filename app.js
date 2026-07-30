require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');

const app = express();

const createRequiredDirectories = () => {
    const directories = [
        path.join(__dirname, 'public'),
        path.join(__dirname, 'public', 'uploads'),
        path.join(__dirname, 'public', 'css'),
        path.join(__dirname, 'public', 'js')
    ];

    directories.forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
            console.log(`Directorio creado: ${dir}`);
        }
    });
};

createRequiredDirectories();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/clientes');
const facturasRoutes = require('./routes/facturas');
const configuracionRoutes = require('./routes/configuracion');
const ventasRoutes = require('./routes/ventas');

app.get('/', (req, res) => {
    res.render('index');
});

app.use('/productos', productosRoutes);
app.use('/api/productos', productosRoutes);
app.use('/clientes', clientesRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/facturas', facturasRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/configuracion', configuracionRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/ventas', ventasRoutes);

app.get('/productos', async (req, res) => {
    try {
        const db = require('./db');
        const result = await db.query('SELECT * FROM productos ORDER BY nombre');
        const productos = result.rows || [];
        res.render('productos', { productos });
    } catch (error) {
        console.error('Error al obtener productos:', error);
        res.status(500).render('error', { 
            error: {
                message: 'Error al obtener productos',
                stack: process.env.NODE_ENV === 'development' ? error.stack : ''
            }
        });
    }
});

app.use((req, res, next) => {
    console.log('404 - Ruta no encontrada:', req.url);
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        res.status(404).json({ error: 'Ruta no encontrada' });
    } else {
        res.status(404).render('404');
    }
});

app.use((err, req, res, next) => {
    console.error('Error en la aplicación:', err);
    
    if (req.xhr || (req.headers.accept && req.headers.accept.indexOf('json') > -1)) {
        res.status(500).json({ 
            error: 'Error interno del servidor',
            message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
        });
    } else {
        res.status(500).render('error', {
            error: {
                message: 'Error interno del servidor',
                stack: process.env.NODE_ENV === 'development' ? err.stack : ''
            }
        });
    }
});

module.exports = app;
