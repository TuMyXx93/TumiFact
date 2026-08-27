import dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

export default defineConfig({
  schema: './src/db/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    user: process.env.DB_USER || 'tumifact_user',
    password: process.env.DB_PASSWORD || 'tumifact_password',
    database: process.env.DB_DATABASE || 'tumifact_db',
    ssl: false,
  },
});
