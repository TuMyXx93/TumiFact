# ADR-0001: Adoptar Spec-Driven Development (SDD) spec-anchored para TumiFact

- **Estado:** Propuesta
- **Fecha:** 2026-10-16
- **Autores:** sesión arquitectónica (agente architect + revisión humana solicitada)

## Contexto

TumiFact tiene arquitectura técnica robusta y CI/SAST/SBOM, pero no posee capa de especificación versionada dentro del repo. Las invariantes financieras críticas (idempotencia, atomicidad, stock no negativo, inmutabilidad post-cierre) están implícitas en código y no tienen trazabilidad formal. Por otro lado, el `AGENTS.md` está desactualizado respecto al stack real.

## Decisión

Adoptar SDD nivel **spec-anchored** con gobernanza:

`Constitution (L0) > Steering (L0) > ADR (L1) > Features (L2) > Código`

Artefactos en `specs/`, versionados con el código, con EARS + Gherkin + trazabilidad.

Integración LLM:

- `/specify`, `/clarify`, `/plan`, `/analyze`, `/tasks`, `/implement`.
- Contexto mínimo por tarea.
- TDD desde Gherkin.
- Human-in-the-loop en aprobación.
- Métricas de calidad de spec (EPIC) y memoria Engram.

## Consecuencias

Positivas: trazabilidad requisito → código → test; mejor uso de LLM; onboarding; gates de intención; reducción de drift.  
Negativas: overhead de mantenimiento; costo de bootstrap.  
Riesgo principal: specs obsoletas mitigado con docs-gate y regla same-commit.

## Fuentes claves

- arXiv 2602.00180; Microsoft 2026-06-10; Fowler 2025-10-15; GitHub Spec Kit; Allegro 2026-06-07; arXiv EPIC 2610.07534; SDAD 2608.20341.
- Referencia implementada: `misak-dictionary`.