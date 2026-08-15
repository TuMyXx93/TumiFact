# API REST & WebSockets — TumiFact 🔌

> **Status**: ✅ Producción | v2.0.0  
> **Base URL**: `http://localhost:3000/api`  
> **Protocolos**: HTTP/1.1 REST (JSON) + WebSockets (Socket.io)

---

## 📋 Índice de Documentación de API

1. **[Especificación de Endpoints v2](endpoints.md)** — Lista exhaustiva de rutas, payloads y respuestas JSON.
2. **Autenticación & Seguridad** — Tokens JWT, Cookies seguras y Headers de Idempotencia.
3. **Eventos en Tiempo Real** — Canales y payloads de Socket.io.

---

## 🔒 Autenticación & Seguridad

### Formato de Cabecera de Autorización
Las solicitudes a rutas protegidas deben incluir el token JWT en el encabezado:
```http
Authorization: Bearer <token_jwt>
```
*Alternativamente, en entornos de navegador (Astro SSR), el token se transmite de forma segura en la cookie `tumifact_token`.*

### Clave de Idempotencia (`Idempotency-Key`)
Para operaciones financieras críticas (`POST /api/facturas`, `POST /api/separados/:id/abonos`), se debe enviar un identificador único en la cabecera:
```http
Idempotency-Key: 550e8400-e29b-41d4-a716-446655440000
```
Si se reintenta la misma solicitud con la misma clave, el servidor retornará la respuesta previamente almacenada sin duplicar la transacción.

---

## 📦 Estructura de Respuesta Estándar

### Respuesta Exitosa (200, 201)
```json
{
  "status": "success",
  "data": { /* recurso o lista */ },
  "message": "Operación realizada con éxito"
}
```

### Respuesta de Error (4xx, 5xx)
```json
{
  "status": "error",
  "error": "Mensaje descriptivo del error",
  "details": [ /* lista de errores de validación si aplica */ ]
}
```

---

## ⚡ Canales de WebSockets (Socket.io)

El servidor emite eventos en tiempo real en los siguientes canales:
* `inventario:actualizado` — Emitido tras ventas, devoluciones o ajustes manuales de stock.
* `caja:actualizada` — Emitido tras aperturas, cierres o transacciones registradas.
* `factura:creada` — Emitido tras cada emisión de comprobante de venta.
