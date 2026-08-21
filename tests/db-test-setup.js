const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setupTestDatabase() {
    const adminConfig = {
        user: process.env.DB_USER || 'tumifact_user',
        password: process.env.DB_PASSWORD || 'tumifact_password',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: 'postgres'
    };

    const testConfig = {
        ...adminConfig,
        database: 'tumifact_test'
    };

    const adminClient = new Client(adminConfig);
    await adminClient.connect();
    try {
        await adminClient.query('CREATE DATABASE tumifact_test');
        console.log('✓ Base de datos tumifact_test creada');
    } catch (err) {
        if (err.code === '42P04') {
            console.log('ℹ Base de datos tumifact_test ya existe');
        } else {
            throw err;
        }
    } finally {
        await adminClient.end();
    }

    // Fase 0.1: fuente única es Drizzle (22 tablas + migraciones). database_pg.sql está archivado (19 tablas sin auth_sessions)
    const drizzleDir = path.join(__dirname, '..', 'drizzle');
    const sqlPath = path.join(__dirname, '..', 'database_pg.sql');
    let sqlFiles = [];
    if (fs.existsSync(drizzleDir)) {
        sqlFiles = fs.readdirSync(drizzleDir).filter(f => f.endsWith('.sql')).sort().map(f => path.join(drizzleDir, f));
        console.log(`✓ Usando ${sqlFiles.length} migraciones Drizzle en ${drizzleDir}`);
    }

    const testClient = new Client(testConfig);
    await testClient.connect();
    try {
        await testClient.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
        if (sqlFiles.length > 0) {
            for (const file of sqlFiles) {
                const sql = fs.readFileSync(file, 'utf8');
                await testClient.query(sql);
                console.log(`✓ Migración aplicada: ${path.basename(file)}`);
            }
        } else {
            const sql = fs.readFileSync(sqlPath, 'utf8');
            await testClient.query(sql);
            console.log('✓ Schema ejecutado en tumifact_test (database_pg.sql)');
        }
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
