require('dotenv').config();
const express = require('express');
const path = require('path');

const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/clientes');
const facturasRoutes = require('./routes/facturas');
const configuracionRoutes = require('./routes/configuracion');
const ventasRoutes = require('./routes/ventas');

const app = express();

app.use(express.json({ limit: '50mb' }));
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

app.get('/', (req, res) => {
    res.json({
        name: 'TumiFact Enterprise Headless API REST',
        version: '1.0.0',
        status: 'online',
        timestamp: new Date().toISOString()
    });
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

app.use((req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({ 
        error: err.message || 'Error interno del servidor'
    });
});

module.exports = app;
