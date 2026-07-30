# Arquitectura - ECL FRUVER

> **Status**: ✅ Producción | v1.0.0  
> **Última Actualización**: 12 de Julio de 2026

## Índice de Arquitectura

1. **[Stack Tecnológico](tech-stack.md)** - Herramientas seleccionadas y por qué
2. **[Database Schema](database-schema.md)** - Modelo de datos
3. **[API Design](API-design.md)** - Convenciones REST
4. **[ADRs - Decisiones Arquitectónicas](../adr/)** - Decisiones técnicas importantes

## Descripción General

ECL FRUVER es un sistema de **facturación y gestión de configuración** para punto de venta.

### Componentes Principales

```
Frontend (EJS + Bootstrap)
    ↓
Backend (Node.js + Express)
    ↓
Database (PostgreSQL 18)
```

### Arquitectura de Capas

```
┌─────────────────────────────────────────┐
│   Presentación (Views - EJS)            │
└────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│   Aplicación (Routes - Express)         │
└────────────────┬────────────────────────┘
                  │
┌─────────────────▼────────────────────────┐
│   Base de Datos (PostgreSQL 18)         │
└─────────────────────────────────────────┘
```

## Decisiones Clave

### 1. **pnpm como Gestor de Paquetes**
- Mejor rendimiento y gestión de dependencias
- Menor consumo de espacio en disco
- Ver [Guía de Migraciones](../guides/migraciones-futuras.md)

### 2. **Multer 2.x para Manejo de Archivos**
- Protección contra CVEs de versión 1.x
- Mejor validación de archivos
- Ver [ADR-0001: Multer 2.x](../adr/0001-multer-2x-migration.md)

### 3. **Validación Dual de Archivos**
- MIME type + extensión
- Prevención de spoofing de archivos
- Ver [Seguridad Mejorada](../adr/0001-multer-2x-security.md)

## Stack Completo

| Componente | Tecnología | Versión |
|---|---|---|
| **Runtime** | Node.js | 14+ |
| **Framework Backend** | Express | 4.x |
| **Gestor Paquetes** | pnpm | 11.9+ |
| **Base de Datos** | PostgreSQL | 18 |
| **Template Engine** | EJS | 3.x |
| **Carga de Archivos** | Multer | 2.x |
| **Validación** | Integrada | - |

## Próximos Pasos

1. Lee [Tech Stack](tech-stack.md) para entender las decisiones
2. Consulta [Database Schema](database-schema.md) para el modelo de datos
3. Revisa las [ADRs](../adr/) para decisiones arquitectónicas

---

*Para contribuciones, ve a [Estándares de Documentación](../DOCUMENTACION_ESTANDARES.md)*
