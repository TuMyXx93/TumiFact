---
id: 012-dian-readiness
version: 0.1.0
status: approved
type: greenfield
risk: high
financial-impact: true
---

# 012 — Preparación para Facturación Electrónica DIAN

## Contexto

TumiFact debe quedar preparado para facturación electrónica Colombia (UBL 2.1, CUFE, firma y validación DIAN) sin bloquear ventas internas.

## Requisitos (EARS)

- **R-001** — CUANDO se configura la empresa, EL SISTEMA DEBERÁ almacenar NIT, resolución, numeración, vigencia y certificado.
- **R-002** — CUANDO se crea una venta, EL SISTEMA DEBERÁ generar un documento electrónico pendiente de envío.
- **R-003** — CUANDO se envía a DIAN, EL SISTEMA DEBERÁ generar UBL 2.1, calcular CUFE y firmar XML.
- **R-004** — CUANDO DIAN valida, EL SISTEMA DEBERÁ guardar estado (`pendiente`, `validado`, `rechazado`) y CUFE.
- **R-005** — CUANDO DIAN falla, EL SISTEMA NO DEBERÁ invalidar la venta interna y deberá reintentar.
- **R-006** — CUANDO se consulta un documento, EL SISTEMA DEBERÁ exponer XML, PDF y estado.
- **R-007** — MIENTRAS no exista configuración fiscal, EL SISTEMA DEBERÁ operar en modo interno sin bloquear ventas.

## Fuera de alcance

- Emisión real en producción.
- Multiempresa completa.

## Criterios de aceptación (Gherkin)

### R-007

```gherkin
Escenario: Venta sin configuración DIAN
  Dado que no hay resolución configurada
  Cuando se crea una venta
  Entonces la venta se registra internamente
  Y el documento electrónico queda pendiente
```

### R-004

```gherkin
Escenario: Validación DIAN exitosa
  Dado un documento pendiente
  Cuando DIAN responde validado
  Entonces se guarda CUFE y estado 'validado'
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `apps/api/modules/configuracion-fiscal` | integration |
| R-002 | `apps/api/modules/sales` | unit |
| R-003 | `apps/api/modules/dian` | integration |
| R-004 | `apps/api/modules/dian` | integration |
| R-005 | `apps/api/modules/dian` | retry test |
| R-006 | `apps/api/modules/dian` | integration |
| R-007 | `apps/api/modules/sales` | unit |