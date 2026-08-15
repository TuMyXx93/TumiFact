import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, ArrowDown, ArrowUp, RefreshCw, Plus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

interface Movimiento {
  id: number;
  producto_id: number;
  producto_nombre: string;
  producto_codigo: string;
  tipo: string;
  cantidad: number;
  stock_anterior: number;
  stock_nuevo: number;
  notas?: string;
  created_at: string;
}

interface CriticoProd {
  id: number;
  codigo: string;
  nombre: string;
  stock_actual: number;
  stock_minimo: number;
}

export default function InventarioManager() {
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [criticos, setCriticos] = useState<CriticoProd[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    producto_id: '',
    tipo: 'entrada_compra',
    cantidad: '',
    notas: ''
  });
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [movRes, critRes] = await Promise.all([
        apiFetch('/api/inventario/movimientos'),
        apiFetch('/api/inventario/stock-critico')
      ]);

      if (movRes.ok) setMovimientos(await movRes.json());
      if (critRes.ok) setCriticos(await critRes.json());
    } catch (err) {
      console.error('Error fetching inventario:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRegisterMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/inventario/movimientos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          producto_id: parseInt(formData.producto_id, 10),
          tipo: formData.tipo,
          cantidad: parseFloat(formData.cantidad),
          notas: formData.notas
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Movimiento de inventario registrado con éxito.' });
        setIsModalOpen(false);
        setFormData({ producto_id: '', tipo: 'entrada_compra', cantidad: '', notas: '' });
        fetchData();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al registrar movimiento' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Alertas de Stock Crítico */}
      {criticos.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Alerta de Stock Crítico ({criticos.length} artículos por agotarse)</span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {criticos.map((p) => (
              <span key={p.id} className="bg-amber-500/20 text-amber-300 text-xs px-3 py-1 rounded-lg font-medium">
                {p.nombre} — Stock: <strong>{p.stock_actual}</strong> (Mín: {p.stock_minimo})
              </span>
            ))}
          </div>
        </div>
      )}

      {statusMsg && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMsg.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {statusMsg.text}
        </div>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-400" />
          Kardex & Movimientos Recientes
        </h3>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-1.5"
        >
          <Plus className="h-4 w-4" />
          Nuevo Movimiento Manual
        </button>
      </div>

      {/* Tabla Kardex */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-800/60 text-slate-400 uppercase font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Fecha</th>
                <th className="py-3.5 px-4">Producto</th>
                <th className="py-3.5 px-4">Tipo</th>
                <th className="py-3.5 px-4 text-center">Cantidad</th>
                <th className="py-3.5 px-4 text-center">Stock Ant.</th>
                <th className="py-3.5 px-4 text-center">Stock Nuevo</th>
                <th className="py-3.5 px-4">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Cargando kardex...</td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No hay movimientos registrados.</td>
                </tr>
              ) : (
                movimientos.map((m) => {
                  const isPositive = ['entrada_compra', 'ajuste_positivo', 'devolucion_reingreso', 'cancelacion_separado'].includes(m.tipo);
                  return (
                    <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {new Date(m.created_at).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-semibold text-white">
                        {m.producto_nombre} <span className="text-slate-500 text-[11px]">({m.producto_codigo})</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {m.tipo.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`py-3 px-4 text-center font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+${m.cantidad}` : `-${m.cantidad}`}
                      </td>
                      <td className="py-3 px-4 text-center text-slate-400">{m.stock_anterior}</td>
                      <td className="py-3 px-4 text-center font-bold text-white">{m.stock_nuevo}</td>
                      <td className="py-3 px-4 text-slate-400 italic text-[11px] truncate max-w-xs">{m.notas || '—'}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo Movimiento */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-['Outfit']">Registrar Movimiento de Stock</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleRegisterMovimiento} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">ID de Producto *</label>
                <input
                  type="number"
                  required
                  placeholder="ej. 1"
                  value={formData.producto_id}
                  onChange={(e) => setFormData({ ...formData, producto_id: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Tipo de Movimiento</label>
                <select
                  value={formData.tipo}
                  onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="entrada_compra">Entrada por Compra / Proveedor (+)</option>
                  <option value="ajuste_positivo">Ajuste Positivo (+)</option>
                  <option value="salida_manual">Salida Manual (-)</option>
                  <option value="perdida">Pérdida / Daño (-)</option>
                  <option value="ajuste_negativo">Ajuste Negativo (-)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Cantidad *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  min="0.01"
                  placeholder="ej. 10"
                  value={formData.cantidad}
                  onChange={(e) => setFormData({ ...formData, cantidad: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Notas / Justificación</label>
                <input
                  type="text"
                  placeholder="ej. Recepción de lote #4829"
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
