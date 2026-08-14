# AGENTS.md — TumiFact · Sistema de Facturación

> Mantener este archivo compacto. Los detalles de implementación viven en
> `.opencode/agents/`, `.opencode/commands/` y `.opencode/skills/`.

## Project Overview

Sistema de Facturación **TumiFact**:

- **Backend:** Node.js (v20+ / v22+ LTS), Express.js API, PostgreSQL 18.4 (Docker)
- **Frontend:** Astro Framework (v7.1+) + React 19 Islands + Tailwind CSS v4
- **Base de Datos:** PostgreSQL 18.4 (`tumifact_db`), Pool de conexiones `pg`, datos binarios `BYTEA` (Logo/QR)

Runtime: Node.js 22+ LTS, ESM/CommonJS, pnpm 10+/11+.

## Global Commands

| Command            | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `pnpm install`     | Instala dependencias con lockfile estricto                |
| `pnpm dev`         | Inicia servidor frontend Astro (`http://localhost:4321`)   |
| `pnpm dev:api`     | Inicia servidor backend API Express con nodemon (`:3000`)  |
| `pnpm build`       | Genera compilado de producción de Astro (`/dist`)          |
| `pnpm start`       | Inicia servidor backend en modo producción                |
| `pnpm test`        | Ejecuta la suite de pruebas unitarias/integración con Jest |
| `pnpm test:coverage` | Genera reporte de cobertura (mínimo 40% requerido)        |

## Branching & Release Policy

1. **Rama Predeterminada de Desarrollo:** `dev`
2. **Flujo de Trabajo:**
   - Todos los cambios, integraciones y funciones se desarrollan y prueban en la rama `dev`.
   - Se realiza `git push origin dev` y se valida que la CI/CD esté **100% en verde**.
   - Tras revisión y aprobación, se realiza la integración limpia (PR / merge) hacia `main`.
3. **Producción:** La rama `main` refleja únicamente código probado, estable y desplegable.

## Quality Baseline

- **Testing:** Jest + Supertest (`/tests`)
- **Coverage Minimum:** 40% inicial (meta gradual 70%+ en refactorización a Astro)
- **Hooks & CI:** Validation Gate, Audit, Tests automatizados y Astro Build en GitHub Actions
- **Seguridad:** Encriptación de secrets en `.env`, sanitización con `express-validator`

## Agent Orchestration

### Agentes Especializados (`.opencode/agents/`)

| Agent       | Purpose                                                            |
| ----------- | ------------------------------------------------------------------ |
| `architect` | Mantiene agentes, skills, comandos, estándares y arquitectura Astro|
| `frontend`  | Componentes Astro (`.astro`), React 19 Islands y Tailwind CSS v4   |
| `backend`   | Express API, PostgreSQL Pool, Transacciones, Middleware           |
| `reviewer`  | Read-only: calidad de código, arquitectura, seguridad y performance|
| `tester`    | Jest / Supertest: pruebas unitarias, integración y cobertura       |
| `devops`    | CI/CD GitHub Actions, Docker Compose, versión, scripts de despliegue|

### Commands (`.opencode/commands/`)

| Command          | Purpose                                                     |
| ---------------- | ----------------------------------------------------------- |
| `/version-gate`  | Gate de seguridad y compatibilidad pre-tarea                |
| `/review`        | Code review del scope indicado                              |
| `/gen-test`      | Genera pruebas unitarias/integración para el módulo          |
| `/gen-api`       | Genera nuevo endpoint Express + PostgreSQL                  |
| `/gen-component` | Genera componente de UI (Astro / React Island)              |
| `/check-arch`    | Valida reglas de arquitectura y patrones del backend/frontend|
| `/db-migrate`    | Valida o genera scripts SQL para migración de BD            |

### Delegation Rules

0. **Antes de modificar código:** `/version-gate`
1. Frontend & Vistas → `frontend` o `/gen-component`
2. Backend & BD → `backend` o `/gen-api`
3. Revisión de calidad → `reviewer` o `/review`
4. Pruebas y cobertura → `tester` o `/gen-test`
5. CI/CD & Infra → `devops`
6. Orquestación y Astro Roadmap → `architect`

## Engram Memory Protocol

### Guardado Proactivo
Guardar descubrimientos técnicos, patrones de facturación o decisiones de arquitectura utilizando la estructura estandarizada de memoria en `.opencode/memory/`.

### Formato de Guardado
```json
{
  "title": "VERB + WHAT — corto y buscable",
  "type": "decision|architecture|bugfix|pattern|config|discovery|learning",
  "topic_key": "tumifact/billing-engine",
  "content": "**What**: ...\n**Why**: ...\n**Where**: ...\n**Learned**: ..."
}
```

## Astro Frontend Migration Roadmap — ✅ 100% COMPLETADA

- [x] **Fase 1:** Inicialización de Astro v7.1+ & Configuración del Entorno Node.js (COMPLETADA).
- [x] **Fase 2:** Layouts & Páginas Base `.astro` (COMPLETADA).
- [x] **Fase 3:** Construcción de React 19 Islands (`BillingPOS`, `ProductGrid`, `ClientManager`) (COMPLETADA).
- [x] **Fase 4:** SSR Data Loading & Vista de Impresión Térmica con Decodificación de Binarios `BYTEA` (COMPLETADA).
- [x] **Fase 5:** Pruebas, Cobertura, CI/CD Pipeline & Deploy Producción (COMPLETADA).
