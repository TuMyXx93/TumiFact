---
description: Genera el plan técnico (plan.md) a partir de una spec aprobada
agent: architect
---

Genera `plan.md` de la feature **$1** (formato `NNN-slug`) para TumiFact.

Pasos:
1. Lee `specs/features/$1/spec.md`.
2. Si `status != approved`, detente y solicita aprobación.
3. Lee steering y AGENTS.md (stack real Astro/React/Express/Drizzle/Vitest).
4. Genera secciones:
   - `## Diseño` (módulos, contratos, datos)
   - `## Cambios por archivo` (tabla `Archivo | Cambio | Requisito`)
   - `## Contratos de UI/API` (props React islands, schemas Zod, OpenAPI, respuestas Socket.io)
   - `## Decisiones tomadas` (ADRs)
   - `## Riesgos y mitigación`
5. No incluir código de implementación; solo diseño y contratos.
6. Para features con impacto financiero, detalla transacciones Drizzle, idempotency key y audit log.

Contexto adicional: $ARGUMENTS