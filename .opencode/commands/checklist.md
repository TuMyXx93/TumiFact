---
description: Genera checklist de calidad de requisitos (unit tests for English)
agent: reviewer
---

Genera una checklist de calidad para la feature **$1**.

Dimensiones:
- Completitud de requisitos y escenarios.
- Claridad y testabilidad.
- Consistencia entre spec/plan/tasks.
- Cobertura de errores, concurrencia, idempotencia, auditoría.
- Seguridad y RBAC.
- Trazabilidad archivos/tests.

Genera `specs/features/$1/checklist.md` con checkboxes accionables y no asume implementación.