---
id: 011-pos-minimalista-ui
version: 0.1.0
status: done
type: greenfield
risk: medium
financial-impact: true
---

# 011 — POS Minimalista UI/UX

## Contexto

El POS actual es funcional pero visualmente denso y orientado a peso. Se requiere una interfaz minimalista, rápida y accesible para retail moderno.

## Requisitos (EARS)

- **R-001** — CUANDO un cajero abre el POS, EL SISTEMA DEBERÁ mostrar catálogo, carrito y pago en una sola vista.
- **R-002** — CUANDO se busca un producto, EL SISTEMA DEBERÁ filtrar en menos de 200ms para catálogos medianos.
- **R-003** — CUANDO se agrega un producto, EL SISTEMA DEBERÁ actualizar totales inmediatamente.
- **R-004** — CUANDO se cobra, EL SISTEMA DEBERÁ requerir máximo 3 interacciones para venta simple.
- **R-005** — CUANDO no hay conexión, EL SISTEMA DEBERÁ encolar la venta y mostrar estado offline.
- **R-006** — CUANDO se usa teclado, EL SISTEMA DEBERÁ soportar atajos (`F2`, `F4`, `F8`, `Esc`).
- **R-007** — CUANDO se muestra la UI, EL SISTEMA DEBERÁ cumplir tap targets ≥ 44px y foco visible.

## Fuera de alcance

- Integración con hardware específico.
- Rediseño de reportes.

## Criterios de aceptación (Gherkin)

### R-004

```gherkin
Escenario: Venta rápida
  Dado un producto frecuente
  Cuando el cajero lo agrega y cobra en efectivo
  Entonces la venta se completa en máximo 3 interacciones
```

### R-005

```gherkin
Escenario: Venta offline
  Dado que el servidor no responde
  Cuando el cajero confirma una venta
  Entonces la venta se encola
  Y se muestra badge offline
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/web/src/features/pos/*` | E2E |
| R-002 | `apps/web/src/features/pos/*` | perf |
| R-003 | `apps/web/src/features/pos/*` | unit |
| R-004 | `apps/web/src/features/pos/*` | E2E |
| R-005 | `apps/web/src/lib/offline-queue.ts` | integration |
| R-006 | `apps/web/src/features/pos/*` | E2E |
| R-007 | `apps/web/src/components/ui/*` | a11y |