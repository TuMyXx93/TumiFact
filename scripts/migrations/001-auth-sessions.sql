CREATE TABLE IF NOT EXISTS auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  family_id UUID NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  replaced_by UUID,
  ip_address VARCHAR(64),
  user_agent VARCHAR(512),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS auth_sessions_user_active_idx ON auth_sessions (usuario_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS auth_sessions_family_idx ON auth_sessions (family_id);
