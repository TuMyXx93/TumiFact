---
id: 001-facturacion-idempotente-concurrencia
version: 0.1.0
status: done
type: brownfield
risk: high
financial-impact: true
---

# 001 — Facturación Idempotente y Consistente bajo Concurrencia

## Contexto

El módulo de facturación ya implementa idempotencia por clave UUID e integridad transaccional en `FacturasRepository.createWithDetails`, incluyendo actualización atómica de stock con predicado `stock_actual >= cantidad`. Sin embargo, dos debilidades críticas permanecen:

1. El check de idempotencia se ejecuta **fuera** de la transacción de creación, por lo que dos requests simultáneas con la misma clave pueden pasar el check y crear facturas duplicadas.
2. La respuesta idempotente depende de una lectura posterior (`getFacturaWithDetails`), que puede no encontrar la transacción todavía confirmada o devolver una vista parcial, deteriorando la consistencia del contrato al cliente.

El objetivo es blindar la facturación POS para reintentos, red inestable y operaciones concurrentes sin cobros duplicados ni consumo duplicado de stock.

## Requisitos (EARS)

- **R-001** — CUANDO se recibe una petición `POST /api/facturas` con una `Idempotency-Key` UUID ya procesada anteriormente, EL SISTEMA DEBERÁ devolver la factura original y sus detalles con estado HTTP 200, sin ejecutar otra mutación, sin registrar nueva auditoría y sin decrementar stock nuevamente.
- **R-002** — MIENTRAS se procesa una petición de facturación, EL SISTEMA NO DEBERÁ permitir que una segunda petición con la misma `Idempotency-Key` cree una factura paralela, aunque ambas lleguen simultáneamente; una de ellas deberá esperar a la respuesta canónica o fallar con un error explícito de conflicto.
- **R-003** — CUANDO dos requests concurrentes intentan vender el mismo producto y el stock no es suficiente para ambas, EL SISTEMA DEBERÁ asignar el stock a una sola operación y rechazar la otra con `409 INSUFFICIENT_STOCK`, dejando inventario no negativo.
- **R-004** — CUANDO se genera una factura, EL SISTEMA DEBERÁ calcular subtotal, descuentos y total en el servidor con precisión de 2 decimales y rechazar la petición si el total recibido difiere en más de 0,05 del total calculado.
- **R-005** — CUANDO una factura se crea exitosamente, EL SISTEMA DEBERÁ escribir `factura`, `detalle_factura`, movimientos de inventario, actualización de cliente y `audit_log` dentro de una única transacción Drizzle; ante fallo en cualquier paso, EL SISTEMA DEBERÁ hacer rollback completo.
- **R-006** — CUANDO no se envía `Idempotency-Key`, EL SISTEMA DEBERÁ generar un UUID v4, adjuntarlo al body y devolverlo en el header `Idempotency-Key`, conservando compatibilidad con el contrato actual.
- **R-007** — CUANDO se repite una factura idempotente, EL SISTEMA DEBERÁ devolver una respuesta estable con los mismos campos financieros (`subtotal`, `descuento_total`, `total`, `detalles`) que la factura original, sin reintentar escrituras ni auditoría.
- **R-008** — MIENTRAS una factura se está procesando, EL SISTEMA NO DEBERÁ registrar auditoría ni movimientos de inventario si la transacción finalmente falla.

## Fuera de alcance

- Reescritura completa del módulo de facturación.
- Cambios en reportes, separados o devoluciones.
- Migración de idempotencia a almacenamiento Redis distribuido (puede quedar como mejora futura).
- Cambios de UI más allá de mostrar el estado idempotente.

## Clarificaciones

### Ambigüedades actuales

- **C1** ¿La clave debe ser obligatoria o puede generarse automáticamente?  
  Decisión tentativa: soportar ambas vías (`ensureIdempotencyKey` actual), pero registrar la procedencia (`client-provided` vs `server-generated`).
- **C2** ¿La respuesta idempotente debe devolver `200` o `201`?  
  Decisión tentativa: `200` para replay, `201` para creación real.
- **C3** ¿Debe bloquearse concurrency con lock de BD (`SELECT ... FOR UPDATE`) o basta la unique constraint + transacción?  
  Decisión tentativa: usar unique constraint como autoridad final y manejar error de duplicado como replay.
- **C4** ¿La auditoría de `FACTURA_CREADA` debe repetirse en replay?  
  Decisión tentativa: no, solo en creación real.

### Dependencias

