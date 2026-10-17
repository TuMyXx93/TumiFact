# Plan Técnico — 009 Migración Monorepo Fastify + Prisma

## Diseño

- Crear monorepo con `apps/web`, `apps/api`, `packages/schemas`, `packages/types`.
- Migrar backend a Fastify con Clean Architecture.
- Traducir schema Drizzle a Prisma y generar migración inicial.
- Mantener Express legacy en paralelo hasta cutover.
- Exponer `/api/v1`.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| Raíz | `pnpm-workspace.yaml`, `turbo.json`, scripts | R-001 |
| `apps/api` | Fastify + Prisma + módulos | R-002, R-003 |
| `apps/web` | React 19 + Vite + TanStack | R-005 |
| `packages/*` | Zod/Types compartidos | R-001 |
| CI/CD | pipelines por workspace | R-006 |

## Decisiones

- ADR-0010: Migración strangler pattern.
  1. No big-bang.
  2. Legacy coexiste.
  3. Nuevas features solo en nuevo stack.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Ruptura de build | CI por workspace |
| Pérdida de datos | DB descartable |
| Doble mantenimiento | cutover por módulo |

## Condición

Spec aprobada. Generar tasks y luego implementar por tarea.