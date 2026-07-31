import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

const dbConfig = {
    user: process.env.DB_USER || 'tumifact_user',
    password: process.env.DB_PASSWORD || 'tumifact_password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE || 'tumifact_db'
};

const pool = new Pool(dbConfig);

pool.on('error', (err) => {
    console.error('❌ Error inesperado en el pool de conexiones:', err);
});

export default pool;
