# Plan Técnico — 012 DIAN Readiness

## Diseño

- Configuración fiscal desacoplada.
- Adapter DIAN.
- Generación UBL 2.1.
- CUFE.
- Firma.
- Envío y estados.
- Contingencia.

## Cambios por archivo

| Área | Cambio | Requisito |
| --- | --- | --- |
| `apps/api/modules/configuracion-fiscal` | config DIAN | R-001 |
| `apps/api/modules/dian` | adapter | R-003, R-004, R-005 |
| `apps/api/modules/sales` | documento electrónico | R-002, R-007 |
| `apps/api/modules/dian` | consulta XML/PDF | R-006 |

## Decisiones

- ADR-0013: DIAN adapter desacoplado.
  1. Feature flags.
  2. No bloquear ventas.
  3. Reintentos.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Complejidad normativa | adapter aislado |
| Falla DIAN | contingencia |
| Seguridad certificado | vault/secrets |