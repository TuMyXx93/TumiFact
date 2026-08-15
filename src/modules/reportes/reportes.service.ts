import PDFDocument from 'pdfkit';
import { db } from '../../db';
import { facturas } from '../../db/schema/facturas';
import { clientes } from '../../db/schema/clientes';
import { usuarios } from '../../db/schema/usuarios';
import { productos } from '../../db/schema/productos';
import { categoriasProducto } from '../../db/schema/categorias';
import { separados } from '../../db/schema/separados';
import { configuracionImpresion } from '../../db/schema/configuracion';
import { sesionesCaja } from '../../db/schema/sesiones_caja';
import { eq, desc, gte, lte, and, sql } from 'drizzle-orm';
import { formatNumber, formatDate } from '../../lib/format';

export interface FiltrosReporteVentas {
  desde?: string;
  hasta?: string;
  usuario_id?: number;
  forma_pago?: string;
  estado?: string;
}

export class ReportesService {
  private async getConfig() {
    const configRows = await db.select().from(configuracionImpresion).limit(1);
    return configRows[0] || {
      nombre_negocio: 'TumiFact Store',
      nit: '900.123.456-7',
      direccion: 'Bogotá, Colombia',
      telefono: '+57 300 123 4567'
    };
  }

  async getVentasData(filtros: FiltrosReporteVentas) {
    const conditions = [];

    if (filtros.desde) {
      conditions.push(gte(facturas.fecha, new Date(`${filtros.desde}T00:00:00.000`)));
    }
    if (filtros.hasta) {
      conditions.push(lte(facturas.fecha, new Date(`${filtros.hasta}T23:59:59.999`)));
    }
    if (filtros.usuario_id) {
      conditions.push(eq(facturas.usuario_id, filtros.usuario_id));
    }
    if (filtros.forma_pago) {
      conditions.push(eq(facturas.forma_pago, filtros.forma_pago));
    }
    if (filtros.estado) {
      conditions.push(eq(facturas.estado, filtros.estado));
    }

    let query = db
      .select({
        id: facturas.id,
        fecha: facturas.fecha,
        subtotal: facturas.subtotal,
        descuento_total: facturas.descuento_total,
        total: facturas.total,
        forma_pago: facturas.forma_pago,
        tipo: facturas.tipo,
        estado: facturas.estado,
        cliente_nombre: clientes.nombre,
        cliente_apellido: clientes.apellido,
        cajero_nombre: usuarios.nombre
      })
      .from(facturas)
      .leftJoin(clientes, eq(facturas.cliente_id, clientes.id))
      .leftJoin(usuarios, eq(facturas.usuario_id, usuarios.id));

    if (conditions.length > 0) {
      return await query.where(and(...conditions)).orderBy(desc(facturas.fecha));
    }

    return await query.orderBy(desc(facturas.fecha));
  }

