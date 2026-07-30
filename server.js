require('dotenv').config();
const app = require('./app');
const db = require('./db');

const PORT = process.env.PORT || 3002;

async function startServer() {
    try {
        console.log('Intentando conectar a la base de datos...');
        const result = await db.query('SELECT NOW()');
        console.log('✓ Conexión exitosa a PostgreSQL');
        console.log(`  Base de datos: ${process.env.DB_DATABASE || 'ecl_fruver'}`);
        console.log(`  Host: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}`);
        
        const server = app.listen(PORT, 'localhost', () => {
            console.log(`\n✓ Servidor corriendo en http://localhost:${PORT}`);
            console.log('\nRutas disponibles:');
            console.log('- GET  /', '(Página principal)');
            console.log('- POST /api/facturas', '(Generar factura)');
            console.log('- GET  /api/facturas/:id/imprimir', '(Imprimir factura)');
        });

        server.on('error', (error) => {
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
