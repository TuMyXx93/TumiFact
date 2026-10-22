# ADR-0020: Identidad Real en el Nuevo Stack

- **Estado:** Aceptada (implementada)
- **Fecha:** 2026-10-22

## Contexto

El nuevo stack (Fastify + Prisma) tenía módulos de ventas, inventario, caja, clientes, separados, reportes y devoluciones, pero **sin gestión de usuarios**: el `usuario_id` estaba hardcodeado en `1` en 18 puntos.

Consecuencias:

1. La trazabilidad de auditoría era ficticia: todo se atribuía al mismo usuario.
2. El multi-cajero era imposible: dos terminales eran indistinguibles.
3. El RBAC no tenía catálogo de roles ni usuarios que lo respaldaran.
4. `POST /customers` no registraba quién creó el cliente.

## Decisión

1. **`getActor(request)` es la única fuente de identidad.** Ningún módulo puede inventar un `usuario_id`.
2. **`requireActor(request)`** lanza 401 si no hay actor; se usa tras `authenticate`, donde la sesión ya fue validada.
3. **Sesión persistida en `auth_sessions`** (hash SHA-256 del token, nunca el JWT en claro) → permite revocación inmediata.
4. **`jti` único por token** (`randomUUID`): sin él, dos sesiones emitidas en el mismo segundo producen el mismo JWT (mismo `iat`) y colisionan en el índice único de `token_hash`.
5. **Roles canónicos**: `admin`, `gerente`, `empleado`, sembrados por el seed.
6. **Desactivar un empleado revoca sus sesiones** vivas.
7. **Todo 403 queda auditado** como `ACCESO_DENEGADO` con método, ruta y rol.
8. **`password_hash` nunca sale del servidor**: proyecciones `select` explícitas, nunca `findMany` sin filtro.

## Alternativas consideradas

- **Token stateless sin sesión en BD** (rechazada): no permite revocar al desactivar un empleado sin esperar al vencimiento del token.
- **Cookie HttpOnly** (rechazada por ahora): requiere overhaul de CORS/CSRF; el nuevo stack usa `Authorization: Bearer` con token en `sessionStorage` + `localStorage`.

## Consecuencias

**Positivas:** auditoría real, multi-cajero, RBAC funcional, revocación inmediata, trazabilidad de accesos denegados.

**Negativas:** dos consultas a BD por request autenticado (sesión + usuario). Aceptable para un POS; si el volumen lo exige, cachear el actor con TTL corto.

**Riesgos:**tokens emitidos antes del despliegue pierden sesión en BD y requieren re-login. Mitigable con backfill de sesiones.

## Cumplimiento

- R-001..R-008 → `apps/api/src/lib/auth.ts`, `apps/api/src/modules/employees/*`, `apps/api/src/modules/auth/*`
- Criterio verificable: `grep -rn "usuario_id: 1" apps/api/src | grep -v /test/` → vacío.
