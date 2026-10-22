# ADR-0021: Motor de Descuentos Determinista

- **Estado:** Aceptada (implementada)
- **Fecha:** 2026-10-22

## Contexto

La tabla `descuentos` existía (`tipo`, `valor`, `aplica_a`, `requiere_aprobacion`, vigencias) y los empleados tenían `descuento_max_porcentaje` / `descuento_max_monto`, pero **ninguno de los dos estaba en uso**: el nuevo stack cobraba sin motor de descuentos y los límites por cajero eran decorativos.

## Decisión

1. **Motor puro y compartido** en `packages/discounts`: sin base de datos, sin `Date.now()` implícito (la vigencia se recibe como `hoy`). Web y API usan la misma aritmética, así el total que ve el cajero es exactamente el que cobra el backend.
2. **Límites por empleado**: porcentaje y monto máximos leídos del perfil (`empleados`), no de constantes.
3. **Aprobación por permiso** (`descuentos:aprobar`), no por rol hardcode. El admin tiene todos los permisos por definición.
4. **Un descuento rechazado no se ignora**: la venta responde `422 DESCUENTOS_RECHAZADOS` con el motivo por descuento (`EXCEDE_LIMITE_EMPLEADO`, `REQUIERE_APROBACION`, `FUERA_DE_VIGENCIA`, …).
5. **Trazabilidad**: el descuento aplicado se persiste en `detalle_factura` (`descuento_id`, `descuento_inline_tipo`, `descuento_inline_valor`, `descuento_aplicado`).
6. **El total nunca es negativo**: clamp a 0 y el total enviado por el cliente se valida contra el calculado con tolerancia de 0,05.

## Alternativas consideradas

- **Descuentos solo en el cliente** (rechazada): el cliente podría manipular el total; el backend debe ser la autoridad.
- **Cálculo directo en la ruta de venta** (rechazada): no testeable de forma determinista ni reutilizable por el web.
- **Ignorar silenciosamente un descuento rechazado** (rechazada): el cajero creería que aplicó la promoción; se pierde margen en silencio.

## Consecuencias

**Positivas:** margen controlado, trazabilidad por línea, cálculo determinista y testeable, web y API en paridad.

**Negativas:** una consulta extra al catálogo por venta; los descuentos de total se aplican a la venta completa, no a una línea concreta.

**Riesgos:** el web debe consumir el mismo paquete (`@tumifact/discounts`) para previsualizar; si diverge la versión, el total mostrado puede diferir — mitigado por la dependencia de workspace versionada.

## Cumplimiento

- R-001..R-008 → `packages/discounts/src/index.ts`, `apps/api/src/modules/discounts/*`, `apps/api/src/modules/sales/sales.routes.ts`
