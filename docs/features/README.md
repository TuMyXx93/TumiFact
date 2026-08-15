# Módulos y Funcionalidades — TumiFact 📦

> **Status**: ✅ Producción | v2.0.0

---

## 📋 Módulos del Sistema TumiFact

1. **Terminal Punto de Venta (POS) & Facturación**
   - Emisión ultrarrápida con teclado o lector de código de barras.
   - Cálculo automático de subtotales, impuestos y descuentos por escala (KG, Libra, Unidad, Detal, Mayorista).
   - Impresión térmica con formateo para 80mm y 58mm y decodificación de logo y QR de pagos `BYTEA`.

2. **Control de Sesiones de Caja (Turnos & Arqueos)**
   - Apertura de turnos con base en efectivo.
   - Monitoreo en tiempo real de ventas por método de pago (efectivo, tarjeta, transferencia).
   - Arqueo ciego/declarado con cálculo automático de sobrante o faltante.

3. **Planes de Separado (Layaway)**
   - Creación de planes de apartado de mercancía con reserva automática de stock.
   - Registro de abonos parciales y liquidación final.
   - Alertas de vencimiento de plazos configurables.

4. **Inventario, Stock & Kardex**
   - Control de existencias en tiempo real con alertas de stock mínimo.
   - Registro cronológico de movimientos (Kardex: entradas, salidas por venta, devoluciones, ajustes).
   - Sincronización multi-dispositivo vía WebSockets (Socket.io).

5. **Directorio Normalizado de Clientes & Proveedores**
   - Información tributaria estructurada con tipos de identificación oficial y direcciones normalizadas (3NF).
   - Historial de compras y saldo acumulado por cliente.

6. **Reportes Financieros & Exportaciones**
   - Exportación de ventas, cierres de caja e inventario en formatos PDF y CSV.

7. **Gestión Integral de Colaboradores & Empleados**
   - Directorio de colaboradores con asignación de roles RBAC (`admin`, `gerente`, `empleado`), turnos y políticas salariales.
   - Modal de creación y edición avanzada con medidor semaforizado de seguridad de contraseña y doble confirmación.
   - Pestaña de **Métricas de Rendimiento**: total facturado por empleado, tickets promedio y cumplimiento de arqueos de caja.
   - Pestaña de **Auditoría de Actividad**: logs inmutables con IP, agente de usuario, entidad afectada y timestamp.

8. **Supervisión Global de Cajas & Empleados en Vivo (Dashboard)**
   - Monitoreo en tiempo real de cajeros conectados, turnos iniciados y monto acumulado por terminal.
   - Cálculo dinámico de horas trabajadas y visualización contextual según permisos de rol.
   - Sincronización instantánea vía WebSockets (Socket.io).

9. **Seguridad y Cierre de Sesión Confiable**
   - Endpoint de cierre de sesión server-side (`/logout`) que elimina cookies con cabecera `Set-Cookie: Expires=1970` para prevenir condiciones de carrera.
   - Middleware de protección de rutas JWT y RBAC en Astro SSR y API Express.

