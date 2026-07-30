# Sistema de Facturación TumiFact

## 🚀 Status
- **BD:** PostgreSQL 18.4 (Docker)
- **Driver:** pg 8.11.0
- **Estado:** ✅ Producción
- **Última actualización:** 12 de Julio de 2026

## Requisitos Previos
1. Node.js (versión 14 o superior)
2. pnpm (gestor de paquetes, instalar con `npm install -g pnpm`)
3. Docker (para PostgreSQL 18.4)
4. Docker Compose (incluido con Docker Desktop)
5. Git (opcional)

## ⚡ Pasos de Instalación Rápida

### 1. Base de Datos (PostgreSQL en Docker)
```bash
# Levantar PostgreSQL 18.4
docker-compose up -d

# Verificar que está corriendo
docker ps | grep ecl_fruver_db

# Conectarse a la BD (opcional)
docker exec -it ecl_fruver_db psql -U fruver_user -d ecl_fruver
```

**Credenciales por defecto:**
- Usuario: `fruver_user`
- Contraseña: `fruver_password`
- Base de datos: `ecl_fruver`
- Puerto: `5432`

### 2. Aplicación
1. Clonar o descargar este repositorio
2. Abrir una terminal en la carpeta del proyecto
3. Instalar las dependencias:
```bash
pnpm install
```

4. Verificar configuración del `.env` (no se commitea al repositorio):
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=fruver_user
DB_PASSWORD=fruver_password
DB_DATABASE=ecl_fruver
PORT=3000
NODE_ENV=development
```

### 3. Iniciar el Sistema
```bash
# Modo desarrollo (con hot-reload)
pnpm dev

# O modo producción
pnpm start
```

2. Abrir el navegador en: `http://localhost:3000`

## 📋 Scripts Disponibles
```bash
pnpm start        # Iniciar en producción
pnpm dev          # Iniciar en desarrollo con hot-reload
pnpm build        # Generar ejecutable con pkg
pnpm clean        # Limpiar node_modules y cache
pnpm rebuild      # Limpiar e instalar dependencias
pnpm audit        # Verificar vulnerabilidades
```

## 🐳 Docker Commands

```bash
# Levantar PostgreSQL
docker-compose up -d

# Ver logs
docker-compose logs -f postgres

# Detener
docker-compose down

# Detener y eliminar volumen (CUIDADO: borra datos)
docker-compose down -v

# Conectarse a psql
docker exec -it ecl_fruver_db psql -U fruver_user -d ecl_fruver
```

## 📊 Notas sobre Migración MySQL → PostgreSQL

**Cambios principales:**
- ✅ **Driver:** mysql2 → pg 8.11.0
- ✅ **BD:** MySQL 5.7 → PostgreSQL 18.4 (Docker)
- ✅ **Config:** `db.js` lee credenciales desde `.env` (sin valores hard-codeados)
- ✅ **Gestión:** pnpm (optimizado para mejor rendimiento)
- ✅ **Pool:** Implementado para mejor manejo de conexiones
- ✅ **Queries:** Adaptadas a sintaxis PostgreSQL ($1, $2 en lugar de ?)
- ✅ **Archivos:** Logo y QR guardados en BYTEA (en BD, no en filesystem)

**Por qué PostgreSQL:**
1. Más robusto y estable
2. Mejor performance en transacciones complejas
3. Mejor soporte para JSON/JSONB
4. Datos binarios (BYTEA) integrados en BD
5. Estándar enterprise
6. Con Docker = reproducibilidad garantizada

**Validaciones completadas:**
- ✓ Conexión a BD funciona
- ✓ CRUD operations: 9/9 endpoints
- ✓ Búsquedas funcionales (ILIKE)
- ✓ Transacciones en facturas
- ✓ Upload de archivos (logo.jpg, qr.png)
- ✓ Integridad referencial (FK)

Ver `docs/adr/0002-postgresql-docker-migration.md` para detalles técnicos completos.

## Estructura de Carpetas
- `/public` - Archivos estáticos (CSS, JS, imágenes)
- `/routes` - Rutas de la aplicación
- `/views` - Plantillas EJS
- `/config` - Configuración de la base de datos
- `/uploads` - Carpeta donde se guardan las imágenes subidas

## Funcionalidades
- Gestión de productos
- Gestión de clientes
- Generación de facturas
- Configuración de impresión
- Soporte para logo y QR de pagos

## Soporte
Para soporte o preguntas, ingresa a https://ciscodedev.netlify.app/
