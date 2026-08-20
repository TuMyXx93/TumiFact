import dotenv from 'dotenv';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { pool } from './db';

import { authRouter } from './modules/auth/auth.controller';
import { productosRouter } from './modules/productos/productos.controller';
import { clientesRouter } from './modules/clientes/clientes.controller';
import { facturasRouter, ventasRouter } from './modules/facturas/facturas.controller';
import { configuracionRouter } from './modules/configuracion/configuracion.controller';
import { cajaRouter } from './modules/caja/caja.controller';
import { empleadosRouter } from './modules/empleados/empleados.controller';
import { categoriasRouter } from './modules/categorias/categorias.controller';
import { proveedoresRouter } from './modules/proveedores/proveedores.controller';
import { inventarioRouter } from './modules/inventario/inventario.controller';
import { descuentosRouter } from './modules/descuentos/descuentos.controller';
import { separadosRouter } from './modules/separados/separados.controller';
import { devolucionesRouter } from './modules/devoluciones/devoluciones.controller';
import { reportesRouter } from './modules/reportes/reportes.controller';
import { isAllowedOrigin } from './config/security';
import { correlationId } from './shared/middleware/correlation';
import { requestLogging } from './shared/middleware/request-logging';

dotenv.config();

const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());
app.use(correlationId);
app.use(requestLogging);

app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));
app.get('/ready', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready', correlationId: req.correlationId });
  } catch {
    res.status(503).json({ status: 'not_ready', correlationId: req.correlationId });
  }
});

app.use('/static', express.static(path.join(process.cwd(), 'public')));
app.use(express.static(path.join(process.cwd(), 'public')));

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Idempotency-Key');
  if (req.method === 'OPTIONS') {
    if (origin && !isAllowedOrigin(origin)) return res.sendStatus(403);
    return res.sendStatus(200);
  }
  next();
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'TumiFact Modular Monolith Headless API v2.0',
    version: '2.0.0',
    architecture: 'DDD (Domain-Driven Design) + Hexagonal',
    status: 'online',
    correlationId: req.correlationId,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health/db', async (req: Request, res: Response) => {
  const startedAt = Date.now();
  try {
    await Promise.race([
      pool.query('SELECT 1 AS ok'),
      new Promise((_, reject) => setTimeout(() => reject(new Error('DB health timeout')), 1500))
    ]);

    res.status(200).json({
      status: 'connected',
      connected: true,
      latencyMs: Date.now() - startedAt,
      correlationId: req.correlationId,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(503).json({
      status: 'disconnected',
      connected: false,
      latencyMs: Date.now() - startedAt,
      timestamp: new Date().toISOString(),
      correlationId: req.correlationId,
      error: error?.message || 'DB unavailable'
    });
  }
});

// Registrar routers de dominios modulares
app.use('/auth', authRouter);
app.use('/api/auth', authRouter);

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

app.use('/caja', cajaRouter);
app.use('/api/caja', cajaRouter);

app.use('/empleados', empleadosRouter);
app.use('/api/empleados', empleadosRouter);

app.use('/categorias', categoriasRouter);
app.use('/api/categorias', categoriasRouter);

app.use('/proveedores', proveedoresRouter);
app.use('/api/proveedores', proveedoresRouter);

app.use('/inventario', inventarioRouter);
app.use('/api/inventario', inventarioRouter);

app.use('/descuentos', descuentosRouter);
app.use('/api/descuentos', descuentosRouter);

app.use('/separados', separadosRouter);
app.use('/api/separados', separadosRouter);

app.use('/devoluciones', devolucionesRouter);
app.use('/api/devoluciones', devolucionesRouter);

app.use('/reportes', reportesRouter);
app.use('/api/reportes', reportesRouter);

app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada', code: 'NOT_FOUND', correlationId: req.correlationId });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error en la aplicación:', err);
  res.status(err.statusCode || 500).json({
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
    correlationId: req.correlationId
  });
});

export default app;
