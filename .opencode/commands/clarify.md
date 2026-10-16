---
description: Clarifica ambigüedades, dependencias y edge cases antes del plan
agent: architect
---

Ejecuta clarificación estructurada para la feature **$1**.

Pasos:
1. Lee `specs/features/$1/spec.md`.
2. Genera preguntas agrupadas por:
   - requisitos faltantes
   - dependencias externas
   - edge cases (error, concurrencia, idempotencia, offline, RBAC)
   - criterios de aceptación no verificables
3. Propón respuestas tentativas y deja marcadores `<!-- CLARIFY: ... -->` en la spec.
4. Agrega una sección `## Clarificaciones` con decisiones aceptadas/rechazadas.
5. No cambia `status` por sí solo; recomienda revisión humana.

Contexto adicional: $ARGUMENTS