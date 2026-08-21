import {
  Calendar,
  CreditCard,
  DollarSign,
  Download,
  FileSpreadsheet,
  FileText,
  Filter,
} from 'lucide-react';
import React, { useState } from 'react';
import { resolveApiUrl } from '../../lib/apiClient';

export default function ReportesManager() {
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [formaPago, setFormaPago] = useState('todas');

  const handleDownloadCSV = async (endpoint: string) => {
    let path = `/api/reportes/${endpoint}?format=csv`;
    if (desde) path += `&desde=${desde}`;
    if (hasta) path += `&hasta=${hasta}`;
    if (formaPago !== 'todas') path += `&forma_pago=${formaPago}`;
    const url = await resolveApiUrl(path);
    window.open(url, '_blank');
  };

  const handleDownloadPDF = async (endpoint: string) => {
    let path = `/api/reportes/${endpoint}?format=pdf`;
    if (desde) path += `&desde=${desde}`;
    if (hasta) path += `&hasta=${hasta}`;
    if (formaPago !== 'todas') path += `&forma_pago=${formaPago}`;
    const url = await resolveApiUrl(path);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Filtros Globales */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-400" />
          Filtros de Exportación
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Fecha Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Fecha Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase">Método de Pago</label>
            <select
              value={formaPago}
              onChange={(e) => setFormaPago(e.target.value)}
              className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-blue-500"
            >
              <option value="todas">Todos los métodos</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta Débito/Crédito</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tarjetas de Exportación */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Reporte de Ventas */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-blue-500/40 transition-all shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Reporte General de Ventas</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Facturas emitidas, desglose de impuestos, descuentos y formas de pago.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleDownloadCSV('ventas')}
              className="flex-1 py-2.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 font-semibold text-xs rounded-xl border border-emerald-500/30 transition-all flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Descargar CSV (Excel)
            </button>
            <button
              onClick={() => handleDownloadPDF('ventas')}
              className="flex-1 py-2.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 font-semibold text-xs rounded-xl border border-rose-500/30 transition-all flex items-center justify-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Ver / Imprimir PDF
            </button>
          </div>
        </div>

        {/* Reporte de Inventario */}
        <div className="bg-slate-900/80 border border-slate-800 p-6 rounded-2xl space-y-4 hover:border-blue-500/40 transition-all shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <FileSpreadsheet className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-white text-base">Catálogo de Inventario & Stock</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                Existencias actuales, alertas de stock mínimo y precios de venta al detal/mayorista.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => handleDownloadCSV('inventario')}
              className="w-full py-2.5 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 font-semibold text-xs rounded-xl border border-purple-500/30 transition-all flex items-center justify-center gap-2"
            >
              <Download className="h-4 w-4" />
              Descargar Stock Actual (CSV)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
