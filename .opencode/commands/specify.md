---
description: Genera spec.md con requisitos EARS y criterios Gherkin para una feature
agent: architect
---

Genera la especificación (`spec.md`) de la feature **$1** para TumiFact.

Ciclo SDD: `/specify` → `spec.md` (EARS + Gherkin). Ninguna línea de código antes de `approved` (Constitución P4.1).

Pasos:
1. Lee `specs/features/` y calcula el siguiente número `NNN`.
2. Consulta steering: `tech-stack.md`, `conventions.md`, `glossary.md`, `shared-technical-spec.md` si existe.
3. Si la feature toca nombres financieros o políticas RBAC/auditoría, marca `financial-impact: true`.
4. Crea `specs/features/NNN-slug/spec.md` con front-matter `id, version, status, type, risk, financial-impact`.
5. Secciones: Contexto; Requisitos EARS (`R-001`); Criterios Gherkin por requisito; Fuera de alcance; Trazabilidad.
6. Para Features con `financial-impact: true`, incluye escenarios de idempotencia, concurrencia, error y auditoría.
7. Reporta ruta, NNN, risk y financial-impact. Deja en `draft`.

Contexto adicional del usuario: $ARGUMENTS