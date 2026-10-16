---
id: conventions
version: 1.0.0
status: active
---

# Steering — Convenciones (TumiFact)

## Código

- Biome exclusivo para formato/lint.
- Named exports por defecto; constantes `UPPER_SNAKE_CASE`.
- Identificadores en inglés; copy/tests/docs/commits en español.
- Componentes React 19 con props interface `NombreProps`.
- Hooks `useX` camelCase con cleanup.
- Tailwind v4 tokens, mobile-first.
- Backend: Express routing → controller → service → repository; Drizzle solo infrastructure; errores tipados.
- Validación Zod en boundary HTTP.
- Moneda en 2 decimales en boundary API/DB.

## Testing

- Vitest + Supertest.
- Tests por módulo en `tests/[modulo].test.ts`.
- Arrange/Act/Assert; mocks solo en fronteras externas.
- BD de test dedicada (`tumifact_test`), setup/limpieza por suite.
- Tests críticos: happy path, error, idempotencia, concurrencia si aplica.

## Proceso

- Commits Conventional Commits.
- Ramas `feat/*|fix/*` desde `dev`; PR a `dev`; `main` solo merges controlados.
- Gates: `/version-gate` → `/docs-gate` → tests → `/merge-gate`.
- `feat`/`fix` requieren `Refs: specs/features/NNN-slug`.
- Memoria: decisión/bug/patrón → `mem_save`; cierre → `mem_session_summary`.

## LLM

- Contexto mínimo por tarea (spec + una tarea + archivos relevantes).
- Revisión en sesión limpia antes de merge.
- Actualizar spec cuando código cambie requisito.