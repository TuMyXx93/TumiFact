# Runbook de Operaciones — TumiFact 🛠️

> **Status**: ✅ Producción | v2.0.0

Guías y procedimientos operacionales para DevOps, soporte y administración del sistema.

---

## 📋 Índice de Procedimientos

1. **Gestión de Base de Datos PostgreSQL en Docker**
   - Iniciar/detener contenedor: `docker-compose up -d` / `docker-compose down`.
   - Respaldos con `pg_dump`: `docker exec -t tumifact_db pg_dump -U tumifact_user tumifact_db > backup_$(date +%F).sql`.
   - Restauración de datos: `cat backup.sql | docker exec -i tumifact_db psql -U tumifact_user -d tumifact_db`.

2. **Ejecución y Semilla de Datos**
   - Migración del esquema 3NF y creación de usuarios demo: `pnpm tsx scripts/migrate-and-seed-v2.ts`.

3. **Monitoreo de Servicios**
   - Healthcheck de Base de Datos: `GET http://localhost:3000/api/health/db`.
   - Estado del servidor API: `GET http://localhost:3000/`.
