const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupTestDatabase() {
    const adminConfig = {
        user: process.env.DB_USER || 'fruver_user',
        password: process.env.DB_PASSWORD || 'fruver_password',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: 'postgres'
    };

    const testConfig = {
        ...adminConfig,
        database: 'ecl_fruver_test'
    };

    const adminClient = new Client(adminConfig);
    await adminClient.connect();
    try {
        await adminClient.query('CREATE DATABASE ecl_fruver_test');
        console.log('✓ Base de datos ecl_fruver_test creada');
    } catch (err) {
        if (err.code === '42P04') {
            console.log('ℹ Base de datos ecl_fruver_test ya existe');
        } else {
            throw err;
        }
    } finally {
        await adminClient.end();
    }

    const sqlPath = path.join(__dirname, '..', 'database_pg.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const testClient = new Client(testConfig);
    await testClient.connect();
    try {
        await testClient.query(sql);
        console.log('✓ Schema ejecutado en ecl_fruver_test');
    } finally {
        await testClient.end();
    }
}

module.exports = setupTestDatabase;

if (require.main === module) {
    setupTestDatabase()
        .then(() => {
            console.log('Setup de BD de test completado');
            process.exit(0);
        })
        .catch(err => {
            console.error('Error en setup de BD de test:', err);
            process.exit(1);
        });
}
