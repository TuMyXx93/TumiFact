# /gen-api — API Generator Command

Command: Guía para la generación e integración de nuevos endpoints REST en Express + PostgreSQL.

## Estándar de Endpoint
- Ruta definida en `routes/`.
- Validación de entradas con `express-validator` middleware.
- Consultas parametrizadas con `pool.query()`.
- Manejo explícito de excepciones y códigos de estado HTTP (200, 201, 400, 404, 500).
