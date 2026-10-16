---
description: Descompone plan en tareas atómicas trazables (tasks.md)
agent: architect
---

Descompone `tasks.md` para la feature **$1** a partir de spec.md + plan.md.

Pasos:
1. Si falta spec o plan, detente.
2. Genera front-matter (`id`, `version`, `status`) y tabla:

| ID | Tarea | Requisito | Estado |
| --- | --- | --- | --- |
| T-001 | una acción verificable | R-001 | pending |

3. Marca paralelizable con `[P]` cuando no haya dependencia de archivos/estado.
4. Ordena por dependencia: dominio → aplicación → infraestructura → presentación; tests junto a su requisito (TDD desde Gherkin).
5. Una tarea = una invocación de agente con contexto mínimo.
6. Reporta ruta y número total.

Contexto adicional: $ARGUMENTS