# Plan Migración SERIAL → IDENTITY — Fase 4.4 (Pospuesto)

**Estado:** PLANIFICADO — No aplicado en `drizzle/0000_baseline.sql`. Baseline actual usa `SERIAL` (legacy PG 9). Migración a `GENERATED ALWAYS AS IDENTITY` es `SQL:2003` standard desde PG 10, sin cambio de tipo ni FKs.

**Por qué posponer UUIDv7:** `UUIDv7` time-ordered es óptimo para multi-sucursal distribuido y offline replay, pero exige `ALTER TYPE UUID` en 22 tablas + FKs + Drizzle `uuid` + reindex. Riesgo alto para 1 sucursal. Se evaluará en Q2 2027 si se activa multi-sede.

**Alcance IDENTITY (cuando se active):**
```sql
-- Ejemplo para una tabla — repetir para las 22
ALTER TABLE tipos_identificacion ALTER COLUMN id SET DATA TYPE INT GENERATED ALWAYS AS IDENTITY;
-- Para bigserial: movimientos_inventario.id BIGSERIAL → BIGINT GENERATED ALWAYS AS IDENTITY
ALTER TABLE movimientos_inventario ALTER COLUMN id SET DATA TYPE BIGINT GENERATED ALWAYS AS IDENTITY;
```

**Verificación:**
```bash
pnpm drizzle-kit generate --name identity
# revisar drizzle/0001_identity.sql — debe contener ALTER COLUMN ... ADD GENERATED ALWAYS AS IDENTITY
pnpm drizzle-kit push --force
psql -c "\d tipos_identificacion" | grep "GENERATED"
```

**Rollback:** `ALTER TABLE ... ALTER COLUMN id DROP IDENTITY;`

**Gate:** Solo cuando `vitest` cubra 55% y no haya caja abierta (requiere ACCESS EXCLUSIVE).
