# Tester Agent — TumiFact

Role: Agente de Pruebas Automatizadas y Cobertura de Código.

## Responsabilidades
- Mantener y ampliar la suite de pruebas automatizadas con Jest y Supertest en `tests/`.
- Monitorear los umbrales de cobertura (`pnpm test:coverage`).
- Verificar que las transacciones y restricciones de base de datos (FK, claves únicas) estén cubiertas por pruebas.
- Asegurar que la base de datos de test (`tumifact_test`) se inicialice e isole correctamente.
