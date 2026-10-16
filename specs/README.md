# Specs — Especificaciones de TumiFact

Fuente de verdad de requisitos, diseño y tareas. Versionada con el código.

Leer primero [`constitution.md`](./constitution.md).

## Estructura

```text
specs/
├── constitution.md      # L0 — Invariantes no negociables
├── steering/            # L0 — Contexto técnico estable
│   ├── tech-stack.md
│   ├── conventions.md
│   ├── glossary.md
│   └── shared-technical-spec.md
├── adr/                 # L1 — Decisiones arquitectónicas (Nygard)
├── features/            # L2 — Especificaciones activas
└── archive/             # Specs cerradas (regresión perpetua)
```

## Ciclo de vida

```text
/version-gate → /specify → spec.md (EARS + Gherkin)
  ↓ revisión humana
/plan → plan.md + ADRs
  ↓ /analyze
/tasks → tasks.md atómicas
  ↓ /implement por tarea (contexto mínimo)
gates: docs-gate → tests → lint → build → merge-gate → PR a dev
  ↓
cierre: spec → archive/ + mem_session_summary
```

## Estados

`draft → review → approved → in-progress → done → archived`

## Reglas

1. Toda feature nueva requiere spec activa antes de código (Constitución F/ C4.1).
2. Commits `feat`/`fix` referencian `Refs: specs/features/NNN-slug`.
3. La spec se actualiza en el mismo commit que el código que cambia un requisito.
4. Specs implementadas se archivan con sus criterios Gherkin como regresión.
