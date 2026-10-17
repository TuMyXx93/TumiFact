---
id: 009-migracion-monorepo-fastify-prisma
version: 0.1.0
status: pending
---

# Tasks — 009 Migración Monorepo Fastify + Prisma

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0010 de migración strangler | todos | pending |
| T-002 | Crear estructura `apps/` y `packages/` | R-001 | pending |
| T-003 | Configurar Turbo, Biome, Husky, commitlint | R-001 | pending |
| T-004 | Crear `apps/api` con Fastify base | R-002 | pending |
| T-005 | Traducir schema Drizzle a Prisma | R-003 | pending |
| T-006 | Generar migración inicial y seed sintético | R-003 | pending |
| T-007 | Implementar auth/RBAC/idempotencia en Fastify | R-002 | pending |
| T-008 | Crear `apps/web` React 19 + Vite | R-005 | pending |
| T-009 | Configurar Playwright E2E | R-006 | pending |
| T-010 | Ejecutar `/analyze`, CI, trazabilidad | todos | pending |

## Notas

- No tocar legacy hasta cutover.
- Migración por módulos.