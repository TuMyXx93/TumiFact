# Guías Prácticas - ECL FRUVER

> **Status**: ✅ En Desarrollo | v1.0.0  
> **Última Actualización**: 12 de Julio de 2026

---

## Índice de Guías

1. **[Setup de Desarrollo](development-setup.md)** - Instalación inicial
2. **[Estándares de Código](development-standards.md)** - Convenciones de código
3. **[Git Workflow](git-workflow.md)** - Flujo de trabajo Git
4. **[Despliegue](deployment.md)** - Cómo desplegar a producción
5. **[Migraciones Futuras](migraciones-futuras.md)** - Upgrades planeados
6. **[Troubleshooting](troubleshooting.md)** - Resolución de problemas

---

## Guías Disponibles

### 🚀 Para Comenzar
- [Setup de Desarrollo](development-setup.md) - Tu primer día
- [Estándares de Código](development-standards.md) - Cómo escribir código

### 🔄 Desarrollo Diario
- [Git Workflow](git-workflow.md) - Cómo trabajar con Git
- [Estándares de Código](development-standards.md) - Mejores prácticas

### 🚢 Despliegue
- [Despliegue](deployment.md) - Cómo llevar a producción
- [Checklist de Despliegue](../runbook/deployment-checklist.md) - Validaciones

### 🔮 Futuro
- [Migraciones Futuras](migraciones-futuras.md) - Upgrades planeados
  - Express 4.x → 5.x
  - Multer 2.x mejoras
  - Nuevas funcionalidades

### 🐛 Problemas
- [Troubleshooting](troubleshooting.md) - Solución de problemas comunes

---

## Problema + Solución Rápida

| Problema | Solución |
|---|---|
| Puerto 3000 ocupado | `fuser -k 3000/tcp` o cambiar en `.env` |
| Dependencias rotas | `pnpm clean && pnpm install` |
| BD no responde | Verificar servicio MySQL: `service mysql status` |
| Errores de multer | Ver [Seguridad](../adr/0001-multer-2x-security.md) |

---

## Documentos Relacionados

- [Arquitectura](../architecture/) - Decisiones técnicas
- [API](../api/) - Documentación de endpoints
- [ADRs](../adr/) - Decisiones importantes
- [Runbook](../runbook/) - Operaciones

---

*Para contribuciones, ve a [Estándares de Documentación](../DOCUMENTACION_ESTANDARES.md)*
