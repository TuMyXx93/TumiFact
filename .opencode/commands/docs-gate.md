---
description: Valida que documentación y specs acompañen cambios de código
agent: reviewer
---

Ejecuta docs-gate para el conjunto de archivos staged o indicado.

Pasos:
1. Ejecutar `git diff --cached --name-only` o aceptar scope.
2. Si hay cambios en `src/modules`, `src/components`, `packages/*`, verificar existencia de `specs/features/NNN-slug/spec.md` y trazabilidad cuando el cambio es `feat`/`fix`.
3. Verificar que specs `in-progress` referenciadas existan.
4. Fallar si una operación financiera nueva no está documentada.
5. Reportar PASS/WARN/FAIL con lista exacta.