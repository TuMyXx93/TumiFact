import { Router } from 'express';
import { ReportesService } from './reportes.service';
import { verifyAuth, requireRole } from '../../shared/middleware/auth';

export const reportesRouter = Router();
const service = new ReportesService();

// GET /api/reportes/ventas — Exportar ventas en PDF o CSV
reportesRouter.get('/ventas', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const format = (req.query.format as string)?.toLowerCase() || 'json';
    const filtros = {
      desde: req.query.desde as string,
      hasta: req.query.hasta as string,
      usuario_id: req.query.usuario_id ? parseInt(req.query.usuario_id as string, 10) : undefined,
      forma_pago: req.query.forma_pago as string,
      estado: req.query.estado as string
    };

    if (format === 'csv') {
      const csv = await service.generateVentasCSV(filtros);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="ventas_tumifact_${new Date().toISOString().split('T')[0]}.csv"`);
      return res.send(csv);
    }

    if (format === 'pdf') {
      const pdfBuffer = await service.generateVentasPDF(filtros);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="reporte_ventas_${new Date().toISOString().split('T')[0]}.pdf"`);
      return res.send(pdfBuffer);
    }

    const data = await service.getVentasData(filtros);
    res.json(data);
  } catch (error) {
    next(error);
  }
});

// GET /api/reportes/inventario — Exportar inventario en CSV
reportesRouter.get('/inventario', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const csv = await service.generateInventarioCSV();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="inventario_tumifact_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// GET /api/reportes/separados — Exportar reporte de separados en CSV
reportesRouter.get('/separados', verifyAuth, requireRole('gerente', 'admin'), async (req, res, next) => {
  try {
    const estado = req.query.estado as string;
    const csv = await service.generateSeparadosCSV(estado);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="separados_tumifact_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});
