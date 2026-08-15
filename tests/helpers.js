const { Client } = require('pg');
const argon2 = require('argon2');

async function truncateAll() {
    const client = new Client({
        user: process.env.DB_USER || 'tumifact_user',
        password: process.env.DB_PASSWORD || 'tumifact_password',
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        database: process.env.DB_DATABASE || 'tumifact_test'
    });

    await client.connect();
    try {
        await client.query(`
            TRUNCATE productos, clientes, facturas, detalle_factura, configuracion_impresion,
                     usuarios, empleados, sesiones_caja, categorias_producto, proveedores,
                     descuentos, separados, separados_productos, abonos_separado, devoluciones,
                     detalle_devolucion, movimientos_inventario, audit_log RESTART IDENTITY CASCADE
        `);

        // Re-seed roles y tipos
        await client.query(`
            INSERT INTO tipos_identificacion (codigo, nombre, aplica_a) VALUES
                ('CC', 'Cédula de Ciudadanía', 'persona'),
                ('NIT', 'Número de Identificación Tributaria', 'empresa')
            ON CONFLICT (codigo) DO NOTHING;

            INSERT INTO roles (nombre, descripcion, permisos) VALUES
                ('admin', 'Administrador', '{"admin":true}'::jsonb),
                ('gerente', 'Gerente', '{"ventas":true}'::jsonb),
                ('empleado', 'Empleado', '{"caja":true}'::jsonb)
            ON CONFLICT (nombre) DO NOTHING;
        `);

        // Re-seed default admin user with ID 1
        const hash = await argon2.hash('Password*2026');
        await client.query(`
            INSERT INTO usuarios (id, nombre, apellido, numero_identificacion, email, password_hash, rol_id, activo)
            VALUES (1, 'Hack', 'Tu', '10000001', 'admin@tumifact.com', '${hash}', 1, true)
            ON CONFLICT (id) DO NOTHING;
        `);
    } finally {
        await client.end();
    }
}

module.exports = { truncateAll };
