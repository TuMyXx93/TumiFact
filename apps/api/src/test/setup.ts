import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../generated/prisma/client';

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

const ROLES = [
  { nombre: 'admin', descripcion: 'Administrador', permisos: { admin: true } },
  {
    nombre: 'gerente',
    descripcion: 'Gerente',
    permisos: {
      ventas: true,
      reportes: true,
      'descuentos:aprobar': true,
      'descuentos:gestionar': true,
    },
  },
  { nombre: 'empleado', descripcion: 'Empleado', permisos: { caja: true, ventas: true } },
];

const USUARIOS = [
  { id: 1, nombre: 'Hack', apellido: 'Tu', email: 'admin@tumifact.com', rol: 'admin' },
  { id: 2, nombre: 'Carlos', apellido: 'Gerente', email: 'gerente@tumifact.com', rol: 'gerente' },
  { id: 3, nombre: 'Kelly', apellido: 'Morales', email: 'kelly@tumifact.com', rol: 'empleado' },
];

/**
 * Aísla cada archivo de test: limpia los datos y re-siembra el catálogo base
 * (roles, tipos de identificación, categorías, usuarios de prueba).
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE productos, clientes, facturas, detalle_factura, configuracion_impresion,
             usuarios, empleados, sesiones_caja, categorias_producto, proveedores,
             descuentos, separados, separados_productos, abonos_separado, devoluciones,
             detalle_devolucion, movimientos_inventario, audit_log, auth_sessions
    RESTART IDENTITY CASCADE
  `);

  await prisma.$executeRawUnsafe(`
    INSERT INTO tipos_identificacion (codigo, nombre, aplica_a) VALUES
      ('CC', 'Cédula de Ciudadanía', 'persona'),
      ('NIT', 'Número de Identificación Tributaria', 'empresa')
    ON CONFLICT (codigo) DO NOTHING;
  `);

  for (const rol of ROLES) {
    await prisma.roles.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion, permisos: rol.permisos },
      create: { nombre: rol.nombre, descripcion: rol.descripcion, permisos: rol.permisos },
    });
  }

  const roles = await prisma.roles.findMany();
  const rolId = (nombre: string) => roles.find((r) => r.nombre === nombre)!.id;

  await prisma.categorias_producto.upsert({
    where: { nombre: 'General' },
    update: {},
    create: { nombre: 'General', tipo: 'generico', activo: true },
  });

  const hash = await argon2.hash('Password*2026');
  for (const usuario of USUARIOS) {
    await prisma.usuarios.upsert({
      where: { email: usuario.email },
      update: {},
      create: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        email: usuario.email,
        password_hash: hash,
        rol_id: rolId(usuario.rol),
        activo: true,
      },
    });
    const esGerente = usuario.rol === 'gerente';
    const esAdmin = usuario.rol === 'admin';
    await prisma.empleados.upsert({
      where: { usuario_id: usuario.id },
      update: {},
      create: {
        usuario_id: usuario.id,
        cargo: esAdmin ? 'Administrador General' : esGerente ? 'Gerente de Tienda' : 'Cajero POS',
        departamento: 'Caja',
        turno: 'completo',
        descuento_max_porcentaje: esAdmin ? 100 : esGerente ? 50 : 5,
        descuento_max_monto: esAdmin ? 99999999 : esGerente ? 500000 : 50000,
      },
    });
  }

  await prisma.$executeRawUnsafe(
    `SELECT setval('usuarios_id_seq', (SELECT MAX(id) FROM usuarios))`
  );
  await prisma.$executeRawUnsafe(
    `SELECT setval('empleados_id_seq', (SELECT MAX(id) FROM empleados))`
  );

  // Catálogo de descuentos: el motor necesita descuentos vigentes.
  const descuentos = [
    {
      nombre: 'Promo linea 10%',
      tipo: 'porcentaje',
      valor: 10,
      aplica_a: 'linea',
      requiere_aprobacion: false,
    },
    {
      nombre: 'Promo total 5%',
      tipo: 'porcentaje',
      valor: 5,
      aplica_a: 'total',
      requiere_aprobacion: false,
    },
    {
      nombre: 'Cupon 20000',
      tipo: 'monto_fijo',
      valor: 20000,
      aplica_a: 'total',
      requiere_aprobacion: true,
    },
  ];
  for (const d of descuentos) {
    const existente = await prisma.descuentos.findFirst({ where: { nombre: d.nombre } });
    if (!existente) {
      await prisma.descuentos.create({ data: { ...d, activo: true } });
    }
  }

  // Cliente base: ventas y separados exigen un cliente válido.
  await prisma.clientes.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      nombre: 'Cliente',
      apellido: 'Test',
      tipo_cliente: 'detal',
      activo: true,
    },
  });
  await prisma.$executeRawUnsafe(
    `SELECT setval('clientes_id_seq', (SELECT MAX(id) FROM clientes))`
  );

  // Catálogo mínimo: el POS necesita productos para vender y cambiar.
  const categoria = await prisma.categorias_producto.findUniqueOrThrow({
    where: { nombre: 'General' },
  });
  const productos = [
    { codigo: 'TEST-001', nombre: 'Producto Test A', precio: 1000, stock: 50 },
    { codigo: 'TEST-002', nombre: 'Producto Test B', precio: 2500, stock: 50 },
    { codigo: 'TEST-003', nombre: 'Producto Test C', precio: 500, stock: 50 },
  ];
  for (const p of productos) {
    await prisma.productos.upsert({
      where: { codigo: p.codigo },
      update: {},
      create: {
        codigo: p.codigo,
        nombre: p.nombre,
        categoria_id: categoria.id,
        precio_detal: p.precio,
        precio_unidad: p.precio,
        stock_actual: p.stock,
        stock_minimo: 2,
        activo: true,
      },
    });
  }
}

export async function disconnect() {
  await prisma.$disconnect();
}
