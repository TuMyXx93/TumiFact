---
id: 008-configuracion-impresion
version: 0.1.0
status: done
type: brownfield
risk: medium
financial-impact: false
---

# 008 — Configuración de Impresión y Marca

## Contexto

El módulo configura datos del negocio, tiquete térmico y binarios (logo/QR). Los riesgos son pérdida de integridad de archivos, carga indebida de binarios, y cambios no auditables que afectan impresión y POS.

## Requisitos (EARS)

- **R-001** — CUANDO se guardan datos de negocio, EL SISTEMA DEBERÁ normalizar trim y guardar ancho/font válidos.
- **R-002** — CUANDO se carga logo o QR, EL SISTEMA DEBERÁ validar tipo MIME y tamaño antes de persistir.
- **R-003** — CUANDO se persisten binarios, EL SISTEMA DEBERÁ guardar `logo_data`/`qr_data` coherentemente con su tipo.
- **R-004** — CUANDO la carga de archivo falla, EL SISTEMA NO DEBERÁ guardar cambios parciales de configuración.
- **R-005** — CUANDO se modifica configuración, EL SISTEMA DEBERÁ registrar `CONFIGURACION_ACTUALIZADA` con actor.
- **R-006** — CUANDO se consultation configuración, EL SISTEMA NO DEBERÁ exponer binarios innecesariamente en respuestas generales.

## Fuera de alcance

- Migración de storage cloud.
- Rediseño de tiquete.

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/configuracion/*` | `tests/catalogo-config.test.ts` |
| R-002 | `src/modules/configuracion/*`, middleware multer | `tests/catalogo-config.test.ts` |
| R-003 | `src/db/schema/configuracion`, `storage` | `tests/catalogo-config.test.ts` |
| R-004 | `src/modules/configuracion/*` | `tests/catalogo-config.test.ts` |
| R-005 | `src/modules/configuracion/*`, audit | `tests/catalogo-config.test.ts` |
| R-006 | `src/modules/configuracion/configuracion.service.ts` | `tests/catalogo-config.test.ts` |