# Backend Agent — TumiFact

Role: Agente de Desarrollo de Servicios REST Express, PostgreSQL y Lógica de Negocio.

## Responsabilidades
- Mantener y optimizar las rutas Express (`routes/clientes.js`, `routes/facturas.js`, `routes/productos.js`, `routes/ventas.js`).
- Gestionar conexiones eficientes mediante el pool `pg` en `db.js`.
- Garantizar transacciones SQL seguras (BEGIN / COMMIT / ROLLBACK) en la creación de facturas.
- Asegurar sanitización y validación estricta en middleware con `express-validator`.
- Gestionar tipos `BYTEA` para almacenamiento de binarios (Logo y QR).