- Tabla `facturas.idempotency_key` ya es `unique()`.
- `FacturasRepository.createWithDetails` usa transacción Drizzle.
- `ensureIdempotencyKey` genera UUID v4 si falta.

### Edge cases a cubrir en tests

- Retry con misma clave tras éxito.
- Dos POST simultáneos con misma clave.
- Dos POST simultáneos por el mismo producto con stock insuficiente para ambas.
- Falla de escritura de `audit_log` dentro de la transacción.
- Total manipulado por el cliente.
- Clave no UUID enviada por cliente.
- Factura sin `idempotency_key` y verificación del header devuelto.

## Criterios de aceptación (Gherkin)

### R-001

```gherkin
Escenario: Reintento con la misma Idempotency-Key no duplica la factura
  Dado una factura ya creada con la clave "11111111-2222-3333-4444-555555555555"
  Cuando se envía otra POST con la misma clave y el mismo payload
  Entonces la respuesta es 200
  Y el id de factura es el mismo que la original
  Y no se crea una nueva fila en facturas
  Y no se decrementa stock nuevamente
  Y no se registra una segunda auditoría FACTURA_CREADA
```

### R-002

```gherkin
Escenario: Dos requests simultáneos con la misma clave no crean duplicados
  Dado una clave de idempotencia válida no procesada
  Cuando se envían dos POST simultáneos con la misma clave
  Entonces solo se crea una factura
  Y la segunda obtiene la factura original con estado 200
  Y no hay error 500 por violación de unicidad sin control
```

### R-003

```gherkin
Escenario: Stock insuficiente bajo concurrencia
  Dado un producto con stock 5
  Cuando dos requests concurrentes venden 5 unidades del mismo producto
  Entonces una request crea la factura
  Y la otra responde 409 INSUFFICIENT_STOCK
  Y el stock final es 0
```

### R-004

```gherkin
Escenario: Total manipulado o inconsistente
  Dado un payload con productos válidos
  Cuando total recibido difiere en más de 0.05 del total calculado por el servidor
  Entonces la respuesta es 400
  Y no se crea factura
  Y no se modifica stock
```

### R-005

```gherkin
Escenario: Fallo en auditoría revierte la factura
  Dado una venta válida
  Cuando falla el registro de audit_log dentro de la transacción
  Entonces no se crea factura
  Y no se insertan detalles
  Y no se decrementa stock
  Y el cliente no acumula la compra
```

### R-006

```gherkin
Escenario: Generación automática de Idempotency-Key
  Dado una petición POST sin header Idempotency-Key ni body.idempotency_key
  Cuando se procesa la request
  Entonces el servidor genera un UUID v4
  Y la respuesta incluye el header Idempotency-Key
  Y se persiste en facturas.idempotency_key
```

### R-007

```gherkin
Escenario: Reintento devuelve payload consistente
  Dado una factura original con totales y detalles
  Cuando se repite la misma Idempotency-Key
  Entonces los totales devueltos son iguales
  Y la cantidad de detalles es igual
  Y los subtotales de detalle son iguales
```

### R-008

```gherkin
Escenario: Fallo no deja efectos parciales
  Dado una venta con varios productos
  Cuando el segundo producto no tiene stock
  Entonces la respuesta es 409 INSUFFICIENT_STOCK
  Y no se crea la factura
  Y no se decrementa stock del primer producto
  Y no se registra auditoría FACTURA_CREADA
```

## Trazabilidad

| Requisito | Archivos | Tests |
| --- | --- | --- |
| R-001 | `src/modules/facturas/facturas.service.ts`, `src/modules/facturas/facturas.repository.ts` | `tests/facturas.test.ts` (repetir clave, concurrente) |
| R-002 | `src/modules/facturas/facturas.repository.ts` (`isIdempotencyConflict`) | `tests/facturas.test.ts` (concurrente) |
| R-003 | `src/modules/facturas/facturas.repository.ts` (predicado stock) | `tests/facturas.test.ts` (doble venta concurrente) |
| R-004 | `src/modules/facturas/facturas.service.ts` | `tests/facturas.test.ts` (total manipulado) |
| R-005 | `src/modules/facturas/facturas.repository.ts`, `src/shared/utils/audit.ts` | `tests/facturas.test.ts` |
| R-006 | `src/shared/middleware/idempotency.ts` | `tests/facturas.test.ts` (clave generada) |
| R-007 | `src/modules/facturas/facturas.service.ts` | `tests/facturas.test.ts` (repetir clave) |
| R-008 | `src/modules/facturas/facturas.repository.ts` | `tests/facturas.test.ts` (rollback por stock) |