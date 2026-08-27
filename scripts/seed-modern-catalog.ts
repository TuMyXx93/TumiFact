import dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_DATABASE || 'tumifact_db',
  user: process.env.DB_USER || 'tumifact_user',
  password: process.env.DB_PASSWORD || 'tumifact_password',
});

async function seedModernCatalog() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    console.log('🚀 Sembrando catálogo oficial 2026: Ropa, Tecnología, Calzado y Artículos...');

    // 1. Asegurar categorías oficiales
    await client.query(`
      INSERT INTO categorias_producto (nombre, tipo, descripcion, campos_extra, activo) VALUES
        ('Ropa', 'ropa', 'Prendas de vestir, confección, camisas, pantalones y moda', '[{"key":"talla","label":"Talla","type":"string"},{"key":"color","label":"Color","type":"string"},{"key":"genero","label":"Género","type":"select","options":["Hombre","Mujer","Unisex","Niño","Niña"]},{"key":"material","label":"Material","type":"string"}]'::jsonb, true),
        ('Tecnología', 'tecnologia', 'Equipos electrónicos, cómputo, audio y accesorios', '[{"key":"marca","label":"Marca","type":"string"},{"key":"modelo","label":"Modelo","type":"string"},{"key":"serial","label":"Número Serial","type":"string"},{"key":"garantia_meses","label":"Meses de Garantía","type":"number"}]'::jsonb, true),
        ('Calzado', 'calzado', 'Zapatos, tenis, botas y sandalias', '[{"key":"talla_calzado","label":"Talla de Calzado","type":"number"},{"key":"color","label":"Color","type":"string"},{"key":"material","label":"Material","type":"string"},{"key":"genero","label":"Género","type":"select","options":["Hombre","Mujer","Unisex","Niño","Niña"]}]'::jsonb, true),
        ('Artículos', 'articulos', 'Artículos varios, accesorios y miscelánea general del POS', '[{"key":"marca","label":"Marca","type":"string"},{"key":"referencia","label":"Referencia / Modelo","type":"string"},{"key":"presentacion","label":"Presentación","type":"string"}]'::jsonb, true)
      ON CONFLICT (nombre) DO UPDATE SET
        tipo = EXCLUDED.tipo,
        descripcion = EXCLUDED.descripcion,
        campos_extra = EXCLUDED.campos_extra,
        activo = EXCLUDED.activo;
    `);

    // Desactivar o eliminar categorías obsoletas
    await client.query(`
      UPDATE categorias_producto 
      SET activo = false 
      WHERE tipo IN ('perecedero', 'artesania', 'bisuteria', 'generico') 
         OR nombre IN ('Perecederos', 'Artesanías', 'Bisutería', 'Genérico', 'Prendas de Vestir');
    `);

    // 2. Obtener IDs de categorías activas
    const catRows = await client.query(
      'SELECT id, nombre, tipo FROM categorias_producto WHERE activo = true'
    );
    const catMap: Record<string, number> = {};
    for (const row of catRows.rows) {
      catMap[row.tipo] = row.id;
      catMap[row.nombre.toLowerCase()] = row.id;
    }

    const ropaId = catMap['ropa'];
    const tecId = catMap['tecnologia'];
    const calzId = catMap['calzado'];
    const artId = catMap['articulos'];

    const demoProducts = [
      // 1. ROPA
      {
        codigo: 'ROPA-POLO-001',
        nombre: 'Camiseta Polo Piqué Algodón',
        descripcion: 'Camiseta clásica 100% algodón peinado, corte regular fit.',
        categoria_id: ropaId,
        precio_detal: 45000,
        precio_mayorista: 35000,
        cantidad_mayorista: 12,
        stock_actual: 80,
        stock_minimo: 10,
        atributos: {
          talla: 'L',
          color: 'Azul Marino',
          genero: 'Hombre',
          material: '100% Algodón Piqué',
        },
      },
      {
        codigo: 'ROPA-JEAN-002',
        nombre: 'Jean Denim Clásico Stretch',
        descripcion: 'Pantalón jean azul índigo con elastano para máxima comodidad.',
        categoria_id: ropaId,
        precio_detal: 89000,
        precio_mayorista: 68000,
        cantidad_mayorista: 6,
        stock_actual: 45,
        stock_minimo: 5,
        atributos: {
          talla: '32',
          color: 'Azul Índigo',
          genero: 'Hombre',
          material: 'Denim 98% Algodón 2% Elastano',
        },
      },
      {
        codigo: 'ROPA-BLUS-003',
        nombre: 'Blusa Casual Seda Studio',
        descripcion: 'Blusa manga larga elegante para oficina y eventos casuales.',
        categoria_id: ropaId,
        precio_detal: 65000,
        precio_mayorista: 48000,
        cantidad_mayorista: 8,
        stock_actual: 60,
        stock_minimo: 8,
        atributos: {
          talla: 'M',
          color: 'Blanco Perla',
          genero: 'Mujer',
          material: 'Seda Poliéster',
        },
      },

      // 2. TECNOLOGÍA
      {
        codigo: 'TEC-AUDI-001',
        nombre: 'Audífonos Bluetooth Noise Cancelling AU-88',
        descripcion: 'Cancelación activa de ruido, 30h de batería, carga rápida USB-C.',
        categoria_id: tecId,
        precio_detal: 189000,
        precio_mayorista: 145000,
        cantidad_mayorista: 5,
        stock_actual: 30,
        stock_minimo: 4,
        atributos: {
          marca: 'AcousticPro',
          modelo: 'AU-88 Max',
          serial: 'SN-AU88-99201',
          garantia_meses: 12,
        },
      },
      {
        codigo: 'TEC-CABL-002',
        nombre: 'Cable Carga Rápida 65W Trenzado 2M',
        descripcion: 'Cable USB-C a USB-C con chip E-Marker y refuerzo de nylon.',
        categoria_id: tecId,
        precio_detal: 28000,
        precio_mayorista: 19000,
        cantidad_mayorista: 20,
        stock_actual: 120,
        stock_minimo: 15,
        atributos: {
          marca: 'PowerFast',
          modelo: 'CC-65W-2M',
          serial: 'CBL-2026-65W',
          garantia_meses: 6,
        },
      },
      {
        codigo: 'TEC-MOU-003',
        nombre: 'Mouse Inalámbrico Ergonómico Silent',
        descripcion: 'Sensor óptico 2400 DPI, clics silenciosos y conexión 2.4GHz + BT.',
        categoria_id: tecId,
        precio_detal: 55000,
        precio_mayorista: 39000,
        cantidad_mayorista: 10,
        stock_actual: 50,
        stock_minimo: 8,
        atributos: {
          marca: 'TechPro',
          modelo: 'M-Silent-Ergo',
          serial: 'SN-MO24-001',
          garantia_meses: 12,
        },
      },

      // 3. CALZADO
      {
        codigo: 'CALZ-TENIS-001',
        nombre: 'Tenis Running Ultralight TU-220',
        descripcion: 'Calzado deportivo con amortiguación EVA y suela de caucho antideslizante.',
        categoria_id: calzId,
        precio_detal: 189000,
        precio_mayorista: 149000,
        cantidad_mayorista: 6,
        stock_actual: 35,
        stock_minimo: 5,
        atributos: {
          talla_calzado: 41,
          color: 'Negro / Naranja',
          material: 'Malla transpirable / EVA',
          genero: 'Hombre',
        },
      },
      {
        codigo: 'CALZ-MOCA-002',
        nombre: 'Mocasines Cuero Clásico Ejecutivo',
        descripcion: 'Zapatos en 100% cuero vacuno legítimo con plantilla confort.',
        categoria_id: calzId,
        precio_detal: 210000,
        precio_mayorista: 165000,
        cantidad_mayorista: 4,
        stock_actual: 25,
        stock_minimo: 4,
        atributos: {
          talla_calzado: 40,
          color: 'Café Miel',
          material: 'Cuero Natural',
          genero: 'Hombre',
        },
      },
      {
        codigo: 'CALZ-SAND-003',
        nombre: 'Sandalias Plataforma Cuña Soft',
        descripcion: 'Sandalias ligeras de verano con suela de corcho y capellada suave.',
        categoria_id: calzId,
        precio_detal: 125000,
        precio_mayorista: 95000,
        cantidad_mayorista: 6,
        stock_actual: 40,
        stock_minimo: 6,
        atributos: {
          talla_calzado: 37,
          color: 'Beige Arena',
          material: 'Sintético Premium',
          genero: 'Mujer',
        },
      },

      // 4. ARTÍCULOS (NUEVA FAMILIA)
      {
        codigo: 'ART-TERMO-001',
        nombre: 'Termo Acero Inoxidable 750ml Térmico',
        descripcion:
          'Mantiene bebidas frías por 24h y calientes por 12h, tapa hermética antifugas.',
        categoria_id: artId,
        precio_detal: 45000,
        precio_mayorista: 32000,
        cantidad_mayorista: 12,
        stock_actual: 65,
        stock_minimo: 8,
        atributos: { marca: 'HydroCold', referencia: 'HC-750-SS', presentacion: 'Unidad con caja' },
      },
      {
        codigo: 'ART-ORGA-002',
        nombre: 'Organizador de Escritorio Multifuncional',
        descripcion: 'Bandeja metálica con portalápices, tarjetero y compartimento de notas.',
        categoria_id: artId,
        precio_detal: 38000,
        precio_mayorista: 26000,
        cantidad_mayorista: 10,
        stock_actual: 40,
        stock_minimo: 5,
        atributos: {
          marca: 'DeskMaster',
          referencia: 'DM-ORG-4P',
          presentacion: 'Caja individual',
        },
      },
      {
        codigo: 'ART-LIBRE-003',
        nombre: 'Cuaderno Agenda Ejecutiva Tapa Dura 160 Hojas',
        descripcion: 'Papel ecológico 90g con cinta separadora y bolsillo interno.',
        categoria_id: artId,
        precio_detal: 24000,
        precio_mayorista: 16500,
        cantidad_mayorista: 20,
        stock_actual: 90,
        stock_minimo: 15,
        atributos: {
          marca: 'NoteCraft',
          referencia: 'NC-AG2026-A5',
          presentacion: 'Empaque retractilado',
        },
      },
    ];

    for (const p of demoProducts) {
      if (!p.categoria_id) continue;
      await client.query(
        `
        INSERT INTO productos (
          codigo, nombre, descripcion, categoria_id,
          precio_detal, precio_mayorista, cantidad_mayorista,
          precio_unidad, precio_kg, precio_libra,
          stock_actual, stock_minimo, atributos, activo
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)
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
          atributos = $13,
          activo = true;
      `,
        [
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
          JSON.stringify(p.atributos),
        ]
      );
    }

    await client.query('COMMIT');
    console.log(
      '✅ Catálogo oficial 2026 sembrado con éxito (Ropa, Tecnología, Calzado, Artículos).'
    );
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('❌ Error sembrando catálogo:', e);
  } finally {
    client.release();
    await pool.end();
  }
}

seedModernCatalog();
