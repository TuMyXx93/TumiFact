# /gen-test — Test Generator Command

Command: Generación de suite de pruebas unitarias o de integración con Jest y Supertest.

## Estándar de Prueba
- Ubicación: `tests/[modulo].test.js`.
- Uso de `request(app)` para pruebas HTTP.
- Limpieza previa con `truncateAll()` o transacciones aisladas.
- Verificación de códigos de estado, estructura JSON y efectos secundarios en BD.
