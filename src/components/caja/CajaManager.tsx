import { AlertCircle, CheckCircle2, Lock, RefreshCw, ShieldAlert, Unlock } from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { formatDate, formatNumber, formatTime } from '../../lib/format';

const DENOMINACIONES = [
  { label: '$100.000', valor: 100000 },
  { label: '$50.000', valor: 50000 },
  { label: '$20.000', valor: 20000 },
  { label: '$10.000', valor: 10000 },
  { label: '$5.000', valor: 5000 },
  { label: '$2.000', valor: 2000 },
  { label: 'Monedas (Total)', valor: 1 },
];

export default function CajaManager() {
  const [session, setSession] = useState<any>(null);
  const [cajasActivas, setCajasActivas] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string>('empleado');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'estado' | 'supervision' | 'fases'>('estado');
  const [openModal, setOpenModal] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [montoApertura, setMontoApertura] = useState('');
  const [notas, setNotas] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );

  const [conteoBilletes, setConteoBilletes] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1: 0,
  });

  const fetchStatus = async () => {
    try {
      setLoading(true);
      let currentRole = 'empleado';
      if (typeof window !== 'undefined') {
        const storedUser =
          localStorage.getItem('tumifact_user') || sessionStorage.getItem('tumifact_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.rol_nombre) {
              currentRole = parsed.rol_nombre.toLowerCase();
              setUserRole(currentRole);
            }
          } catch (_) {}
        }
      }

      const promises: Promise<Response>[] = [apiFetch('/api/caja/estado')];
      if (currentRole === 'admin' || currentRole === 'gerente') {
        promises.push(apiFetch('/api/caja/activas'));
      }

      const [res, cajasRes] = await Promise.all(promises);

      if (res && res.ok) {
        const data = await res.json();
        setSession(data.sesion);
      }
      if (cajasRes && cajasRes.ok) {
        const cajasData = await cajasRes.json();
        setCajasActivas(cajasData || []);
      }
    } catch (err) {
      console.error('Error al consultar caja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const totalContadoCiego = useMemo(() => {
    return Object.entries(conteoBilletes).reduce((acc, [val, cant]) => {
      return acc + Number(val) * Number(cant || 0);
    }, 0);
  }, [conteoBilletes]);

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/caja/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_apertura: parseFloat(montoApertura) || 0,
          notas,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: 'Caja abierta exitosamente. Sesión vinculada al dispositivo.',
        });
        setOpenModal(false);
        setMontoApertura('');
        setNotas('');
        fetchStatus();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al abrir caja' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  const handleCerrarCaja = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/caja/cerrar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_cierre_declarado: totalContadoCiego,
          notas: `Cierre ciego por denominaciones: ${notas}`.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatusMsg({
          type: 'success',
          text: `¡Arqueo finalizado! Veredicto: ${Number(data.reporte?.diferencia_caja) === 0 ? 'CUADRADO EXACTO' : 'DESCUADRE DE $' + formatNumber(data.reporte?.diferencia_caja)}.`,
        });
        setCloseModal(false);
        setNotas('');
        fetchStatus();
      } else {
        setStatusMsg({ type: 'error', text: data.error || 'Error al cerrar caja' });
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-slate-400 font-mono text-xs">
        Verificando estado del módulo cashier-svc...
      </div>
    );
  }

  const isAbierta = !!session && session.estado === 'abierta';
  const totalEsperado = isAbierta
    ? Number(session.monto_apertura || 0) +
      Number(session.ventas_efectivo || 0) -
      Number(session.total_devoluciones || 0)
    : 0;

  return (
    <div className="space-y-6">
      {statusMsg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border text-sm font-medium ${
            statusMsg.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button
            onClick={() => setStatusMsg(null)}
            className="text-xs uppercase font-mono hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab('estado')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
            activeTab === 'estado'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          Mi Turno Actual
        </button>
        {(userRole === 'admin' || userRole === 'gerente') && (
          <button
            onClick={() => setActiveTab('supervision')}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
              activeTab === 'supervision'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            Supervisión Global ({cajasActivas.length} Cajas)
          </button>
        )}
        <button
          onClick={() => setActiveTab('fases')}
          className={`px-4 py-2 rounded-xl text-xs font-bold font-['Space_Grotesk'] transition-all cursor-pointer ${
            activeTab === 'fases'
              ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
              : 'bg-slate-800/80 text-slate-400 hover:text-white'
          }`}
        >
          Ciclo de Caja (5 Fases)
        </button>
      </div>

      {activeTab === 'supervision' && (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-['Outfit']">
                  Supervisión de Cajas en Tiempo Real
                </h3>
                <p className="text-xs text-slate-400">
                  Visualización centralizada de todas las cajas abiertas por los empleados de la
                  tienda.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-xl">
                {cajasActivas.length} Turno(s) en curso
              </span>
            </div>

            {cajasActivas.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-slate-600 opacity-50" />
                <p>No hay cajas abiertas por ningún empleado actualmente.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {cajasActivas.map((caja) => (
                  <div
                    key={caja.id}
                    className="p-4 rounded-2xl bg-slate-800/70 border border-slate-700/80 space-y-3 shadow-lg"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-bold text-white text-sm">
                          {caja.usuario_nombre} {caja.usuario_apellido}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded">
                        Caja #{caja.id}
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-300">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Base Apertura:</span>
                        <span className="font-mono font-bold">
                          ${formatNumber(Number(caja.monto_apertura))}
                        </span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span>Total Facturado:</span>
                        <span className="font-mono text-sm">
                          ${formatNumber(Number(caja.total_ventas))}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-400 text-[11px]">
                        <span>Comprobantes:</span>
                        <span>{caja.total_facturas} ventas</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-1 pt-2 border-t border-slate-700 text-[10px] text-center">
                      <div className="p-1 rounded bg-slate-900/60">
                        <span className="text-slate-400 block text-[9px]">Efectivo</span>
                        <span className="font-bold text-emerald-300 font-mono">
                          ${formatNumber(Number(caja.ventas_efectivo))}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-slate-900/60">
                        <span className="text-slate-400 block text-[9px]">Transf.</span>
                        <span className="font-bold text-blue-300 font-mono">
                          ${formatNumber(Number(caja.ventas_transferencia))}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-slate-900/60">
                        <span className="text-slate-400 block text-[9px]">Tarjeta</span>
                        <span className="font-bold text-purple-300 font-mono">
                          ${formatNumber(Number(caja.ventas_tarjeta))}
                        </span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-700/60 flex justify-between items-center">
                      <span>Apertura: {formatTime(caja.abierta_at)}</span>
                      <span className="text-emerald-400 font-semibold">● Activa</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'estado' && (
        <div className="space-y-6">
          <div className="bg-slate-900/50 p-6 md:p-8 rounded-2xl relative overflow-hidden border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`h-3 w-3 rounded-full ${
                      isAbierta
                        ? 'bg-emerald-400 animate-pulse shadow-lg shadow-emerald-500/50'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                    {isAbierta ? 'CASHIER-SVC • SESIÓN EN VIVO' : 'CASHIER-SVC • SIN TURNO ACTIVO'}
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white font-['Space_Grotesk']">
                  {isAbierta ? `Turno #${session.id} Activo` : 'Caja Cerrada'}
                </h2>
                {isAbierta && (
                  <p className="text-xs text-slate-400 font-mono">
                    Abierta el {formatDate(session.abierta_at)}
                  </p>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 shrink-0">
                <button
                  onClick={fetchStatus}
                  className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors border border-slate-700"
                  title="Refrescar balance"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                {isAbierta ? (
                  <button
                    onClick={() => setCloseModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-rose-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <Lock className="h-4 w-4" />
                    Cierre Ciego & Arqueo Z
                  </button>
                ) : (
                  <button
                    onClick={() => setOpenModal(true)}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs flex items-center gap-2 shadow-xl shadow-emerald-500/20 transition-all transform hover:-translate-y-0.5"
                  >
                    <Unlock className="h-4 w-4" />
                    Abrir Turno de Caja (Fase 1)
                  </button>
                )}
              </div>
            </div>

            {isAbierta && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-8 pt-6 border-t border-slate-800">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-slate-400">
                    Base Apertura
                  </span>
                  <p className="text-lg sm:text-xl font-bold font-mono text-white">
                    ${formatNumber(session.monto_apertura || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-emerald-400">
                    Ventas Efectivo
                  </span>
                  <p className="text-lg sm:text-xl font-bold font-mono text-emerald-400">
                    +${formatNumber(session.ventas_efectivo || 0)}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-cyan-400">
                    Transferencias / Card
                  </span>
                  <p className="text-lg sm:text-xl font-bold font-mono text-cyan-400">
                    $
                    {formatNumber(
                      Number(session.ventas_transferencia || 0) +
                        Number(session.ventas_tarjeta || 0)
                    )}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase text-blue-400">
                    Total Esperado en Gaveta
                  </span>
                  <p className="text-lg sm:text-xl font-black font-mono text-blue-400">
                    ${formatNumber(totalEsperado)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'fases' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              {
                num: '01',
                title: 'Apertura',
                desc: 'Base en gaveta, sesión congelada por cajero.',
              },
              { num: '02', title: 'Operación', desc: 'Ventas, retiros y vales auditados.' },
              { num: '03', title: 'Corte X', desc: 'Cierre parcial sin congelar gaveta.' },
              {
                num: '04',
                title: 'Cierre Ciego',
                desc: 'Conteo por denominación sin ver esperado.',
              },
              {
                num: '05',
                title: 'Arqueo & Z',
                desc: 'Cálculo de descuadre y aprobación gerencial.',
              },
            ].map((fase) => (
              <div
                key={fase.num}
                className="bg-slate-900/50 p-4 rounded-xl space-y-1.5 border border-slate-800"
              >
                <span className="text-xl font-black font-['Space_Grotesk'] text-blue-400">
                  {fase.num}
                </span>
                <h4 className="font-bold text-white text-xs">{fase.title}</h4>
                <p className="text-[11px] text-slate-400 leading-tight">{fase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {openModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Unlock className="h-5 w-5 text-emerald-400" />
                Fase 1: Apertura de Turno
              </h3>
              <button
                onClick={() => setOpenModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAbrirCaja} className="space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">
                  Monto Base Inicial ($) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  placeholder="ej. 50000"
                  value={montoApertura}
                  onChange={(e) => setMontoApertura(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">
                  Notas de Apertura
                </label>
                <textarea
                  rows={2}
                  placeholder="Turno mañana / Base entregada por supervisor"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20"
                >
                  Confirmar Apertura
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {closeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  Fase 4 & 5: Cierre Ciego & Arqueo
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ingrese las cantidades físicas contadas en gaveta por denominación.
                </p>
              </div>
              <button
                onClick={() => setCloseModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCerrarCaja} className="space-y-4 text-xs">
              <div className="space-y-2 p-3 bg-slate-800/50 rounded-xl border border-slate-800">
                <span className="font-bold text-slate-300 uppercase tracking-wider block text-[10px]">
                  Desglose de Billetes y Monedas
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {DENOMINACIONES.map((den) => (
                    <div
                      key={den.valor}
                      className="flex items-center justify-between bg-slate-800 p-2 rounded-lg border border-slate-700"
                    >
                      <span className="font-mono text-slate-300 font-semibold">{den.label}</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        value={conteoBilletes[den.valor] || ''}
                        onChange={(e) =>
                          setConteoBilletes({
                            ...conteoBilletes,
                            [den.valor]: Number(e.target.value) || 0,
                          })
                        }
                        className="w-20 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-right text-white font-mono focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                <span className="font-bold uppercase tracking-wider text-blue-400">
                  Total Físico Declarado:
                </span>
                <span className="text-xl font-black font-mono text-white">
                  ${formatNumber(totalContadoCiego)}
                </span>
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase block mb-1">
                  Notas de Cierre
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones de descuadres o billetes retenidos"
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCloseModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-amber-600 to-rose-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Generar Arqueo Z y Cerrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
