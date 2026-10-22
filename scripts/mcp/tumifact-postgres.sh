#!/bin/sh
# Wrapper del MCP de PostgreSQL para TumiFact.
#
# La URL de conexión NO se versiona: se construye a partir del .env local
# (ignorado por git). Evita filtrar credenciales del motor en el repositorio.
set -e

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/../.." && pwd)
ENV_FILE="$ROOT_DIR/.env"

if [ ! -f "$ENV_FILE" ]; then
  echo "Falta $ENV_FILE: no se puede iniciar el MCP de PostgreSQL." >&2
  exit 1
fi

# Carga solo las variables necesarias (formato KEY=VALUE).
for key in DB_HOST DB_PORT DB_USER DB_PASSWORD DB_DATABASE; do
  value=$(sed -n "s/^${key}=//p" "$ENV_FILE" | tail -n 1)
  eval "${key}=\${value:-}"
done

DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}
DB_USER=${DB_USER:-tumifact_user}
DB_PASSWORD=${DB_PASSWORD:-tumifact_password}
DB_DATABASE=${DB_DATABASE:-tumifact_db}

exec npx -y @modelcontextprotocol/server-postgres \
  "postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_DATABASE}"
