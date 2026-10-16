# Features — Plantilla y flujo SDD para TumiFact

Cada feature vive en `specs/features/NNN-slug/`.

Template spec.md:

```markdown
---
id: NNN-slug
version: 0.1.0
status: draft
type: brownfield
risk: medium
financial-impact: false
---

# NNN — <Título>

## Contexto

## Requisitos (EARS)

- **R-001** — CUANDO <evento>, EL SISTEMA DEBERÁ <respuesta medible>.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: ...
  Dado ...
  Cuando ...
  Entonces ...
```

## Fuera de alcance

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
```

Flujo: `/specify` → `/clarify` → `approved` → `/plan` → `/analyze` → `/tasks` → `/implement` → gates → archive.