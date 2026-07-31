# AGENTS.md — TumiFact · Sistema de Facturación Enterprise

> Mantener este archivo compacto. Los detalles de implementación viven en
> `.opencode/agents/`, `.opencode/commands/` y `.opencode/skills/`.

## Project Overview

Sistema de Facturación Enterprise **TumiFact**:

- **Backend actual:** Node.js (v14+ / 20+), Express.js, PostgreSQL 18.4 (Docker)
- **Frontend actual:** EJS Templates + Vanilla JavaScript + CSS
- **Roadmap Frontend:** Migración hacia **Astro Framework** (v5+) + TailwindCSS / React Components
- **Base de Datos:** PostgreSQL 18.4 (`tumifact_db`), Pool de conexiones `pg`, datos binarios `BYTEA` (Logo/QR)

Runtime: Node.js 20+ LTS, ESM/CommonJS, pnpm 10+.

## Global Commands

| Command            | Purpose                                                    |
| ------------------ | ---------------------------------------------------------- |
| `pnpm install`     | Instala dependencias con lockfile estricto                |
| `pnpm dev`         | Inicia servidor en modo desarrollo con nodemon             |
| `pnpm start`       | Inicia servidor en modo producción                         |
| `pnpm test`        | Ejecuta la suite de pruebas unitarias/integración con Jest |
| `pnpm test:coverage` | Genera reporte de cobertura (HTML/lcov/text)              |
| `pnpm test:setup`  | Inicializa y sincroniza esquema en base de datos de test   |
| `pnpm build`       | Genera compilado de producción con pkg                     |

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
- **Hooks & CI:** Validation Gate, Audit, Tests automatizados en GitHub Actions
- **Seguridad:** Encriptación de secrets en `.env`, sanitización con `express-validator`

## Agent Orchestration

### Agentes Especializados (`.opencode/agents/`)

| Agent       | Purpose                                                            |
| ----------- | ------------------------------------------------------------------ |
| `architect` | Mantiene agentes, skills, comandos, estándares y arquitectura Astro|
| `frontend`  | Vistas EJS / Vanilla JS y futura migración a Astro + React/Tailwind|
| `backend`   | Express, PostgreSQL Pool, Transacciones, Middleware, Validaciones  |
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
| `/gen-component` | Genera componente de UI (EJS / Astro)                       |
| `/check-arch`    | Valida reglas de arquitectura y patrones del backend/frontend|
| `/db-migrate`    | Valida o genera scripts SQL para migración de BD            |

### Delegation Rules

0. **Antes de modificar código:** `/version-gate`
1. Frontend & Vistas → `frontend` o `/gen-component`
2. Backend & BD → `backend` o `/gen-api`
3. Revision de calidad → `reviewer` o `/review`
4. Pruebas y cobertura → `tester` o `/gen-test`
5. CI/CD & Infra → `devops`
6. Orquestación y Astro Roadmap → `architect`

## Engram Memory Protocol

### Guardado Proactivo
Guardar descubrimientos técnicos, patrones de facturación o decisiones de arquitectura utilizando la estructura estandarizada de memoria.

### Formato de Guardado
```json
{
  "title": "VERB + WHAT — corto y buscable",
  "type": "decision|architecture|bugfix|pattern|config|discovery|learning",
  "topic_key": "tumifact/billing-engine",
  "content": "**What**: ...\n**Why**: ...\n**Where**: ...\n**Learned**: ..."
}
```

## Astro Frontend Migration Roadmap

- **Fase 1 (Actual):** Estandarización de Backend Express + PostgreSQL + Cobertura + CI/CD en `dev`.
- **Fase 2 (Próxima):** Inicialización de proyecto Astro en subdirectorio / paquete híbrido.
- **Fase 3:** Migración progresiva de plantillas EJS (`views/`) a componentes Astro (`.astro`).
- **Fase 4:** Integración de API REST Express con clientes Astro (SSR / Island Architecture).
