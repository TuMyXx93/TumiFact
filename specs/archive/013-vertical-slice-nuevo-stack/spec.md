---
id: 013-vertical-slice-nuevo-stack
version: 0.1.0
status: done
type: greenfield
risk: high
financial-impact: true
---

# 013 — Vertical Slice del Nuevo Stack (Auth + Productos + POS)

## Contexto

Ya existe el skeleton de `apps/api` (Fastify + Prisma) y `apps/web` (React + Vite), más schemas compartidos. Se requiere un primer flujo completo y funcional para validar la arquitectura antes de migrar todos los módulos.

## Requisitos (EARS)

- **R-001** — CUANDO un usuario inicia sesión en `apps/web`, EL SISTEMA DEBERÁ autenticar contra `apps/api` y obtener JWT.
- **R-002** — CUANDO se consulta el catálogo, EL SISTEMA DEBERÁ devolver productos desde Prisma.
- **R-003** — CUANDO se crea una venta en el nuevo POS, EL SISTEMA DEBERÁ persistirla con idempotencia y actualizar stock.
- **R-004** — CUANDO se ejecuta el flujo completo, EL SISTEMA NO DEBERÁ depender del stack legacy.
- **R-005** — CUANDO falla la API, EL SISTEMA DEBERÁ mostrar error controlado y no perder la venta (offline queue).
- **R-006** — CUANDO se ejecutan pruebas, EL SISTEMA DEBERÁ tener E2E del flujo login → venta → stock.

## Fuera de alcance

- Migración de todos los módulos.
- DIAN real.
- Reportes avanzados.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Login en nuevo stack
  Dado un usuario válido
  Cuando envía credenciales al nuevo frontend
  Entonces recibe token y accede al POS
```

### R-003

```gherkin
Escenario: Venta completa en nuevo stack
  Dado un producto con stock
  Cuando el cajero vende 1 unidad
  Entonces se crea la venta
  Y el stock se decrementa
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/web/src/features/auth`, `apps/api/modules/auth` | E2E |
| R-002 | `apps/api/modules/products`, `apps/web/src/features/pos` | integration |
| R-003 | `apps/api/modules/sales`, inventory | integration |
| R-004 | `apps/web`, `apps/api` | E2E |
| R-005 | `apps/web/src/lib/offline-queue` | integration |
| R-006 | Playwright | E2E |