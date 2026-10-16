# ADR-0002: Idempotencia Transaccional en Facturación POS

- **Estado:** Aceptada (implementada en feature 001)
- **Fecha:** 2026-10-16
- **Autores:** sesión arquitectónica (agente backend + agente architect)

## Contexto

El flujo de facturación usaba idempotencia por clave UUID, pero el check ocurría fuera de la transacción de creación.
Esto permitía races donde dos requests simultáneas con la misma clave podían crear facturas duplicadas.
La auditoría era fire-and-forget, lo que dificulta garantizar abortabilidad total.

## Decisión

1. La clave única de `facturas.idempotency_key` es la autoridad final.
2. `FacturasRepository.createWithDetails` ejecuta factura, detalles, stock, cliente y auditoría dentro de una transacción Drizzle.
3. Una colisión `PostgreSQL 23505` se captura fuera de la transacción y se convierte en respuesta idempotente (HTTP 200).
4. La auditoría crítica (`FACTURA_CREADA`) se inserta dentro de la transacción, por lo que falla en cascada y hace rollback.
5. No se introduce lock distribuido Redis en esta fase; PostgreSQL sigue siendo autoridad.

## Consecuencias

- Positivas: no más duplicados por retry/concurrencia, rollback completo ante fallos, auditoría consistente.
- Negativas: el segundo request concurrente puede recibir conflicto temporal de abort de transacción; se mitiga con manejo controlado.
- Riesgo: la hidratación del replay puede leer justo después del commit; se usa retry ligero en servicio.