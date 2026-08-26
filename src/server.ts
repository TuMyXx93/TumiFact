import closeWithGrace from 'close-with-grace';
import dotenv from 'dotenv';
import http from 'http';
import { closeRedis, initRedis } from './config/redis';
import { pool } from './db';
import { closeSchedulerWorker, initSchedulerWorker } from './jobs';
import { logger } from './lib/logger';
import { closeSchedulerQueue, initSchedulerQueue } from './lib/queue/scheduler.queue';
import { initSocketIO } from './server/socket';

dotenv.config();

let PORT = parseInt(process.env.PORT || '3000', 10);
const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if ((args[i] === '-p' || args[i] === '--port') && i + 1 < args.length) {
    const portArg = parseInt(args[i + 1], 10);
    if (!isNaN(portArg)) {
      PORT = portArg;
    }
  }
}

let httpServer: http.Server | null = null;
let app: typeof import('./app').default;

async function startServer(): Promise<void> {
  try {
    logger.info('Intentando conectar a la base de datos...');
    await pool.query('SELECT NOW()');
    await initRedis();
    // Cargar los middlewares después de validar Redis para que RedisStore no
    // inicialice scripts contra un cliente todavía desconectado.
    ({ default: app } = await import('./app'));
    logger.info(
      {
        database: process.env.DB_DATABASE || 'tumifact_db',
        host: process.env.DB_HOST || 'localhost',
      },
      '✓ Conexión exitosa a PostgreSQL + Redis'
    );

    httpServer = http.createServer(app);
    initSocketIO(httpServer);

    // Scheduler BullMQ (audit, separados vencidos, stock crítico) — Fase 4.1
    if (process.env.NODE_ENV !== 'test') {
      try {
        await initSchedulerQueue();
        await initSchedulerWorker();
        logger.info(
          'Scheduler BullMQ iniciado (audit-archiver, separados-vencidos, stock-critico)'
        );
      } catch (err) {
        logger.error(
          { err: (err as Error).message },
          'Error iniciando scheduler — continuando sin jobs'
        );
      }
    }

    httpServer.listen(PORT, '0.0.0.0', () => {
      logger.info(`\n✓ Servidor API Backend con Socket.io corriendo en http://localhost:${PORT}`);
      console.log('\nRutas de API v2 disponibles:');
      console.log('- POST /api/auth/login', '(Inicio de sesión dual)');
      console.log('- GET  /api/productos', '(Catálogo con categorías y mayorista)');
      console.log('- GET  /api/clientes', '(Directorio normalizado 3NF)');
      console.log('- POST /api/facturas', '(Facturación POS con descuentos e idempotencia)');
      console.log('- GET  /api/caja/estado', '(Sesiones de caja por empleado)');
      console.log('- GET  /api/separados', '(Sistema de Separados y Abonos)');
      console.log('- GET  /api/inventario/movimientos', '(Control de inventario y stock)');
      console.log('- GET  /api/reportes/ventas', '(Exportación PDF/CSV)');
    });

    httpServer.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`El puerto ${PORT} está en uso. Intenta con otro puerto.`);
      } else {
        logger.error({ err: error }, 'Error al iniciar el servidor');
      }
      process.exit(1);
    });

    // Graceful shutdown con close-with-grace (10s) — Fase 4.1
    closeWithGrace(
      { delay: Number(process.env.SHUTDOWN_DELAY_MS) || 10000 },
      async ({ signal, err }) => {
        if (err) logger.error({ err }, 'Shutdown por error');
        logger.info({ signal }, '⏳ Graceful shutdown iniciado...');
        if (httpServer) await new Promise<void>((resolve) => httpServer!.close(() => resolve()));
        await Promise.allSettled([
          closeSchedulerWorker(),
          closeSchedulerQueue(),
          closeRedis(),
          pool.end(),
        ]);
        logger.info('✅ Shutdown completo');
      }
    );
  } catch (err) {
    logger.error({ err: (err as Error).message }, 'Error al conectar a la base de datos');
    process.exit(1);
  }
}

startServer();
