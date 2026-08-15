import React, { useState, useEffect } from 'react';
import { BookmarkCheck, Plus, Search, DollarSign, Calendar, AlertCircle, CheckCircle2, User, Printer } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { formatNumber } from '../../lib/format';

interface Separado {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_apellido?: string;
  cliente_telefono?: string;
  descripcion: string;
  valor_total: string | number;
  abono_inicial: string | number;
  total_abonado: string | number;
  saldo_pendiente: string | number;
  fecha_inicio: string;
  fecha_limite: string;
  dias_plazo: number;
  estado: string;
}

export default function SeparadosManager() {
  const [separados, setSeparados] = useState<Separado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [search, setSearch] = useState('');
  const [abonoModal, setAbonoModal] = useState<Separado | null>(null);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [formaPago, setFormaPago] = useState('efectivo');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchSeparados = async () => {
    try {
      setLoading(true);
      const url = filterEstado === 'todos' ? '/api/separados' : `/api/separados?estado=${filterEstado}`;
      const res = await apiFetch(url);
      if (res.ok) {
        const data = await res.json();
        setSeparados(data);
      }
    } catch (err) {
      console.error('Error fetching separados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeparados();
  }, [filterEstado]);

  const filtered = separados.filter((s) => {
    const term = search.toLowerCase();
    const client = `${s.cliente_nombre} ${s.cliente_apellido || ''}`.toLowerCase();
    const desc = (s.descripcion || '').toLowerCase();
    const id = `#${s.id}`;
    return client.includes(term) || desc.includes(term) || id.includes(term);
  });

  const handleRegistrarAbono = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!abonoModal || !abonoMonto || parseFloat(abonoMonto) <= 0) return;

    try {
      const res = await apiFetch(`/api/separados/${abonoModal.id}/abonos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: parseFloat(abonoMonto),
          forma_pago: formaPago
        })
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: data.completado ? '¡Separado pagado totalmente!' : `Abono de $${formatNumber(parseFloat(abonoMonto))} registrado exitosamente.`
        });
        setAbonoModal(null);
        setAbonoMonto('');
        fetchSeparados();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al registrar abono' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles superiores */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente, artículo o ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="activo">Activos</option>
            <option value="completado">Completados</option>
            <option value="vencido">Vencidos</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        <a
          href="/ventas"
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Separado (POS)
        </a>
      </div>

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

      {/* Grid de Separados */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-sm">Cargando sistema de separados...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
          No se encontraron separados con el criterio seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((s) => {
            const total = parseFloat(String(s.valor_total));
            const abonado = parseFloat(String(s.total_abonado));
            const saldo = parseFloat(String(s.saldo_pendiente));
            const percent = Math.min(100, Math.round((abonado / total) * 100));

            return (
              <div
                key={s.id}
                className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4 hover:border-blue-500/40 transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-blue-400">#SEP-{s.id}</span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.estado === 'completado'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : s.estado === 'vencido'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                      }`}
                    >
                      {s.estado}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-white text-base leading-tight">{s.descripcion}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <User className="h-3.5 w-3.5 text-slate-500" />
                      <span>{s.cliente_nombre} {s.cliente_apellido || ''}</span>
                    </p>
                  </div>

                  {/* Barra de progreso de pago */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-slate-400">Abonado: ${formatNumber(abonado)}</span>
                      <span className="text-blue-400 font-bold">{percent}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Valor Total</span>
                      <p className="font-bold text-white">${formatNumber(total)}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-semibold">Saldo Pendiente</span>
                      <p className={`font-bold ${saldo > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        ${formatNumber(saldo)}
                      </p>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-500" />
                      Límite: {new Date(s.fecha_limite).toLocaleDateString()}
                    </span>
                    <span className="text-slate-500">{s.dias_plazo} días</span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                  {s.estado === 'activo' ? (
                    <button
                      onClick={() => {
                        setAbonoModal(s);
                        setAbonoMonto('');
                      }}
                      className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-md shadow-blue-600/20"
                    >
                      <DollarSign className="h-3.5 w-3.5" />
                      Registrar Abono
                    </button>
                  ) : (
                    <div className="w-full text-center py-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                      Separado Finalizado
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Registrar Abono */}
      {abonoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-['Outfit']">Registrar Abono</h3>
                <p className="text-xs text-slate-400">Separado #SEP-{abonoModal.id} — {abonoModal.descripcion}</p>
              </div>
              <button
                onClick={() => setAbonoModal(null)}
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Total Separado:</span>
                <span className="text-white font-bold">${formatNumber(parseFloat(String(abonoModal.valor_total)))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Abonado:</span>
                <span className="text-emerald-400 font-bold">${formatNumber(parseFloat(String(abonoModal.total_abonado)))}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-700">
                <span className="text-slate-300 font-semibold">Saldo Pendiente:</span>
                <span className="text-amber-400 font-bold text-sm">${formatNumber(parseFloat(String(abonoModal.saldo_pendiente)))}</span>
              </div>
            </div>

            <form onSubmit={handleRegistrarAbono} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Monto a Abonar ($ COP) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={String(abonoModal.saldo_pendiente)}
                  placeholder={`Máximo $${formatNumber(parseFloat(String(abonoModal.saldo_pendiente)))}`}
                  value={abonoMonto}
                  onChange={(e) => setAbonoMonto(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-base focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Forma de Pago</label>
                <select
                  value={formaPago}
                  onChange={(e) => setFormaPago(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia (Nequi/Daviplata/Bancolombia)</option>
                  <option value="tarjeta">Tarjeta Débito/Crédito</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAbonoModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/25"
                >
                  Confirmar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
