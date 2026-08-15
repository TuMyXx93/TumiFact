import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'tumifact_db',
  user: process.env.DB_USER || 'tumifact_user',
  password: process.env.DB_PASSWORD || 'tumifact_password'
});

async function seedModernCatalog() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Sembrando catálogo multi-categoría enriquecido (2026)...');

    // 1. Obtener IDs de categorías
    const catRows = await client.query('SELECT id, nombre, tipo FROM categorias_producto');
    const catMap: Record<string, number> = {};
    for (const row of catRows.rows) {
      catMap[row.tipo] = row.id;
    }

    const demoProducts = [
      // PRENDAS DE VESTIR
      {
        codigo: 'VEST-POLO-001',
        nombre: 'Camiseta Polo Piqué Algodón',
        descripcion: 'Camiseta clásica 100% algodón peinado, corte regular fit.',
        categoria_id: catMap['vestimenta'],
        precio_detal: 45000,
        precio_mayorista: 35000,
        cantidad_mayorista: 12,
        stock_actual: 80,
        stock_minimo: 10,
        atributos: { talla: 'L', color: 'Azul Marino', genero: 'Hombre', composicion: '100% Algodón' }
      },
      {
        codigo: 'VEST-JEAN-002',
        nombre: 'Jean Denim Clásico Stretch',
        descripcion: 'Pantalón jean azul índigo con elastano para máxima comodidad.',
        categoria_id: catMap['vestimenta'],
        precio_detal: 89000,
        precio_mayorista: 68000,
        cantidad_mayorista: 6,
        stock_actual: 45,
        stock_minimo: 5,
        atributos: { talla: '32', color: 'Azul Índigo', genero: 'Hombre' }
      },

      // TECNOLOGÍA
      {
        codigo: 'TEC-AUDI-001',
        nombre: 'Audífonos Bluetooth Noise Cancelling AU-88',
        descripcion: 'Cancelación activa de ruido, 30h de batería, carga rápida USB-C.',
        categoria_id: catMap['tecnologia'],
        precio_detal: 189000,
        precio_mayorista: 145000,
        cantidad_mayorista: 5,
        stock_actual: 30,
        stock_minimo: 4,
        atributos: { marca: 'AcousticPro', serial: 'SN-AU88-99201', garantia_dias: 365 }
      },
      {
        codigo: 'TEC-CABL-002',
        nombre: 'Cable Carga Rápida 65W Trenzado',
        descripcion: 'Cable USB-C a USB-C con chip E-Marker y refuerzo de nylon.',
        categoria_id: catMap['tecnologia'],
        precio_detal: 28000,
        precio_mayorista: 19000,
        cantidad_mayorista: 20,
        stock_actual: 120,
        stock_minimo: 15,
        atributos: { marca: 'PowerFast', longitud: '2 metros', garantia_dias: 180 }
      },

      // CALZADO
      {
        codigo: 'CALZ-TENIS-001',
        nombre: 'Tenis Running Ultralight TU-220',
        descripcion: 'Calzado deportivo con amortiguación EVA y suela de caucho antideslizante.',
        categoria_id: catMap['calzado'],
        precio_detal: 189000,
        precio_mayorista: 149000,
        cantidad_mayorista: 6,
        stock_actual: 35,
        stock_minimo: 5,
        atributos: { talla_calzado: 41, color: 'Negro / Naranja', material: 'Malla transpirable' }
      },

      // ARTESANÍAS
      {
        codigo: 'ART-MOCH-001',
        nombre: 'Mochila Wayuu Tradicional',
        descripcion: 'Tejida a mano en un solo hilo con figuras geométricas sagradas.',
        categoria_id: catMap['artesania'],
        precio_detal: 220000,
        precio_mayorista: 175000,
        cantidad_mayorista: 4,
        stock_actual: 15,
        stock_minimo: 2,
        atributos: { artesano: 'Comunidad Wayuu', origen: 'La Guajira', material_principal: 'Algodón acrílico' }
      },

      // BISUTERÍA
      {
        codigo: 'BIS-ARET-001',
        nombre: 'Aretes Filigrana Baño de Oro 24K',
        descripcion: 'Aretes artesanales livianos con micro-circones incrustados.',
        categoria_id: catMap['bisuteria'],
        precio_detal: 59000,
        precio_mayorista: 42000,
        cantidad_mayorista: 10,
        stock_actual: 50,
        stock_minimo: 8,
        atributos: { material: 'Baño de Oro 24K', piedra: 'Zirconia Cúbica', peso_gr: 4.5 }
      },

      // PERECEDEROS / ALIMENTOS
      {
        codigo: 'ALIM-YOG-001',
        nombre: 'Yogurt Griego Natural 1000g',
        descripcion: 'Sin azúcar añadida, alto en proteína natural (15g por porción).',
        categoria_id: catMap['perecedero'],
        precio_detal: 18500,
        precio_mayorista: 15000,
        cantidad_mayorista: 12,
        stock_actual: 40,
        stock_minimo: 10,
        atributos: { fecha_vencimiento: '2026-09-15', temperatura_conservacion: '4°C a 8°C' }
      }
    ];

    for (const p of demoProducts) {
      if (!p.categoria_id) continue;
      await client.query(`
        INSERT INTO productos (
          codigo, nombre, descripcion, categoria_id,
          precio_detal, precio_mayorista, cantidad_mayorista,
          precio_unidad, precio_kg, precio_libra,
          stock_actual, stock_minimo, atributos
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (codigo) DO UPDATE SET
          nombre = $2,
          descripcion = $3,
          categoria_id = $4,
          precio_detal = $5,
          precio_mayorista = $6,
          cantidad_mayorista = $7,
          precio_unidad = $8,
          precio_kg = $9,
          precio_libra = $10,
          stock_actual = $11,
          stock_minimo = $12,
          atributos = $13;
      `, [
        p.codigo,
        p.nombre,
        p.descripcion,
        p.categoria_id,
        p.precio_detal,
        p.precio_mayorista,
        p.cantidad_mayorista,
        p.precio_detal,
        p.precio_detal,
        Math.round(p.precio_detal / 2),
        p.stock_actual,
        p.stock_minimo,
        JSON.stringify(p.atributos)
      ]);
    }

    await client.query('COMMIT');
    console.log('✅ Catálogo multi-categoría sembrado con éxito.');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error sembrando catálogo:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

seedModernCatalog();
