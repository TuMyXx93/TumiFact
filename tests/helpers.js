const { Client } = require('pg');

async function truncateAll() {
    const client = new Client({
        user: process.env.DB_USER || 'tumifact_user',
        password: process.env.DB_PASSWORD || 'tumifact_password',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_DATABASE || 'tumifact_test'
    });

    await client.connect();
    try {
        await client.query('TRUNCATE productos, clientes, facturas, detalle_factura, configuracion_impresion RESTART IDENTITY CASCADE');
    } finally {
        await client.end();
    }
}

module.exports = { truncateAll };
