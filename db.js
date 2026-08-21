/**
 * @deprecated — 2026-08-21 — Fuente única ahora es src/db/index.ts (Drizzle pool).
 * Este archivo se mantiene solo para compatibilidad de tests legacy (Jest) y scripts.
 * No usar en código nuevo. Ver Fase 1 Strangler.
 * TODO(Fase1): eliminar tras migrar tests a Vitest + src/db.
 */
require('dotenv').config();
const { Pool } = require('pg');

const dbConfig = {
    user: process.env.DB_USER || 'tumifact_user',
    password: process.env.DB_PASSWORD || 'tumifact_password',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_DATABASE || 'tumifact_db'
};

const pool = new Pool(dbConfig);

pool.on('error', (err, client) => {
    console.error('❌ Error inesperado en el pool de conexiones:', err);
});

module.exports = pool;
