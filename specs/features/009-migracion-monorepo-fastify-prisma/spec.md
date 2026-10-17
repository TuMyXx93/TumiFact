---
id: 009-migracion-monorepo-fastify-prisma
version: 0.1.0
status: approved
type: greenfield
risk: high
financial-impact: true
---

# 009 — Migración a Monorepo Fastify + Prisma

## Contexto

TumiFact actualmente es un monolito con Astro/Express/Drizzle. Se aprobó migrar a un monorepo con Fastify 5, Prisma 7 y React 19 + Vite, manteniendo dominio, seguridad e idempotencia.

## Requisitos (EARS)

- **R-001** — CUANDO se crea la estructura monorepo, EL SISTEMA DEBERÁ separar `apps/web`, `apps/api`, `packages/schemas` y `packages/types` sin romper el build actual.
- **R-002** — CUANDO se migra el backend, EL SISTEMA DEBERÁ exponer `/api/v1` con auth, RBAC, idempotencia y auditoría equivalentes.
- **R-003** — CUANDO se migra el ORM, EL SISTEMA DEBERÁ generar migraciones Prisma desde el schema actual sin pérdida de datos.
- **R-004** — MIENTRAS coexisten legacy y nuevo stack, EL SISTEMA NO DEBERÁ perder trazabilidad ni duplicar datos.
- **R-005** — CUANDO se migra frontend, EL SISTEMA DEBERÁ consumir `/api/v1` y mantener flujos POS, inventario, caja, clientes e historial.
- **R-006** — CUANDO se retira legacy, EL SISTEMA DEBERÁ contar con pruebas E2E y rollback por módulo.

## Fuera de alcance

- Emisión DIAN real.
- Reescritura total en un solo release.

## Criterios de aceptación (Gherkin)

### R-002

```gherkin
Escenario: Login en nuevo backend
  Dado un usuario válido
  Cuando llama POST /api/v1/auth/login
  Entonces responde 200 con token y rol
```

### R-003

```gherkin
Escenario: Migración de schema sin pérdida
  Dado el schema Drizzle actual
  Cuando se genera la migración Prisma inicial
  Entonces todas las tablas y constraints críticos existen
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `package.json`, `pnpm-workspace.yaml`, `apps/*` | CI build |
| R-002 | `apps/api/src/modules/auth/*` | tests auth |
| R-003 | `apps/api/prisma/schema.prisma` | migración |
| R-004 | scripts de migración | integration |
| R-005 | `apps/web/src/features/*` | E2E |
| R-006 | CI/CD, Playwright | E2E |