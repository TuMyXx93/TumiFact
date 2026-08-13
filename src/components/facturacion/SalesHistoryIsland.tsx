import React, { useState, useEffect } from 'react';
import { Calendar, Search, Printer, Eye } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

interface Venta {
  id: number;
  cliente_id: number;
  fecha: string;
  total: string | number;
  forma_pago: string;
  cliente_nombre: string;
}

interface DetalleItem {
  id: number;
  factura_id: number;
  producto_id: number;
  cantidad: string | number;
  precio_unitario: string | number;
  unidad_medida: string;
  subtotal: string | number;
  producto_nombre: string;
}

export default function SalesHistoryIsland() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modal Detalles
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [detalles, setDetalles] = useState<DetalleItem[]>([]);
  const [isLoadingDetalles, setIsLoadingDetalles] = useState(false);

  const fetchVentas = async (desde?: string, hasta?: string) => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (desde) queryParams.append('desde', desde);
      if (hasta) queryParams.append('hasta', hasta);

      const res = await apiFetch(`/ventas?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setVentas(data);
      }
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Establecer filtro inicial a 30 días
    const hoy = new Date();
    const hace30Dias = new Date();
    hace30Dias.setDate(hace30Dias.getDate() - 30);

    const fDesde = hace30Dias.toISOString().split('T')[0];
    const fHasta = hoy.toISOString().split('T')[0];

    setFechaDesde(fDesde);
    setFechaHasta(fHasta);
    fetchVentas(fDesde, fHasta);
  }, []);

  const handleFiltrar = () => {
    fetchVentas(fechaDesde, fechaHasta);
  };

  const handleVerDetalles = async (venta: Venta) => {
    setSelectedVenta(venta);
    setIsLoadingDetalles(true);
    try {
      const res = await apiFetch(`/api/facturas/${venta.id}/detalles`);
      if (res.ok) {
        const data = await res.json();
        setDetalles(data.productos || []);
      }
    } catch (err) {
      console.error('Error obteniendo detalles:', err);
    } finally {
      setIsLoadingDetalles(false);
    }
  };

  const totalGeneral = ventas.reduce((sum, v) => sum + Number(v.total || 0), 0);

  const handleReimprimir = (facturaId: number) => {
    window.open(`/facturas/${facturaId}/imprimir`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      {/* Filtro por Rango de Fechas */}
      <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-2 text-white text-sm font-semibold">
          <Calendar className="h-4 w-4 text-blue-400" />
          Filtrar por Rango de Fechas
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Desde:</span>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Hasta:</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleFiltrar}
            disabled={isLoading}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5"
          >
            <Search className="h-3.5 w-3.5" />
            {isLoading ? 'Cargando...' : 'Filtrar'}
          </button>
        </div>
      </div>

      {/* Tabla de Historial de Ventas */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">Factura #</th>
                <th className="px-6 py-4">Fecha / Hora</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Forma de Pago</th>
                <th className="px-6 py-4 text-right">Total ($)</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {ventas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron registros de ventas en el período seleccionado.
                  </td>
                </tr>
              ) : (
                ventas.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400">#{v.id}</td>
                    <td className="px-6 py-4 text-xs text-slate-400">{new Date(v.fecha).toLocaleString()}</td>
                    <td className="px-6 py-4 font-semibold text-white">{v.cliente_nombre || 'Cliente General'}</td>
                    <td className="px-6 py-4 capitalize text-xs">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                          v.forma_pago === 'efectivo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : v.forma_pago === 'transferencia'
                            ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}
                      >
                        {v.forma_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-white font-mono">
                      ${Number(v.total).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleVerDetalles(v)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                          title="Ver detalles de la factura"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleReimprimir(v.id)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg transition-colors"
                          title="Reimprimir tiquete térmico"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot className="bg-slate-800/80 border-t border-slate-700 font-bold text-white">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right uppercase tracking-wider text-xs text-slate-400">
                  Total General Acumulado:
                </td>
                <td className="px-6 py-4 text-right text-emerald-400 text-base font-mono">
                  ${totalGeneral.toLocaleString()}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Modal Detalles */}
      {selectedVenta && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                Detalles de Factura #{selectedVenta.id}
              </h3>
              <button
                onClick={() => setSelectedVenta(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <p><strong>Cliente:</strong> {selectedVenta.cliente_nombre}</p>
                <p><strong>Fecha:</strong> {new Date(selectedVenta.fecha).toLocaleString()}</p>
                <p><strong>Pago:</strong> {selectedVenta.forma_pago}</p>
                <p><strong>Total:</strong> <span className="text-emerald-400 font-bold">${Number(selectedVenta.total).toLocaleString()}</span></p>
              </div>

              <h4 className="font-bold text-slate-300 uppercase tracking-wider pt-2 border-t border-slate-800">
                Productos Facturados
              </h4>

              {isLoadingDetalles ? (
                <p className="text-center py-4 text-slate-500">Cargando detalles...</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {detalles.map((d, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-slate-800 rounded-xl">
                      <div>
                        <p className="font-semibold text-white text-xs">{d.producto_nombre}</p>
                        <p className="text-slate-400 text-[11px]">
                          {d.cantidad} {d.unidad_medida} x ${Number(d.precio_unitario).toLocaleString()}
                        </p>
                      </div>
                      <span className="font-bold text-emerald-400 text-xs font-mono">
                        ${Number(d.subtotal).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
