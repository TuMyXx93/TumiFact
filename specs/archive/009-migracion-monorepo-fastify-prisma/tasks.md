---
id: 009-migracion-monorepo-fastify-prisma
version: 0.1.0
status: pending
---

# Tasks — 009 Migración Monorepo Fastify + Prisma

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | Crear ADR-0010 de migración strangler | todos | done |
| T-002 | Crear estructura `apps/` y `packages/` | R-001 | done |
| T-003 | Configurar Turbo, Biome, Husky, commitlint | R-001 | done |
| T-004 | Crear `apps/api` con Fastify base | R-002 | done |
| T-005 | Traducir schema Drizzle a Prisma | R-003 | done (introspection 22 modelos) |
| T-006 | Generar migración inicial y seed sintético | R-003 | done |
| T-007 | Implementar auth/RBAC/idempotencia en Fastify | R-002 | done (auth + JWT + argon2 + seed validado) |
| T-008 | Crear `apps/web` React 19 + Vite | R-005 | done |
| T-009 | Configurar Playwright E2E | R-006 | done |
| T-010 | Ejecutar `/analyze`, CI, trazabilidad | todos | done |

## Notas

- No tocar legacy hasta cutover.
- Migración por módulos.