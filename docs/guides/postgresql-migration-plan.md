---
title: Plan de Migración MySQL → PostgreSQL
description: Migración paso a paso de MySQL 5.7 a PostgreSQL 18.4
last_updated: 2026-07-12
status: in-progress
---

# Plan de Migración: MySQL 5.7 → PostgreSQL 18.4

> **Status**: 🔄 En Progreso  
> **Fecha Inicio**: 12 de Julio de 2026  
> **Estimado**: 4-5 horas

---

## Tabla de Contenidos

1. [Análisis del Schema](#análisis-del-schema)
2. [Cambios Requeridos](#cambios-requeridos)
3. [Docker Setup](#docker-setup)
4. [Migración del Schema](#migración-del-schema)
5. [Cambios en el Código](#cambios-en-el-código)
6. [Testing](#testing)
7. [Validación Final](#validación-final)

---

## Análisis del Schema

### Tablas Actuales

**1. productos**
```sql
id INT AUTO_INCREMENT PRIMARY KEY
codigo VARCHAR(50) UNIQUE
nombre VARCHAR(100)
precio_kg DECIMAL(10,2)
precio_unidad DECIMAL(10,2)
precio_libra DECIMAL(10,2)
created_at TIMESTAMP
updated_at TIMESTAMP (con ON UPDATE)
```

**2. clientes**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
nombre VARCHAR(100)
direccion TEXT
telefono VARCHAR(20)
created_at TIMESTAMP
```

**3. facturas**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
cliente_id INT (FK)
fecha TIMESTAMP
total DECIMAL(10,2)
forma_pago ENUM('efectivo', 'transferencia')
```

**4. detalle_factura**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
factura_id INT (FK)
producto_id INT (FK)
cantidad DECIMAL(10,2)
precio_unitario DECIMAL(10,2)
unidad_medida ENUM('KG', 'UND', 'LB')
subtotal DECIMAL(10,2)
```

**5. configuracion_impresion**
```sql
id INT PRIMARY KEY AUTO_INCREMENT
nombre_negocio VARCHAR(100)
direccion TEXT
telefono VARCHAR(20)
nit VARCHAR(50)
pie_pagina TEXT
ancho_papel INT
font_size INT
created_at TIMESTAMP
updated_at TIMESTAMP
logo_data LONGBLOB
logo_tipo VARCHAR(50)
qr_data LONGBLOB
qr_tipo VARCHAR(50)
```

### Complejidad

- **5 tablas** relativamente simples
- **2 ENUMs** (necesitan conversión)
- **1 TIMESTAMP ON UPDATE** (necesita trigger en PostgreSQL)
- **3 LONGBLOB** para archivos (→ BYTEA)
- **6 FOREIGN KEYS**

**Nivel de Complejidad**: ⭐⭐ Bajo-Medio

---

## Cambios Requeridos

### Mapeo de Tipos de Datos

| MySQL | PostgreSQL | Notas |
|---|---|---|
| INT AUTO_INCREMENT | SERIAL | ID auto-incremental |
| INT | INTEGER | Número entero |
| VARCHAR(n) | VARCHAR(n) | String |
| TEXT | TEXT | Texto largo |
| DECIMAL(10,2) | NUMERIC(10,2) | Decimal exacto |
| TIMESTAMP | TIMESTAMP | Igual |
| ENUM | VARCHAR | Convertir a string con constraint |
| LONGBLOB | BYTEA | Datos binarios |

### Diferencias Importantes

1. **AUTO INCREMENT**
   ```sql
   -- MySQL
   id INT AUTO_INCREMENT PRIMARY KEY
   
   -- PostgreSQL
   id SERIAL PRIMARY KEY
   ```

2. **ENUM**
   ```sql
   -- MySQL
   forma_pago ENUM('efectivo', 'transferencia')
   
   -- PostgreSQL (opción 1: string simple)
   forma_pago VARCHAR(50) CHECK (forma_pago IN ('efectivo', 'transferencia'))
   
   -- PostgreSQL (opción 2: tipo ENUM)
   CREATE TYPE forma_pago_enum AS ENUM ('efectivo', 'transferencia');
   forma_pago forma_pago_enum
   ```

3. **TIMESTAMP ON UPDATE**
   ```sql
   -- MySQL
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   
   -- PostgreSQL (usar trigger)
   updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
   -- + TRIGGER para actualizar
   ```

4. **LONGBLOB → BYTEA**
   ```sql
   -- MySQL
   logo_data LONGBLOB
   
   -- PostgreSQL
   logo_data BYTEA
   ```

---

## Docker Setup

### Crear docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:18-alpine
    container_name: ecl_fruver_db
    environment:
      POSTGRES_USER: fruver_user
      POSTGRES_PASSWORD: fruver_password
      POSTGRES_DB: ecl_fruver
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database_pg.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U fruver_user"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - fruver_network

networks:
  fruver_network:
    driver: bridge

volumes:
  postgres_data:
    driver: local
```

### Comandos Docker

```bash
# Crear y levantar
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Conectarse a la BD
docker exec -it ecl_fruver_db psql -U fruver_user -d ecl_fruver

# Detener
docker-compose down

# Limpiar volumen (⚠️ PIERDE DATOS)
docker-compose down -v
```

---

## Migración del Schema

### Crear database_pg.sql

El nuevo archivo SQL para PostgreSQL incluye:
- Conversión de tipos de datos
- Triggers para ON UPDATE
- Constraints en lugar de ENUMs
- BYTEA en lugar de LONGBLOB

*Ver archivo separado: `database_pg.sql`*

### Pasos de Ejecución

```bash
# 1. Copiar database.sql a database_pg.sql
cp database.sql database_pg.sql

# 2. Editar database_pg.sql con las conversiones
# (Se hará en el editor)

# 3. Levantar PostgreSQL con Docker
docker-compose up -d

# 4. Verificar que esté corriendo
docker ps | grep ecl_fruver_db

# 5. Verificar la BD fue creada
docker exec -it ecl_fruver_db psql -U fruver_user -d ecl_fruver -c "\dt"
```

---

## Cambios en el Código

### 1. package.json - Reemplazar Driver

```bash
# Remover mysql2
pnpm remove mysql2

# Instalar pg
pnpm install pg
```

Resultado:
```json
{
  "dependencies": {
    "pg": "^8.11.0",
    // ... otras dependencias
  }
}
```

### 2. db.js - Cambiar Conexión

**Antes (MySQL):**
```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

module.exports = pool;
```

**Después (PostgreSQL):**
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_DATABASE
});

// Escuchar errores
pool.on('error', (err) => {
  console.error('Error no esperado en el pool', err);
});

module.exports = pool;
```

### 3. Queries - Cambios Menores

**Cambio principal**: Acceso a resultados

```javascript
// MySQL
const [rows] = await pool.query(sql);

// PostgreSQL
const result = await pool.query(sql);
const rows = result.rows;
```

**Cambio de parámetros**:
```javascript
// MySQL - Usa ?
pool.query("SELECT * FROM users WHERE id = ?", [id]);

// PostgreSQL - Usa $1, $2, etc.
pool.query("SELECT * FROM users WHERE id = $1", [id]);
```

---

## .env - Actualizar Credenciales

```env
# Base de Datos PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USER=fruver_user
DB_PASSWORD=fruver_password
DB_DATABASE=ecl_fruver

# Aplicación
PORT=3000
NODE_ENV=development
```

---

## Testing

### Test 1: Conexión a BD

```bash
pnpm dev
# Debería conectarse sin errores
```

### Test 2: CRUD Operations

```bash
# GET /api/configuracion
curl http://localhost:3000/api/configuracion

# POST con datos
curl -X POST http://localhost:3000/api/configuracion \
  -H "Content-Type: application/json" \
  -d '{"nombre_negocio":"ECL FRUVER","direccion":"Calle 123"}'
```

### Test 3: Upload de Archivos

Probar upload de logo.png y qr.png

---

## Validación Final

### Checklist

- [ ] Docker levantado correctamente
- [ ] BD PostgreSQL creada
- [ ] Schema migrado correctamente
- [ ] Driver cambiado a pg
- [ ] db.js actualizado
- [ ] .env configurado
- [ ] Queries adaptadas
- [ ] Conexión funciona
- [ ] CRUD operations funciona
- [ ] Upload de archivos funciona
- [ ] Documentación actualizada
- [ ] Sin errores en console

---

## Rollback (en caso necesario)

```bash
# 1. Detener containers
docker-compose down

# 2. Revertir código
git checkout package.json db.js .env routes/

# 3. Reinstalar mysql2
pnpm install mysql2

# 4. Levantar nuevamente
pnpm dev
```

---

## Próximos Pasos

1. ✅ Analizar schema (completado)
2. ⏳ Crear docker-compose.yml
3. ⏳ Convertir database.sql
4. ⏳ Actualizar package.json
5. ⏳ Cambiar db.js
6. ⏳ Adaptar queries
7. ⏳ Actualizar .env
8. ⏳ Testing

---

*Última actualización: 12 de Julio de 2026*
