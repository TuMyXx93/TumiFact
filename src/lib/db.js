// SSR pages and the modular API share the same Drizzle-owned PostgreSQL pool.
// This prevents two independent pools from observing different connection state.
import { pool } from '../db/index.ts';

export const db = pool;
export { pool };
export default pool;