  // Generar CSV de ventas
  async generateVentasCSV(filtros: FiltrosReporteVentas): Promise<string> {
    const data = await this.getVentasData(filtros);

    const headers = ['ID Factura', 'Fecha', 'Cliente', 'Cajero', 'Forma de Pago', 'Subtotal', 'Descuento', 'Total', 'Tipo', 'Estado'];
    const rows = data.map((f) => [
      f.id,
      f.fecha ? new Date(f.fecha).toISOString() : '',
      `"${((f.cliente_nombre || '') + ' ' + (f.cliente_apellido || '')).trim() || 'Cliente General'}"`,
      `"${f.cajero_nombre || 'Admin'}"`,
      f.forma_pago,
      f.subtotal,
      f.descuento_total,
      f.total,
      f.tipo,
      f.estado
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // Generar PDF de ventas
  async generateVentasPDF(filtros: FiltrosReporteVentas): Promise<Buffer> {
    const config = await this.getConfig();
    const data = await this.getVentasData(filtros);

    let totalRecaudado = 0;
    let totalDescuentos = 0;
    for (const f of data) {
      totalRecaudado += parseFloat(f.total);
      totalDescuentos += parseFloat(f.descuento_total || '0');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 36, size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(18).font('Helvetica-Bold').text(config.nombre_negocio, { align: 'center' });
      doc.fontSize(10).font('Helvetica').text(`NIT: ${config.nit || 'N/A'} | Tel: ${config.telefono || ''}`, { align: 'center' });
      doc.text(config.direccion || '', { align: 'center' });
      doc.moveDown();

      doc.fontSize(14).font('Helvetica-Bold').text('REPORTE CONSOLIDADO DE VENTAS', { align: 'center' });
      doc.fontSize(9).font('Helvetica').text(
        `Período: ${filtros.desde || 'Inicio'} hasta ${filtros.hasta || 'Hoy'} | Generado: ${new Date().toLocaleString('es-CO')}`,
        { align: 'center' }
      );
      doc.moveDown();

      // Resumen KPI Cards en PDF
      doc.fontSize(10).font('Helvetica-Bold');
      doc.text(`Total Facturas: ${data.length} | Total Descuentos: $${formatNumber(totalDescuentos)} | TOTAL RECAUDADO: $${formatNumber(totalRecaudado)}`);
      doc.moveDown(0.5);

      // Tabla de ventas
      doc.font('Helvetica-Bold').fontSize(8);
      let y = doc.y;
      doc.text('#', 36, y, { width: 30 });
      doc.text('Fecha', 70, y, { width: 80 });
      doc.text('Cliente', 155, y, { width: 130 });
      doc.text('Cajero', 290, y, { width: 75 });
      doc.text('Pago', 370, y, { width: 60 });
      doc.text('Total ($)', 435, y, { width: 80, align: 'right' });
      doc.text('Estado', 520, y, { width: 45 });

      doc.moveTo(36, y + 12).lineTo(560, y + 12).stroke();
      doc.font('Helvetica').fontSize(8);

      let currentY = y + 16;
      for (const item of data) {
        if (currentY > 750) {
          doc.addPage();
          currentY = 36;
        }

        const clienteFull = ((item.cliente_nombre || '') + ' ' + (item.cliente_apellido || '')).trim() || 'General';
        doc.text(String(item.id), 36, currentY, { width: 30 });
        doc.text(new Date(item.fecha).toLocaleDateString('es-CO'), 70, currentY, { width: 80 });
        doc.text(clienteFull.substring(0, 22), 155, currentY, { width: 130 });
        doc.text((item.cajero_nombre || 'Admin').substring(0, 12), 290, currentY, { width: 75 });
        doc.text(item.forma_pago.toUpperCase(), 370, currentY, { width: 60 });
        doc.text(`$${formatNumber(parseFloat(item.total))}`, 435, currentY, { width: 80, align: 'right' });
        doc.text(item.estado, 520, currentY, { width: 45 });

        currentY += 14;
      }

      doc.end();
    });
  }

  // Generar CSV de inventario
  async generateInventarioCSV(): Promise<string> {
    const list = await db
      .select({
        id: productos.id,
        codigo: productos.codigo,
        nombre: productos.nombre,
        categoria: categoriasProducto.nombre,
        precio_detal: productos.precio_detal,
        precio_mayorista: productos.precio_mayorista,
        stock_actual: productos.stock_actual,
        stock_minimo: productos.stock_minimo
      })
      .from(productos)
      .leftJoin(categoriasProducto, eq(productos.categoria_id, categoriasProducto.id))
      .where(eq(productos.activo, true))
      .orderBy(productos.nombre);

    const headers = ['ID', 'Código', 'Nombre Producto', 'Categoría', 'Precio Detal', 'Precio Mayorista', 'Stock Actual', 'Stock Mínimo', 'Estado Stock'];
    const rows = list.map((p) => {
      const stock = parseFloat(p.stock_actual);
      const min = parseFloat(p.stock_minimo);
      const estado = stock <= 0 ? 'AGOTADO' : stock <= min ? 'CRITICO' : 'NORMAL';
      return [
        p.id,
        `"${p.codigo}"`,
        `"${p.nombre}"`,
        `"${p.categoria || 'Genérico'}"`,
        p.precio_detal,
        p.precio_mayorista,
        p.stock_actual,
        p.stock_minimo,
        estado
      ];
    });

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // Generar CSV de Separados (Layaways)
  async generateSeparadosCSV(estado?: string): Promise<string> {
    let query = db
      .select({
        id: separados.id,
        cliente: clientes.nombre,
        descripcion: separados.descripcion,
        valor_total: separados.valor_total,
        total_abonado: separados.total_abonado,
        saldo_pendiente: separados.saldo_pendiente,
        fecha_inicio: separados.fecha_inicio,
        fecha_limite: separados.fecha_limite,
        dias_plazo: separados.dias_plazo,
        estado: separados.estado
      })
      .from(separados)
      .leftJoin(clientes, eq(separados.cliente_id, clientes.id));

    const list = estado ? await query.where(eq(separados.estado, estado)).orderBy(desc(separados.created_at)) : await query.orderBy(desc(separados.created_at));

    const headers = ['ID Separado', 'Cliente', 'Descripción', 'Valor Total', 'Total Abonado', 'Saldo Pendiente', 'Fecha Inicio', 'Fecha Límite', 'Días Plazo', 'Estado'];
    const rows = list.map((s) => [
      s.id,
      `"${s.cliente || 'Cliente General'}"`,
      `"${s.descripcion}"`,
      s.valor_total,
      s.total_abonado,
      s.saldo_pendiente,
      s.fecha_inicio,
      s.fecha_limite,
      s.dias_plazo,
      s.estado
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
