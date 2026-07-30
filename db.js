require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
    user: process.env.DB_USER || 'fruver_user',
    password: process.env.DB_PASSWORD || 'fruver_password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE || 'ecl_fruver'
};

const pool = new Pool(dbConfig);

pool.on('error', (err, client) => {
    console.error('❌ Error inesperado en el pool de conexiones:', err);
});

module.exports = pool;
