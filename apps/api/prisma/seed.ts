import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const ROLES = [
  { nombre: 'admin', descripcion: 'Control total del sistema', permisos: { admin: true } },
  {
    nombre: 'gerente',
    descripcion: 'Gestión de tienda, reportes y aprobaciones',
    permisos: { reportes: true, empleados: true, cajas: true, devoluciones: true },
  },
  {
    nombre: 'empleado',
    descripcion: 'Operación de caja y ventas',
    permisos: { ventas: true, caja_abrir: true, clientes: true },
  },
];

async function main() {
  // 1) Roles canónicos
  for (const rol of ROLES) {
    await prisma.roles.upsert({
      where: { nombre: rol.nombre },
      update: { descripcion: rol.descripcion, permisos: rol.permisos },
      create: { nombre: rol.nombre, descripcion: rol.descripcion, permisos: rol.permisos },
    });
  }

  const adminRole = await prisma.roles.findUniqueOrThrow({ where: { nombre: 'admin' } });
  const empleadoRole = await prisma.roles.findUniqueOrThrow({ where: { nombre: 'empleado' } });

  // 2) Usuario admin
  const admin = await prisma.usuarios.upsert({
    where: { email: 'admin@tumifact.com' },
    update: {},
    create: {
      nombre: 'Admin',
      apellido: 'TumiFact',
      email: 'admin@tumifact.com',
      password_hash: await argon2.hash('Password*2026'),
      rol_id: adminRole.id,
      activo: true,
    },
  });

  // 3) Empleado de caja (multi-cajero verificable)
  await prisma.usuarios.upsert({
    where: { email: 'kelly@tumifact.com' },
    update: {},
    create: {
      nombre: 'Kelly',
      apellido: 'Morales',
      email: 'kelly@tumifact.com',
      password_hash: await argon2.hash('Password*2026'),
      rol_id: empleadoRole.id,
      activo: true,
    },
  });

  // 4) Catálogo mínimo
  const categoria = await prisma.categorias_producto.upsert({
    where: { nombre: 'General' },
    update: {},
    create: { nombre: 'General', tipo: 'generico', activo: true },
  });

  await prisma.productos.upsert({
    where: { codigo: 'SEED-001' },
    update: {},
    create: {
      codigo: 'SEED-001',
      nombre: 'Producto Seed',
      categoria_id: categoria.id,
      precio_detal: 1000,
      stock_actual: 100,
      stock_minimo: 2,
      activo: true,
    },
  });

  console.log(`Seed sintético completado (admin id=${admin.id}, roles=${ROLES.length})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
