import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema';

const pool = new pg.Pool({
  user: process.env.DB_USER || 'tumifact_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_DATABASE || 'tumifact_db',
  password: process.env.DB_PASSWORD || 'tumifact_password',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });
export { pool };
export default db;
