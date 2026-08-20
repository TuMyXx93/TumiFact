import { pgTable, uuid, integer, varchar, timestamp } from 'drizzle-orm/pg-core';
import { usuarios } from './usuarios';

export const authSessions = pgTable('auth_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  usuario_id: integer('usuario_id').references(() => usuarios.id, { onDelete: 'cascade' }).notNull(),
  token_hash: varchar('token_hash', { length: 64 }).notNull().unique(),
  family_id: uuid('family_id').notNull(),
  expires_at: timestamp('expires_at').notNull(),
  revoked_at: timestamp('revoked_at'),
  replaced_by: uuid('replaced_by'),
  ip_address: varchar('ip_address', { length: 64 }),
  user_agent: varchar('user_agent', { length: 512 }),
  created_at: timestamp('created_at').defaultNow().notNull(),
  last_used_at: timestamp('last_used_at')
});
