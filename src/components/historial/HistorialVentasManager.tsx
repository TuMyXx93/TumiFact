import {
  Calendar,
  CheckCircle2,
  DollarSign,
  Eye,
  FileText,
  Filter,
  Printer,
  Search,
  X,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { formatDate, formatNumber } from '../../lib/format';

interface Venta {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_apellido?: string;
  numero_identificacion?: string;
  fecha: string;
  total: string | number;
  subtotal?: string | number;
  descuento_total?: string | number;
  forma_pago: string;
  estado?: string;
  usuario_nombre?: string;
}

interface DetalleItem {
  id: number;
  factura_id: number;
  producto_id: number;
  producto_nombre: string;
  producto_codigo?: string;
  cantidad: string | number;
  precio_unitario: string | number;
  unidad_medida: string;
  descuento_aplicado?: string | number;
  subtotal: string | number;
}

export default function HistorialVentasManager() {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [formaPagoFilter, setFormaPagoFilter] = useState('todas');
  const [searchQuery, setSearchQuery] = useState('');
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

  const handleReimprimir = (facturaId: number) => {
    window.open(`/facturas/${facturaId}/imprimir`, '_blank', 'noopener,noreferrer');
  };

  // Filtrado en cliente por query o forma de pago
  const filteredVentas = ventas.filter((v) => {
    const matchesFormaPago = formaPagoFilter === 'todas' || v.forma_pago === formaPagoFilter;
    const clientName = `${v.cliente_nombre || ''} ${v.cliente_apellido || ''}`.toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      clientName.includes(searchQuery.toLowerCase()) ||
      v.id.toString().includes(searchQuery) ||
      (v.numero_identificacion && v.numero_identificacion.includes(searchQuery));
    return matchesFormaPago && matchesSearch;
  });

  const totalGeneral = filteredVentas.reduce((sum, v) => sum + Number(v.total || 0), 0);

  return (
    <div className="space-y-6">
      {/* Filtro por Rango de Fechas & Criterios */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white text-sm font-bold font-['Outfit']">
            <Calendar className="h-4 w-4 text-blue-400" />
            Filtros del Historial de Facturas
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Desde:</span>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Hasta:</span>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:border-blue-500"
              />
            </div>

            <select
              value={formaPagoFilter}
              onChange={(e) => setFormaPagoFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white font-medium focus:border-blue-500"
            >
              <option value="todas">Todos los Medios de Pago</option>
              <option value="efectivo">Efectivo</option>
              <option value="transferencia">Transferencia</option>
              <option value="tarjeta">Tarjeta</option>
            </select>

            <button
              onClick={handleFiltrar}
              disabled={isLoading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Search className="h-3.5 w-3.5" />
              {isLoading ? 'Cargando...' : 'Aplicar Filtro'}
            </button>
          </div>
        </div>

        {/* Input de Búsqueda Rápida */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por # Factura, Cliente o Documento..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-800/60 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Total en periodo ({filteredVentas.length} facturas):{' '}
            <span className="text-emerald-400 font-bold font-mono text-sm ml-1">
              ${formatNumber(totalGeneral)} COP
            </span>
          </div>
        </div>
      </div>

      {/* Tabla de Historial de Ventas */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
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
              {filteredVentas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 text-sm">
                    No se encontraron facturas registradas en este periodo.
                  </td>
                </tr>
              ) : (
                filteredVentas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-blue-400 text-xs">
                      #{venta.id}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-300">{formatDate(venta.fecha)}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white text-xs">
                        {venta.cliente_nombre} {venta.cliente_apellido || ''}
                      </div>
                      {venta.numero_identificacion && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          Doc: {venta.numero_identificacion}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs capitalize">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          venta.forma_pago === 'efectivo'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : venta.forma_pago === 'transferencia'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}
                      >
                        {venta.forma_pago}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-400 font-mono text-xs">
                      ${formatNumber(venta.total)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleVerDetalles(venta)}
                          className="p-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 transition-colors cursor-pointer"
                          title="Ver detalle de productos"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReimprimir(venta.id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
                          title="Imprimir tiquete térmico"
                        >
                          <Printer className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Factura */}
      {selectedVenta && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Factura de Venta #{selectedVenta.id}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Cliente: {selectedVenta.cliente_nombre} {selectedVenta.cliente_apellido || ''} ·{' '}
                  {formatDate(selectedVenta.fecha)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVenta(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingDetalles ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Cargando renglones de la factura...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="max-h-80 overflow-y-auto pr-1">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-800/80 text-[10px] uppercase text-slate-400">
                      <tr>
                        <th className="px-3 py-2">Producto</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-center">Unidad</th>
                        <th className="px-3 py-2 text-right">Precio</th>
                        <th className="px-3 py-2 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {detalles.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-800/30">
                          <td className="px-3 py-2.5 font-semibold text-white">
                            {d.producto_nombre}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono">{d.cantidad}</td>
                          <td className="px-3 py-2.5 text-center">{d.unidad_medida}</td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            ${formatNumber(d.precio_unitario)}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-400">
                            ${formatNumber(d.subtotal)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-800/60 rounded-2xl border border-slate-700/60 flex items-center justify-between">
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <div>
                      Forma de Pago:{' '}
                      <span className="text-white font-bold capitalize">
                        {selectedVenta.forma_pago}
                      </span>
                    </div>
                    {selectedVenta.usuario_nombre && (
                      <div>
                        Cajero:{' '}
                        <span className="text-slate-300">{selectedVenta.usuario_nombre}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Total Facturado:</span>
                    <span className="text-xl font-extrabold text-emerald-400 font-mono">
                      ${formatNumber(selectedVenta.total)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => handleReimprimir(selectedVenta.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Reimprimir Tiquete Térmico
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
