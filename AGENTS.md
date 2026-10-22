# AGENTS.md — TumiFact · POS, Facturación e Inventario

> Archivo raíz compacto. Detalles en `.opencode/{agents,commands}/`, `specs/` y `docs/`.

## Project Overview

TumiFact es un POS y sistema de facturación en **migración activa hacia monorepo** (patrón strangler).

### Stack en producción (legacy, aún activo)

- **Frontend:** Astro 7 SSR + React 19 Islands + Tailwind CSS v4 (`src/`, `src/pages/*.astro`)
- **Backend:** Express 4 REST API + Socket.io + Drizzle ORM + PostgreSQL 18 (`src/modules/`)
- **Datos:** PostgreSQL 18 `tumifact_db`, 22 tablas normalizadas 3NF, binarios `BYTEA`

### Stack destino (nuevo, en construcción)

- **Frontend:** `apps/web` — React 19 + Vite + TanStack Router/Query + Zustand + Tailwind v4
- **Backend:** `apps/api` — Fastify 5 + Prisma 7 + PostgreSQL 18, Clean Architecture
- **Compartido:** `packages/schemas` (Zod), `packages/types`, `packages/discounts` (motor de descuentos puro)
- **Identidad:** `apps/api/src/lib/auth.ts` — actor real derivado del JWT + sesión en BD

Runtime: Node.js 22+ LTS, ESM/TypeScript, pnpm 12.

## Global Commands

### Legacy (producción actual)

| Command              | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `pnpm dev`           | Frontend Astro (`http://localhost:4321`)             |
| `pnpm dev:api`       | API Express + Socket.io (`http://localhost:3000`)    |
| `pnpm build`         | Build de producción de Astro (`/dist`)               |
| `pnpm build:api`     | Build de la API Express (`/dist-api`)                |
| `pnpm start`         | API Express en modo producción                       |
| `pnpm test`          | Suite legacy (Vitest + Supertest, BD `tumifact_test`)|
| `pnpm test:coverage` | Cobertura legacy (gate 55%)                          |

### Nuevo stack

| Command                                    | Purpose                                    |
| ------------------------------------------ | ------------------------------------------ |
| `pnpm --filter @tumifact/api dev`         | API Fastify (`http://localhost:3001`)      |
| `pnpm --filter @tumifact/api test`        | Tests de integración (BD `tumifact_test_api`)|
| `pnpm --filter @tumifact/api build`       | Compilación de la API                      |
| `pnpm --filter @tumifact/web dev`         | Frontend Vite (`http://localhost:5173`)    |
| `pnpm --filter @tumifact/web build`       | Build de producción del frontend           |
| `pnpm --filter @tumifact/discounts test`  | Tests unitarios del motor de descuentos    |
| `pnpm --filter @tumifact/api exec prisma migrate deploy` | Aplica migraciones Prisma |

## Branching & Release Policy

1. Rama de desarrollo: `dev`.
2. Push a `origin dev` solo con CI/CD **100% verde**.
3. `main` solo recibe merges revisados de `dev`.

## Quality Baseline

- **Testing:** Vitest + Supertest. Legacy en `tumifact_test`; nuevo stack en `tumifact_test_api` (bases aisladas).
- **Cobertura:** gate 55% en legacy; el nuevo stack exige sus propios tests, sin cobertura global todavía.
- **Hooks & CI:** Biome, Husky (lint-staged + commitlint), Vitest, Semgrep SAST, TruffleHog, SBOM, build de ambos stacks.
- **Seguridad:** Argon2id, JWT + sesión revocable en BD, RBAC por permisos, idempotencia UUID, `.env` fuera de git, MCP sin credenciales en claro.
- **Specs:** SDD spec-anchored en `specs/`. Toda feature requiere spec antes de código. `feat`/`fix` con `Refs: specs/features/NNN-slug`.
- **Gate de identidad:** CI falla si reintroduce `usuario_id: 1` hardcodeado en `apps/api`.

## Agent Orchestration

### Agentes (`.opencode/agents/`)

| Agent       | Purpose                                                        |
| ----------- | -------------------------------------------------------------- |
| `architect` | Arquitectura, SDD, agentes, comandos y roadmap de migración     |
| `frontend`  | React 19 / Astro / Tailwind v4, islands y design system        |
| `backend`   | Fastify / Express, Prisma / Drizzle, transacciones y tiempo real|
| `reviewer`  | Read-only: calidad, seguridad, arquitectura y performance        |
| `tester`    | Vitest, integración, Playwright y cobertura                     |
| `devops`    | CI/CD, Docker, migraciones, releases                            |

### Commands (`.opencode/commands/`)

**Ciclo SDD**

| Command        | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `/specify`     | Genera `spec.md` (EARS + Gherkin)                     |
| `/clarify`     | Resuelve ambigüedades antes del plan                  |
| `/plan`        | Genera `plan.md` + ADRs desde una spec aprobada       |
| `/analyze`     | Detecta inconsistencias spec/plan/tasks                |
| `/tasks`       | Descompone el plan en tareas atómicas                  |
| `/checklist`   | Checklist de calidad de requisitos                    |

**Gates y operación**

| Command        | Purpose                                              |
| -------------- | ---------------------------------------------------- |
| `/version-gate`| Gate previo a modificar código                        |
| `/docs-gate`   | Verifica que el cambio viene con su spec              |
| `/merge-gate`  | Gate previo a integrar a `dev`                        |
| `/review`      | Code review del scope indicado                        |
| `/gen-api`     | Genera endpoint + contrato                            |
| `/gen-test`    | Genera pruebas del módulo                             |

> Los comandos de SDD solo avanzan si la spec está `approved` (Constitución P4.1).

### Delegation Rules

0. Antes de modificar código: `/version-gate`.
1. Especificación nueva → `/specify` → `/clarify` → revisión humana.
2. Diseño → `/plan` → `/analyze` → `/tasks`.
3. Frontend → `frontend`. Backend/BD → `backend`. Calidad → `reviewer`. Pruebas → `tester`. CI/infra → `devops`. Orquestación → `architect`.
4. Implementación por tarea, con contexto mínimo (spec + tarea).

## Engram Memory Protocol

La memoria del proyecto vive en **Engram** (proyecto `tumifact`), no en archivos locales.

| Acción                | Cuándo                                                       |
| --------------------- | ------------------------------------------------------------ |
| `mem_context`         | Inicio de sesión o tras compaction                            |
| `mem_search`          | Falta contexto; búsqueda proactiva                            |
| `mem_save`            | Inmediatamente tras decisión, bugfix o descubrimiento         |
| `mem_session_summary` | **Obligatorio antes de cerrar la sesión**                     |
| `mem_judge`           | Resolver conflictos detectados tras `mem_save`                |

Formato: `What / Why / Where / Learned` con `topic_key` estable.

## Estado de la migración (Fastify + Prisma)

- Completado: estructura monorepo, tooling, schema Prisma (22 modelos) + migraciones, seed, auth con identidad real, catálogo, ventas con stock e idempotencia, inventario, caja, clientes, separados, reportes, devoluciones y cambios, motor de descuentos, auditoría y tiempo real.
- Pendiente: configuración, categorías, proveedores, descuentos (CRUD), empleados (UI), impresión de tiquete y DIAN.
- Detalle: `docs/architecture/migration-status.md` y `specs/`.
