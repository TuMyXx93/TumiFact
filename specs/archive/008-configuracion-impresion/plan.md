# Plan Técnico — 008 Configuración de Impresión

## Diseño

- Configuración se persiste atómicamente; audit transaccional.
- Validaciones MIME/tamaño deben ocurrir antes de persistir (middleware/controlador).
- Binarios solo se devuelven en endpoint de impresión, no en listado general.
- Storage se usa como respaldo, pero DB sigue fuente primaria de BYTEA para ticket.

## Cambios por archivo

| Archivo | Cambio | Requisito |
| --- | --- | --- |
| `src/modules/configuracion/configuracion.service.ts` | transacción y audit, validaciones | R-001..R-006 |
| `src/modules/configuracion/configuracion.repository.ts` | save transaccional y no parcial | R-004 |
| `src/modules/configuracion/configuracion.controller.ts` | validaciones de archivo | R-002 |
| `src/db/schema/configuracion` | confirmar columnas binarias | R-003 |
| `tests/catalogo-config.test.ts` | cobertura | R-001..R-006 |

## Decisiones

- ADR-0009: Configuración atómica con binarios.
  1. Validar archivos antes de guardar.
  2. Persistencia transaccional.
  3. Audit crítico.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Binarios grandes | validación tamaño |
| Guardado parcial | transacción |
| Exposición binaria | clean response |