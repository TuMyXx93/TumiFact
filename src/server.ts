import http from 'http';
import dotenv from 'dotenv';
import app from './app';
import db from './lib/db';
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

async function startServer(): Promise<void> {
  try {
    console.log('Intentando conectar a la base de datos...');
    await db.query('SELECT NOW()');
    console.log('✓ Conexión exitosa a PostgreSQL');
    console.log(`  Base de datos: ${process.env.DB_DATABASE || 'tumifact_db'}`);
    console.log(`  Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);

    const httpServer = http.createServer(app);
    initSocketIO(httpServer);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`\n✓ Servidor API Backend con Socket.io corriendo en http://localhost:${PORT}`);
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
        console.error(`El puerto ${PORT} está en uso. Intenta con otro puerto.`);
      } else {
        console.error('Error al iniciar el servidor:', error);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
}

process.on('SIGTERM', () => {
  console.log('Recibida señal SIGTERM. Cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Recibida señal SIGINT. Cerrando servidor...');
  process.exit(0);
});

startServer();
