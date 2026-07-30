# Estándares de Documentación - ECL Fruver

**Referencia**: Basado en estructura profesional de [Tumi Suite](https://github.com/Tumi-dev/tumi-suite)

---

## 📋 Tabla de Contenidos

1. [Estructura de Carpetas](#estructura-de-carpetas)
2. [Tipos de Documentos](#tipos-de-documentos)
3. [Convenciones de Nomenclatura](#convenciones-de-nomenclatura)
4. [Estándares de Contenido](#estándares-de-contenido)
5. [Validación y Control de Calidad](#validación-y-control-de-calidad)

---

## Estructura de Carpetas

```
docs/
├── README.md                          # Índice general de documentación
├── ESTANDARES.md                      # Este archivo
├── architecture/                      # Decisiones técnicas y diseño
│   ├── README.md                      # Índice de arquitectura
│   ├── tech-stack.md                  # Justificación de herramientas
│   ├── database-schema.md             # Modelo de BD
│   ├── API-design.md                  # Diseño de API REST
│   └── ADR-*.md                       # Architectural Decision Records
├── guides/                            # Guías prácticas
│   ├── development-setup.md           # Instalación y configuración
│   ├── development-standards.md       # Estándares de código
│   ├── git-workflow.md                # Flujo de trabajo Git
│   ├── deployment.md                  # Despliegue
│   └── troubleshooting.md             # Resolución de problemas
├── api/                               # Documentación de API
│   ├── README.md                      # Índice de API
│   ├── endpoints.md                   # Lista de endpoints
│   ├── authentication.md              # Autenticación
│   └── errors.md                      # Códigos de error
├── features/                          # Documentación de funcionalidades
│   ├── facturacion.md                 # Módulo de facturación
│   ├── configuracion.md               # Configuración del sistema
│   └── *.md                           # Una por funcionalidad
├── runbook/                           # Procedimientos operacionales
│   ├── deployment-checklist.md        # Checklist de despliegue
│   ├── incident-response.md           # Respuesta a incidentes
│   ├── backup-recovery.md             # Backups y recuperación
│   └── *.md                           # Procedimientos específicos
├── adr/                               # Architectural Decision Records (ADR)
│   ├── 0001-multer-2x.md              # Decisión de migrar a Multer 2.x
│   ├── 0002-pnpm-upgrade.md           # Decisión de usar pnpm
│   └── *.md                           # Una por decisión importante
└── CHANGELOG.md                       # Registro de cambios en documentación
```

---

## Tipos de Documentos

### 1. **README.md** (Índice)
**Propósito**: Guía de navegación a nivel de carpeta  
**Estructura**:
- Breve descripción del contenido
- Tabla de contenidos con enlaces
- Notas importantes
- Enlaces a documentos relacionados

**Ejemplo**:
```markdown
# Guías de Desarrollo

Este directorio contiene guías prácticas para desarrolladores.

## Índice
1. **[Setup de Desarrollo](development-setup.md)** - Instalación inicial
2. **[Estándares de Código](development-standards.md)** - Convenciones
3. **[Flujo de Git](git-workflow.md)** - Branching y commits

## Documentos Relacionados
- [Arquitectura](../architecture/) - Decisiones técnicas
- [API](../api/) - Documentación de endpoints
```

### 2. **ADR - Architectural Decision Records**
**Propósito**: Documentar decisiones técnicas importantes  
**Nominación**: `00XX-nombre-descriptivo.md`  
**Estructura**:
```markdown
# ADR-0001: Título de la Decisión

## Status
[Accepted | Rejected | Deprecated | Superseded by ADR-XXXX]

## Context
(Situación que requería una decisión)

## Decision
(Qué se decidió hacer)

## Consequences

### Positive
- Beneficio 1
- Beneficio 2

### Negative
- Riesgo 1
- Riesgo 2

## Alternatives Considered
1. Opción A (rechazada porque...)
2. Opción B (rechazada porque...)

## References
- [Link 1]
- [Link 2]
```

### 3. **Guías de Procedimientos**
**Propósito**: Instrucciones paso a paso  
**Estructura**:
- Descripción breve
- Requisitos previos
- Pasos numerados
- Troubleshooting (si aplica)
- Referencias

### 4. **Documentación Técnica**
**Propósito**: Referencia técnica detallada  
**Estructura**:
- Descripción del componente
- Diagrama (si aplica)
- Secciones temáticas
- Ejemplos de código
- Notas importantes

---

## Convenciones de Nomenclatura

### Archivos
- **kebab-case**: `document-name.md`
- **Excepciones**: `README.md`, `CHANGELOG.md`, `ADR-*.md`

### Carpetas
- **lowercase**: `architecture/`, `guides/`, `api/`
- **Snake_case solo en archivos**: No usarr `my_folder/`

### Referencias en Documentos
- Links internos: `[texto](../architecture/tech-stack.md)`
- Links externos: `[Multer Docs](https://www.npmjs.com/package/multer)`

### Convención de Numeración (ADR)
- Padded: `0001`, `0002`, ..., `9999`
- Incremental: No reutilizar números
- Orden cronológico

---

## Estándares de Contenido

### 1. **Encabezados**
- Nivel 1 (#) - Título del documento (uno por archivo)
- Nivel 2 (##) - Secciones principales
- Nivel 3 (###) - Subsecciones
- No saltar niveles

### 2. **Frontmatter (Metadatos)**
Encima del H1, incluir:
```markdown
---
title: Nombre del Documento
description: Breve descripción
last_updated: 2026-07-12
status: [draft | review | approved]
author: [Nombre del Autor]
---
```

### 3. **Tabla de Contenidos**
Si el documento es > 500 palabras:
```markdown
## Tabla de Contenidos
- [Sección 1](#sección-1)
- [Sección 2](#sección-2)
```

### 4. **Información de Estado**
Al inicio del documento:
```markdown
> **Status**: ✅ Producción | 🔄 En Progreso | ⚠️ Revisión
> **Versión**: 1.0.0
> **Última Actualización**: 12 de Julio de 2026
```

### 5. **Notas y Advertencias**
```markdown
> **ℹ️ Nota**: Información complementaria

> **⚠️ Advertencia**: Algo importante a tener en cuenta

> **🔒 Seguridad**: Consideración de seguridad crítica

> **🐛 Bug Conocido**: Problema existente
```

### 6. **Código y Bloques**
```markdown
\`\`\`javascript
// Código JavaScript
function ejemplo() {
  return "Hola";
}
\`\`\`
```

### 7. **Tablas de Comparación**
```markdown
| Característica | Opción A | Opción B |
|---|---|---|
| Rendimiento | Alto | Medio |
| Complejidad | Baja | Alta |
```

### 8. **Referencias**
Al final del documento:
```markdown
## Referencias
- [RFC 3986: URI](https://tools.ietf.org/html/rfc3986)
- [RESTful API Best Practices](https://restfulapi.net/)
```

---

## Validación y Control de Calidad

### Checklist de Documentación
Antes de hacer commit de documentación:

- [ ] Nombre de archivo en kebab-case
- [ ] Encabezado de nivel 1 (#) presente
- [ ] Tabla de contenidos si > 500 palabras
- [ ] Sin errores de ortografía
- [ ] Enlaces internos funcionan (verificar con grep)
- [ ] Código tiene sintaxis resaltada
- [ ] Ejemplos son ejecutables/correctos
- [ ] Referencias citadas
- [ ] Status actualizado
- [ ] Fecha de actualización correcta

### Herramientas de Validación

**Markdown Lint** (recomendado):
```bash
npm install -D markdownlint-cli
npx markdownlint docs/**/*.md
```

**Spell Check** (opcional):
```bash
npm install -D cspell
npx cspell docs/**/*.md
```

### Proceso de Revisión

1. **Autor**: Crea documento en rama feature
2. **Revisor**: Verifica checklist + contenido
3. **Merge**: Integra a main después de aprobación
4. **Publicación**: Documentación viva en main

---

## Ejemplos de Documentos para ECL-Fruver

### 1. `/docs/architecture/README.md`
**Contenido sugerido**:
- Descripción general del sistema
- Diagrama de arquitectura
- Stack tecnológico
- Decisiones clave (ADRs)

### 2. `/docs/adr/0001-multer-2x.md`
**Contenido sugerido**:
- Status: Accepted
- Context: Vulnerabilidades de Multer 1.x
- Decision: Migrar a 2.x
- Consequences: Mejoras de seguridad
- References: CVE-2022-24434

### 3. `/docs/guides/facturacion.md`
**Contenido sugerido**:
- Descripción del módulo
- Flujo de facturación
- Campos obligatorios
- Validaciones
- Ejemplos

### 4. `/docs/api/endpoints.md`
**Contenido sugerido**:
- POST /api/configuracion
- GET /api/configuracion
- Error handling
- Códigos HTTP

---

## Mantenimiento

### Actualización Periódica
- **Mensual**: Revisar documentación desactualizada
- **Por release**: Actualizar CHANGELOG
- **Por cambio mayor**: Crear ADR

### Deprecación
Cuando un documento se vuelve obsoleto:
```markdown
> ⚠️ **DEPRECADO**: Este documento ha sido reemplazado por [nuevo-documento.md].
> Última actualización válida: 2026-06-01
```

### Versionado
Los documentos siguen versionado semántico:
- `v1.0.0` - Cambios mayores
- `v1.1.0` - Adiciones
- `v1.0.1` - Correcciones

---

## Conclusión

Esta estructura asegura que ECL-Fruver mantega documentación:
- ✅ Organizada y fácil de navegar
- ✅ Actualizada y relevante
- ✅ Profesional y consistente
- ✅ Escalable para crecimiento futuro

**Próximo Paso**: Crear cada documento según las guías de esta especificación.
