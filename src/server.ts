import dotenv from 'dotenv';
import app from './app';
import db from './lib/db';

dotenv.config();

// Procesar argumentos de línea de comandos
// Soporta: -p <puerto> o --port <puerto>
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
        
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n✓ Servidor API Backend corriendo en http://localhost:${PORT}`);
            console.log('\nRutas de API disponibles:');
            console.log('- GET  /api/productos', '(Catálogo de productos)');
            console.log('- GET  /api/clientes', '(Directorio de clientes)');
            console.log('- POST /api/facturas', '(Generar factura)');
            console.log('- GET  /api/configuracion', '(Configuración de negocio)');
        });

        server.on('error', (error: any) => {
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
