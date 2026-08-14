import dotenv from 'dotenv';
import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import db from './lib/db';

import { productosRouter } from './modules/productos/productos.controller';
import { clientesRouter } from './modules/clientes/clientes.controller';
import { facturasRouter, ventasRouter } from './modules/facturas/facturas.controller';
import { configuracionRouter } from './modules/configuracion/configuracion.controller';

dotenv.config();

const app = express();

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

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'TumiFact Modular Monolith Headless API',
    version: '1.0.0',
    architecture: 'DDD (Domain-Driven Design)',
    status: 'online',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req: Request, res: Response) => {
  const startedAt = Date.now();
  try {
    await Promise.race([
      db.query('SELECT 1 AS ok'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB health timeout')), 1500))
    ]);

    res.status(200).json({
      status: 'connected',
      connected: true,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'disconnected',
      connected: false,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      error: error?.message || 'DB unavailable'
    });
  }
});

// Registrar routers de dominios modulares
app.use('/productos', productosRouter);
app.use('/api/productos', productosRouter);
app.use('/clientes', clientesRouter);
app.use('/api/clientes', clientesRouter);
app.use('/facturas', facturasRouter);
app.use('/api/facturas', facturasRouter);
app.use('/configuracion', configuracionRouter);
app.use('/api/configuracion', configuracionRouter);
app.use('/ventas', ventasRouter);
app.use('/api/ventas', ventasRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error en la aplicación:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
    code: err.code
  });
});

export default app;
