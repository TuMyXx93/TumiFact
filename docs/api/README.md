# API - ECL FRUVER

> **Status**: ✅ Producción | v1.0.0  
> **Última Actualización**: 12 de Julio de 2026  
> **Base URL**: `http://localhost:3000`

---

## Índice de API

1. **[Endpoints](endpoints.md)** - Lista completa de endpoints disponibles
2. **[Autenticación](authentication.md)** - Cómo autenticarse
3. **[Códigos de Error](errors.md)** - Referencia de errores HTTP

---

## Visión General

### Convenciones REST

- **Base URL**: `http://localhost:3000/api`
- **Método por operación**:
  - `GET` - Consultar datos
  - `POST` - Crear recurso
  - `PUT` - Actualizar completo
  - `PATCH` - Actualización parcial
  - `DELETE` - Eliminar

### Estructura de Respuesta

**Éxito (200, 201)**:
```json
{
  "status": "success",
  "data": { /* datos */ },
  "message": "Operación exitosa"
}
```

**Error (4xx, 5xx)**:
```json
{
  "status": "error",
  "code": "ERROR_CODE",
  "message": "Descripción del error",
  "details": { /* contexto adicional */ }
}
```

---

## Endpoints Principales

### Configuración (Facturación)

#### `GET /api/configuracion`
Obtiene la configuración actual del sistema.

```bash
curl http://localhost:3000/api/configuracion
```

#### `POST /api/configuracion`
Actualiza la configuración con logo y QR (multipart).

```bash
curl -X POST http://localhost:3000/api/configuracion \
  -F "nombre_negocio=ECL FRUVER" \
  -F "direccion=Calle 123" \
  -F "logo=@logo.png" \
  -F "qr=@qr.png"
```

Ver [Endpoints](endpoints.md) para documentación completa.

---

## Validación de Archivos

### Multer 2.x - Seguridad Mejorada

**Validación Dual**:
1. ✅ MIME type (detección de tipo real)
2. ✅ Extensión de archivo (validación de nombre)

**Límites**:
- Tamaño máximo: **5MB**
- Tipos permitidos: `JPG`, `PNG`, `GIF`

**Códigos de Error**:
- `413` - Archivo muy grande
- `400` - Formato inválido
- `422` - Fallo de validación

Ver [Seguridad](../adr/0001-multer-2x-security.md) para detalles.

---

## Códigos HTTP

| Código | Significado |
|---|---|
| `200` | OK - Operación exitosa |
| `201` | Created - Recurso creado |
| `400` | Bad Request - Datos inválidos |
| `401` | Unauthorized - No autenticado |
| `403` | Forbidden - No autorizado |
| `404` | Not Found - No encontrado |
| `413` | Payload Too Large - Archivo muy grande |
| `422` | Unprocessable Entity - Validación fallida |
| `500` | Internal Server Error - Error del servidor |

Ver [Códigos de Error](errors.md) para detalle completo.

---

## Autenticación

> **Estado**: Por implementar en fase futura

Actualmente el API no requiere autenticación. Consulta [Autenticación](authentication.md) para preparación futura.

---

## Rate Limiting

> **Estado**: Por implementar

Para producción, se implementará rate limiting. Ver [Migraciones Futuras](../guides/migraciones-futuras.md).

---

## Versioning

### Estrategia
- **Ruta**: `/api/v1/`, `/api/v2/`, etc.
- **URL única**: Se mantiene versión actual
- **Deprecación**: 3 meses de aviso antes de remover

### Versión Actual
- **v1** (Stable)

---

## Ejemplos Prácticos

### cURL
```bash
# Obtener configuración
curl http://localhost:3000/api/configuracion

# Actualizar configuración
curl -X POST http://localhost:3000/api/configuracion \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_negocio": "ECL FRUVER",
    "direccion": "Calle 123 #456",
    "telefono": "+57 123456789"
  }'
```

### JavaScript/Fetch
```javascript
// Obtener datos
const response = await fetch('http://localhost:3000/api/configuracion');
const data = await response.json();
console.log(data);

// Actualizar con archivo
const formData = new FormData();
formData.append('nombre_negocio', 'ECL FRUVER');
formData.append('logo', logoFile);

const response = await fetch('http://localhost:3000/api/configuracion', {
  method: 'POST',
  body: formData
});
```

### Python
```python
import requests

# GET
response = requests.get('http://localhost:3000/api/configuracion')
print(response.json())

# POST con archivo
files = {
    'logo': open('logo.png', 'rb'),
    'qr': open('qr.png', 'rb')
}
data = {'nombre_negocio': 'ECL FRUVER'}

response = requests.post(
    'http://localhost:3000/api/configuracion',
    data=data,
    files=files
)
```

---

## Herramientas Recomendadas

- **[Postman](https://www.postman.com/)** - Cliente REST con UI
- **[cURL](https://curl.se/)** - Cliente CLI para pruebas
- **[Insomnia](https://insomnia.rest/)** - Alternativa a Postman
- **[REST Client (VS Code)](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)** - Extensión de código

---

## Documentos Relacionados

- [Endpoints Completo](endpoints.md) - Referencia detallada
- [Códigos de Error](errors.md) - Errores y soluciones
- [Migración Multer 2.x](../adr/0001-multer-2x-migration.md) - Mejoras de seguridad
- [Arquitectura](../architecture/) - Decisiones técnicas

---

*Para contribuciones, ve a [Estándares de Documentación](../DOCUMENTACION_ESTANDARES.md)*
