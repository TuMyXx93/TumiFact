import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Banknote, 
  Activity, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  ShoppingBag,
  CreditCard,
  Smartphone,
  CircleDot
} from 'lucide-react';
import { apiFetch, resolveApiBaseUrl } from '../../lib/apiClient';
import { formatNumber, formatTime, formatDate, APP_TIMEZONE } from '../../lib/format';
import { io as socketIOClient, Socket } from 'socket.io-client';

interface EmpleadoEstado {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  numero_identificacion?: string;
  rol_nombre: string;
  ultimo_login?: string;
  activo: boolean;
  sesion_caja_activa_id?: number | null;
  caja_monto_apertura?: number | null;
  caja_abierta_at?: string | null;
  caja_total_ventas?: number;
  caja_total_facturas?: number;
}

interface CajaActiva {
  id: number;
  usuario_id: number;
  usuario_nombre: string;
  usuario_apellido: string;
  usuario_email: string;
  estado: string;
  monto_apertura: number;
  abierta_at: string;
  notas?: string;
  total_ventas: number;
  total_facturas: number;
  ventas_efectivo: number;
  ventas_transferencia: number;
  ventas_tarjeta: number;
}

export default function LiveMonitoringIsland() {
  const [empleados, setEmpleados] = useState<EmpleadoEstado[]>([]);
  const [cajasActivas, setCajasActivas] = useState<CajaActiva[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [socketConnected, setSocketConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<'cajas' | 'empleados'>('cajas');

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [empRes, cajasRes] = await Promise.all([
        apiFetch('/api/auth/empleados-estado'),
        apiFetch('/api/caja/activas')
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmpleados(empData || []);
      }
      if (cajasRes.ok) {
        const cajasData = await cajasRes.json();
        setCajasActivas(cajasData || []);
      }
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error al actualizar monitoreo en vivo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Conexión dinámica a Socket.io
    let socket: Socket | null = null;
    (async () => {
      try {
        const baseUrl = await resolveApiBaseUrl();
        const socketTarget = baseUrl || window.location.origin;
        const storedToken = typeof window !== 'undefined' 
          ? (localStorage.getItem('tumifact_token') || sessionStorage.getItem('tumifact_token') || '')
          : '';

        socket = socketIOClient(socketTarget, {
          transports: ['websocket', 'polling'],
          auth: { token: storedToken },
          reconnectionAttempts: 15,
          reconnectionDelay: 1000
        });

        socket.on('connect', () => {
          setSocketConnected(true);
        });

        socket.on('disconnect', () => {
          setSocketConnected(false);
        });

        // Escuchar eventos en vivo del backend
        const handleEvent = () => {
          fetchData();
        };

        socket.on('factura:creada', handleEvent);
        socket.on('caja:abierta', handleEvent);
        socket.on('caja:cerrada', handleEvent);
        socket.on('usuario:conectado', handleEvent);
        socket.on('separado:abono', handleEvent);
        socket.on('separado:creado', handleEvent);
      } catch (err) {
        console.warn('Socket.io connection warning:', err);
      }
    })();

    // Polling de respaldo cada 5 segundos
    const interval = setInterval(fetchData, 5000);

    return () => {
      clearInterval(interval);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const totalVentasEnVivo = cajasActivas.reduce((acc, c) => acc + Number(c.total_ventas || 0), 0);
  const totalFacturasEnVivo = cajasActivas.reduce((acc, c) => acc + Number(c.total_facturas || 0), 0);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-xl space-y-6">
      {/* Header del Monitoreo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg sm:text-xl font-black text-white font-['Outfit'] flex items-center gap-2">
              <Activity className="h-5 w-5 text-emerald-400 animate-pulse" />
              Supervisión de Cajas & Empleados en Vivo
            </h2>
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
              socketConnected 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <CircleDot className="h-2.5 w-2.5 animate-ping" />
              {socketConnected ? 'LIVE STREAM' : 'POLLING ACTIVO'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Monitoreo en tiempo real de turnos de venta, cajeros activos y recaudos acumulados.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Tabs Selector */}
          <div className="flex bg-slate-800/80 p-1 rounded-xl border border-slate-700/60 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab('cajas')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'cajas'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cajas Activas ({cajasActivas.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('empleados')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                activeTab === 'empleados'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Empleados ({empleados.length})
            </button>
          </div>

          <button
            type="button"
            onClick={fetchData}
            disabled={isLoading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all cursor-pointer"
            title="Refrescar métricas ahora"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Banners de Recaudo en Vivo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0">
            <Banknote className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Recaudo en Cajas Abiertas</p>
            <p className="text-lg font-black text-emerald-400 font-mono">${formatNumber(totalVentasEnVivo)}</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Facturas Emitidas en Turno</p>
            <p className="text-lg font-black text-white font-mono">{totalFacturasEnVivo} facturas</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-800/40 border border-slate-800 flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Cajeros con Turno Iniciado</p>
            <p className="text-lg font-black text-cyan-400 font-mono">
              {cajasActivas.length} / {empleados.length} personal
            </p>
          </div>
        </div>
      </div>

      {/* Contenido Principal por Pestaña */}
      {activeTab === 'cajas' ? (
        <div className="space-y-4">
          {cajasActivas.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-800 rounded-2xl space-y-2">
              <AlertCircle className="h-8 w-8 mx-auto text-slate-500 opacity-50" />
              <p className="text-sm font-semibold text-slate-300">No hay turnos de caja abiertos en este momento.</p>
              <p className="text-xs text-slate-500">
                Cuando un cajero abra su turno desde el POS o Control de Caja, aparecerá aquí en tiempo real.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {cajasActivas.map((caja) => (
                <div
                  key={caja.id}
                  className="bg-slate-850/80 border border-slate-800 hover:border-emerald-500/30 p-4 rounded-2xl space-y-3 transition-all shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="font-bold text-white text-sm">
                        {caja.usuario_nombre} {caja.usuario_apellido}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                      Caja #{caja.id}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Apertura:</span>
                      <span className="font-mono font-bold">${formatNumber(Number(caja.monto_apertura))}</span>
                    </div>
                    <div className="flex justify-between text-emerald-400 font-bold">
                      <span>Ventas Acumuladas:</span>
                      <span className="font-mono text-sm">${formatNumber(Number(caja.total_ventas))}</span>
                    </div>
                    <div className="flex justify-between text-slate-400 text-[11px]">
                      <span>Comprobantes:</span>
                      <span>{caja.total_facturas} facturas</span>
                    </div>
                  </div>

                  {/* Desglose por Medio de Pago */}
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-800 text-[10px] text-center">
                    <div className="p-1.5 rounded-lg bg-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">Efectivo</span>
                      <span className="font-bold text-emerald-300 font-mono">${formatNumber(Number(caja.ventas_efectivo))}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">Transf.</span>
                      <span className="font-bold text-blue-300 font-mono">${formatNumber(Number(caja.ventas_transferencia))}</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-slate-800/80">
                      <span className="text-slate-400 block text-[9px]">Tarjeta</span>
                      <span className="font-bold text-purple-300 font-mono">${formatNumber(Number(caja.ventas_tarjeta))}</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-500" />
                      {formatTime(caja.abierta_at)}
                    </span>
                    <a
                      href="/caja"
                      className="text-xs font-bold text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      Auditar Caja →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Pestaña de Empleados */
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {empleados.map((emp) => {
              const tieneCaja = !!emp.sesion_caja_activa_id;
              return (
                <div
                  key={emp.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    tieneCaja
                      ? 'bg-slate-850/90 border-emerald-500/30'
                      : 'bg-slate-850/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                        tieneCaja ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {emp.nombre.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-xs leading-none">
                          {emp.nombre} {emp.apellido}
                        </h4>
                        <span className="text-[10px] text-slate-400 capitalize">{emp.rol_nombre}</span>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      tieneCaja 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {tieneCaja ? 'Caja Abierta' : 'Sin Caja'}
                    </span>
                  </div>

                  <div className="space-y-1 text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
                    {tieneCaja ? (
                      <>
                        <p className="text-emerald-300 font-semibold">
                          Turno #{emp.sesion_caja_activa_id} · Ventas: ${formatNumber(Number(emp.caja_total_ventas || 0))}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {emp.caja_total_facturas || 0} facturas procesadas
                        </p>
                      </>
                    ) : (
                      <p className="text-slate-400">
                        Último acceso: {emp.ultimo_login ? formatTime(emp.ultimo_login) : 'Sin registro'}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
        <span>Última sincronización: {formatTime(lastUpdate)}</span>
        <span className="text-slate-400">WebSockets Socket.io v4</span>
      </div>
    </div>
  );
}
