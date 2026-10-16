---
description: Analiza consistencia, cobertura y claridad entre spec, plan y tasks
agent: architect
---

Analiza la feature **$1** (spec/plan/tasks) para detectar desalineación.

Pasos:
1. Verifica que cada `R-NNN` tenga al menos un scenario Gherkin.
2. Verifica que cada tarea referencie un `R-NNN` válido.
3. Detecta requisitos sin tarea, tareas sin requisito, cambios de archivo sin REQ.
4. Detecta huecos: concurrencia, idempotencia, transacciones, auditoría, RBAC, offline.
5. Señala sobrediseño u omisiones técnicas.
6. Produce resumen con bloqueadores y warnings; no modifica archivos automáticamente salvo si se solicita.

Contexto adicional: $ARGUMENTS