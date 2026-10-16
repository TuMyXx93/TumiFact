---
description: Gate de merge seguro a dev
agent: reviewer
---

Valida merge-gate antes de integrar a `dev`.

Pasos:
1. Verificar rama actual.
2. Ejecutar Biome check (`pnpm exec biome check src/ packages/`).
3. Ejecutar tests (`pnpm test`).
4. Verificar commits `feat`/`fix` con `Refs:` (commitlint).
5. Verificar que specs afectadas no queden en `draft` sin justificación.
6. Reportar PASS/FAIL detallado.