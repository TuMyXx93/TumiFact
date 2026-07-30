# Documentación - ECL FRUVER

**Sistema de Facturación para ECL FRUVER**

> **Status**: ✅ En Producción | v1.0.0  
> **Última Actualización**: 12 de Julio de 2026  
> **Estándares de Documentación**: [Ver DOCUMENTACION_ESTANDARES.md](DOCUMENTACION_ESTANDARES.md)

---

## 📋 Tabla de Contenidos

1. **[Inicio Rápido](#inicio-rápido)** - Comienza aquí
2. **[Documentación por Rol](#documentación-por-rol)** - Según tu necesidad
3. **[Arquitectura](#arquitectura)** - Decisiones técnicas
4. **[Guías Prácticas](#guías-prácticas)** - How-to guides
5. **[Referencias](#referencias)** - API y especificaciones

---

## 🚀 Inicio Rápido

### Para Desarrolladores (Primeros Pasos)
1. Lee [Setup de Desarrollo](guides/development-setup.md)
2. Revisa [Estándares de Código](guides/development-standards.md)
3. Entiende el [Flujo de Git](guides/git-workflow.md)

### Para Operaciones/DevOps
1. Lee [Despliegue](guides/deployment.md)
2. Consulta [Runbook de Operaciones](runbook/)
3. Usa [Backup y Recuperación](runbook/backup-recovery.md)

### Para Product/Negocio
1. Revisa [Funcionalidades](features/)
2. Consulta [Especificaciones](api/README.md)
3. Lee [Roadmap](roadmap.md) (cuando esté disponible)

---

## 📚 Documentación por Rol

### 👨‍💻 Desarrollador Backend
- [Setup de Desarrollo](guides/development-setup.md)
- [Estándares de Código](guides/development-standards.md)
- [Arquitectura](architecture/)
- [API Endpoints](api/endpoints.md)
- [Base de Datos](architecture/database-schema.md)
- [ADRs - Decisiones Técnicas](adr/)

### 🎨 Desarrollador Frontend
- [Setup de Desarrollo](guides/development-setup.md)
- [Estándares de Código](guides/development-standards.md)
- [API Endpoints](api/endpoints.md)
- [Autenticación](api/authentication.md)

### 🚀 DevOps/Operaciones
- [Despliegue](guides/deployment.md)
- [Checklist de Despliegue](runbook/deployment-checklist.md)
- [Procedimientos Operacionales](runbook/)
- [Incident Response](runbook/incident-response.md)
- [Backup y Recuperación](runbook/backup-recovery.md)

### 🏗️ Arquitecto/Tech Lead
- [Arquitectura General](architecture/README.md)
- [Stack Tecnológico](architecture/tech-stack.md)
- [Decisiones Arquitectónicas (ADRs)](adr/)
- [Diagrama de Base de Datos](architecture/database-schema.md)

---

## 🏛️ Arquitectura

### Documentos Clave
- **[README Arquitectura](architecture/README.md)** - Índice y diagrama general
- **[Stack Tecnológico](architecture/tech-stack.md)** - Justificación de herramientas
- **[Database Schema](architecture/database-schema.md)** - Modelo de datos
- **[API Design](architecture/API-design.md)** - Convenciones REST

### Decisiones Técnicas (ADRs)
- **[ADR-0001: Multer 2.x](adr/0001-multer-2x-migration.md)** - Migración de versión
- **[ADR-0001: Security](adr/0001-multer-2x-security.md)** - Mejoras de seguridad
- *Nuevas ADRs según decisiones importantes*

---

## 📖 Guías Prácticas

### Desarrollo
- [Setup de Desarrollo](guides/development-setup.md) - Instalación inicial
- [Estándares de Código](guides/development-standards.md) - Convenciones
- [Flujo de Git](guides/git-workflow.md) - Branching y commits
- [Migraciones Futuras](guides/migraciones-futuras.md) - Upgrades planeados

### Despliegue y Operaciones
- [Despliegue](guides/deployment.md) - Cómo desplegar
- [Deployment Checklist](runbook/deployment-checklist.md) - Validaciones previas
- [Troubleshooting](guides/troubleshooting.md) - Resolución de problemas
- [Incident Response](runbook/incident-response.md) - Manejo de incidentes

### Backup y Recuperación
- [Backup Strategy](runbook/backup-recovery.md) - Estrategia de backups
- [Procedimientos de Recuperación](runbook/backup-recovery.md) - Restaurar datos

---

## 🔌 API

- **[README API](api/README.md)** - Índice de API
- **[Endpoints](api/endpoints.md)** - Lista completa de endpoints
- **[Autenticación](api/authentication.md)** - Cómo autenticarse
- **[Códigos de Error](api/errors.md)** - Referencia de errores

### Ejemplo de Endpoint (POST /configuracion)
```bash
POST /api/configuracion
Content-Type: multipart/form-data

{
  "nombre_negocio": "ECL FRUVER",
  "direccion": "Calle 123 #456",
  "telefono": "+57 123456789",
  "logo": [File],
  "qr": [File]
}
```

Ver [Endpoints](api/endpoints.md) para documentación completa.

---

## ✨ Funcionalidades

### Módulos Documentados
- **[Facturación](features/facturacion.md)** - Generación de facturas
- **[Configuración](features/configuracion.md)** - Configuración del sistema
- *Más funcionalidades por agregar*

---

## 📋 Checklist de Documentación

Cuando agregas una nueva funcionalidad, crea:
- [ ] Documento de funcionalidad en `/docs/features/`
- [ ] ADR si es una decisión técnica importante
- [ ] Actualiza este README
- [ ] Actualiza el CHANGELOG

---

## 🔄 Mantenimiento de Documentación

### Actualización Periódica
- **Mensual**: Revisar docs desactualizadas
- **Por release**: Actualizar CHANGELOG.md
- **Por cambio mayor**: Crear ADR

### Reportar Problemas
Si encuentras documentación desactualizada o confusa:
1. Abre un issue (si aplica)
2. Sugiere cambios
3. Crea un PR con la actualización

---

## 📚 Referencias

### Documentos Principales
- [CHANGELOG.md](CHANGELOG.md) - Historial de cambios
- [DOCUMENTACION_ESTANDARES.md](DOCUMENTACION_ESTANDARES.md) - Cómo escribir docs

### Recursos Externos
- [README del Proyecto](../README.md)
- [GitHub Repository](https://github.com/tu-repo/ecl-fruver)

---

## 🚀 Próximos Pasos

1. **Leer** la documentación según tu rol
2. **Configurar** tu entorno de desarrollo
3. **Contribuir** mejorando la documentación
4. **Compartir** feedback sobre claridad

---

**¿Necesitas ayuda?**  
Consulta [Troubleshooting](guides/troubleshooting.md) o crea un issue.

---

*Última actualización: 12 de Julio de 2026*  
*Versión de Documentación: 1.0.0*
