---
id: tech-stack
version: 1.0.0
status: active
---

# Steering — Stack Tecnológico (TumiFact)

**Última verificación:** 2026-10-16.

## Frontend

| Componente | Versión / Uso |
| --- | --- |
| Astro | ^7.3 (SSR, islands) |
| React | ^19.2 (islands interactivas) |
| Tailwind CSS | ^4.3 (`@tailwindcss/vite`) |
| TypeScript | ^7.0 estricto |
| Vitest | ^4.1 testing |

## Backend / API

| Componente | Versión / Uso |
| --- | --- |
| Node.js | >=22 <25 LTS |
| Express.js | ^4.22 REST API |
| Socket.io | ^4.8 tiempo real |
| Drizzle ORM | ^0.45 |
| PostgreSQL | 18.x Docker |
| Zod | ^4.5 DTOs |
| Argon2 | ^0.45 hashing |

## Tooling

Biome ^2.5, Husky, commitlint, pnpm, tsup/tsx, Supertest, Redis 8 (cache/offline queue).

## Límites

- Frontend no accede a PostgreSQL directamente.
- Backend no renderiza UI.
- React/Drizzle/HTTP contract único por módulo (`controller → service → repository`).
- Ninguna dependencia nueva de runtime sin ADR.