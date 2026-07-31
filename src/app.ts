import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';

dotenv.config();

const app = express();

// Crear directorio de uploads si no existe (almacenamiento temporal previa Fase 4)
const uploadDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/static', express.static(path.join(process.cwd(), 'public')));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// Importar rutas de la API REST
const productosRoutes = require('../routes/productos');
const clientesRoutes = require('../routes/clientes');
const facturasRoutes = require('../routes/facturas');
const configuracionRoutes = require('../routes/configuracion');
const ventasRoutes = require('../routes/ventas');

app.get('/', (req: Request, res: Response) => {
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

// Handling 404 Routes as pure JSON
app.use((req: Request, res: Response) => {
    console.log('404 - Ruta no encontrada:', req.url);
    res.status(404).json({ error: 'Ruta no encontrada' });
});

// Handling Global Internal Errors as pure JSON
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error en la aplicación:', err);
    res.status(500).json({ 
        error: 'Error interno del servidor',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Error interno'
    });
});

export default app;
