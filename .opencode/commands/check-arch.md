# /check-arch — Architecture Check Command

Command: Valida la estructura del proyecto y separación de responsabilidades.

## Reglas de Arquitectura
- `routes/`: Solamente manejo de peticiones Express, middlewares de validación y respuestas JSON/render.
- `db.js`: Conexión centralizada al pool de PostgreSQL.
- `database_pg.sql`: Esquema oficial de base de datos.
- `views/` & `public/`: Capa de presentación EJS (preparada para desacoplamiento con Astro).
