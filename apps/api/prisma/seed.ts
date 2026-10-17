import { PrismaPg } from '@prisma/adapter-pg';
import argon2 from 'argon2';
import { PrismaClient } from '../src/generated/prisma/client';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const adminRole = await prisma.roles.upsert({
    where: { nombre: 'admin' },
    update: {},
    create: { nombre: 'admin', permisos: { admin: true } },
  });

  await prisma.usuarios.upsert({
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
      stock_actual: 10,
      stock_minimo: 2,
      activo: true,
    },
  });

  console.log('Seed sintético completado');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
