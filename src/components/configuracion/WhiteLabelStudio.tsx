import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileText,
  Palette,
  QrCode,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Sliders,
  Sparkles,
  Store,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';

interface ConfigData {
  nombre_negocio: string;
  nit: string;
  direccion: string;
  telefono: string;
  pie_pagina: string;
  ancho_papel: number;
  font_size: number;
  mensaje_bienvenida?: string;
  mensaje_pie?: string;
  politica_devolucion?: string;
  politica_separados?: string;
  dias_plazo_separado_default?: number;
  esquema_colores?: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
  };
}

interface WhiteLabelStudioProps {
  initialConfig: ConfigData;
}

const PRESET_ACCENTS = [
  {
    name: 'Azul Eléctrico (Default)',
    hex: '#3b82f6',
    class: 'from-blue-600 to-cyan-500',
  },
  { name: 'Cian Neón', hex: '#06b6d4', class: 'from-cyan-500 to-teal-400' },
  {
    name: 'Esmeralda Fiscal',
    hex: '#10b981',
    class: 'from-emerald-500 to-green-400',
  },
  {
    name: 'Ámbar Comercial',
    hex: '#f59e0b',
    class: 'from-amber-500 to-yellow-400',
  },
  {
    name: 'Púrpura Deep',
    hex: '#8b5cf6',
    class: 'from-purple-600 to-indigo-500',
  },
  { name: 'Rosa Neón', hex: '#ec4899', class: 'from-pink-500 to-rose-400' },
];

export default function WhiteLabelStudio({ initialConfig }: WhiteLabelStudioProps) {
  const [config, setConfig] = useState<ConfigData>(initialConfig);
  const [selectedAccent, setSelectedAccent] = useState<string>(
    initialConfig.esquema_colores?.primary || '#3b82f6'
  );
  const [ticketWidth, setTicketWidth] = useState<number>(initialConfig.ancho_papel || 80);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Aplicar acento en runtime al elemento raíz
  useEffect(() => {
    document.documentElement.style.setProperty('--accent-color', selectedAccent);
  }, [selectedAccent]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const payload = {
      ...config,
      ancho_papel: ticketWidth,
      esquema_colores: {
        primary: selectedAccent,
        secondary: '#0891b2',
        accent: '#10b981',
        background: '#060913',
        surface: '#0d1424',
      },
    };

    try {
      const res = await apiFetch('/api/configuracion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: '¡Identidad de Marca Blanca y configuración guardadas con éxito!',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al guardar la configuración',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'No se pudo conectar con el servidor',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {statusMessage && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border text-sm font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-xs uppercase font-mono hover:opacity-75"
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================= */}
        {/* PANEL IZQUIERDO: CONTROLES DE MARCA BLANCA & PARÁMETROS  */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">
          <form onSubmit={handleSave} className="space-y-6">
            {/* Paleta de Color de Acento */}
            <div className="blueprint-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Palette className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white font-['Space_Grotesk'] text-base">
                    Esquema de Colores en Runtime
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-blue-400 font-semibold uppercase bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  CSS Tokens
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  Color de Acento de la Interfaz
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {PRESET_ACCENTS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setSelectedAccent(preset.hex)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        selectedAccent === preset.hex
                          ? 'border-blue-400 bg-slate-800/90 shadow-lg'
                          : 'border-slate-800 bg-slate-900/60 hover:bg-slate-800/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="h-4 w-4 rounded-full shadow-sm"
                          style={{ backgroundColor: preset.hex }}
                        />
                        <span className="text-xs font-medium text-white truncate">
                          {preset.name.split(' ')[0]}
                        </span>
                      </div>
                      {selectedAccent === preset.hex && (
                        <Check className="h-3.5 w-3.5 text-blue-400" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Identidad de la Tienda */}
            <div className="blueprint-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                <Store className="h-5 w-5 text-blue-400" />
                <h3 className="font-bold text-white font-['Space_Grotesk'] text-base">
                  Identidad Comercial & Datos Tributarios
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.nombre_negocio}
                    onChange={(e) => setConfig({ ...config, nombre_negocio: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">
                    NIT / Cédula Fiscal *
                  </label>
                  <input
                    type="text"
                    required
                    value={config.nit}
                    onChange={(e) => setConfig({ ...config, nit: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">
                    Dirección del Establecimiento
                  </label>
                  <input
                    type="text"
                    value={config.direccion}
                    onChange={(e) => setConfig({ ...config, direccion: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">
                    Teléfono / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={config.telefono}
                    onChange={(e) => setConfig({ ...config, telefono: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Parámetros de Tiquete Térmico */}
            <div className="blueprint-card p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <Receipt className="h-5 w-5 text-blue-400" />
                  <h3 className="font-bold text-white font-['Space_Grotesk'] text-base">
                    Tiquetes Térmicos & Políticas
                  </h3>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 font-semibold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  ESC/POS • PDF
                </span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1.5">
                    Ancho de Impresora Térmica
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setTicketWidth(80)}
                      className={`p-3 rounded-xl border flex items-center justify-center font-mono font-bold transition-all ${
                        ticketWidth === 80
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      80 mm (Estándar Punto de Venta)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTicketWidth(58)}
                      className={`p-3 rounded-xl border flex items-center justify-center font-mono font-bold transition-all ${
                        ticketWidth === 58
                          ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-white'
                      }`}
                    >
                      58 mm (POS Portátil)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 uppercase block mb-1">
                    Mensaje de Pie de Página del Tiquete
                  </label>
                  <textarea
                    rows={2}
                    value={config.pie_pagina}
                    onChange={(e) => setConfig({ ...config, pie_pagina: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="font-semibold text-slate-300 uppercase block mb-1">
                      Política de Cambios & Devoluciones (RMA)
                    </label>
                    <textarea
                      rows={2}
                      value={
                        config.politica_devolucion ||
                        'Cambios y devoluciones dentro de los 30 días con el comprobante.'
                      }
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          politica_devolucion: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                  <div>
                    <label className="font-semibold text-slate-300 uppercase block mb-1">
                      Política de Separados & Abonos
                    </label>
                    <textarea
                      rows={2}
                      value={
                        config.politica_separados ||
                        'Plazo máximo de separado: 30 a 45 días. Abonos no reembolsables.'
                      }
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          politica_separados: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 resize-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400 hover:from-blue-500 hover:to-cyan-300 text-white font-bold text-sm shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSaving ? 'Guardando Identidad...' : 'Aplicar y Guardar Marca Blanca'}
              </button>
            </div>
          </form>
        </div>

        {/* ========================================================= */}
        {/* PANEL DERECHO: PREVIEW INTERACTIVO EN VIVO DEL TIQUETE    */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 sticky top-20 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-300 uppercase tracking-widest text-xs font-mono flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-blue-400" />
              Previsualización Térmica en Vivo
            </h3>
            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
              {ticketWidth} mm ESC/POS
            </span>
          </div>

          {/* Ticket térmico estilo papel */}
          <div
            className={`mx-auto bg-white text-slate-900 p-6 rounded-lg shadow-2xl font-mono text-[11px] leading-relaxed transition-all duration-300 border border-slate-300 ${
              ticketWidth === 58 ? 'max-w-[280px]' : 'max-w-[340px]'
            }`}
          >
            {/* Header del Ticket */}
            <div className="text-center space-y-1 border-b border-dashed border-slate-400 pb-3 mb-3">
              <h4 className="font-black text-sm uppercase tracking-tight text-slate-900 font-['Outfit']">
                {config.nombre_negocio || 'TumiFact Store'}
              </h4>
              <p className="text-[10px] font-bold text-slate-700">
                NIT: {config.nit || '900.123.456-7'}
              </p>
              <p className="text-[10px] text-slate-600">
                {config.direccion || 'Calle 100 #15-20, Bogotá'}
              </p>
              <p className="text-[10px] text-slate-600">
                Tel: {config.telefono || '+57 300 123 4567'}
              </p>
            </div>

            {/* Metadatos de la Factura */}
            <div className="text-[10px] space-y-0.5 border-b border-dashed border-slate-400 pb-2 mb-2 text-slate-700">
              <div className="flex justify-between">
                <span>FAC NRO:</span>
                <span className="font-bold text-slate-900">#POS-00892</span>
              </div>
              <div className="flex justify-between">
                <span>FECHA:</span>
                <span>
                  {new Date().toLocaleDateString('es-CO')}{' '}
                  {new Date().toLocaleTimeString('es-CO', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span>CAJERO:</span>
                <span>Administrador (Caja 01)</span>
              </div>
              <div className="flex justify-between">
                <span>CLIENTE:</span>
                <span>Consumidor Final</span>
              </div>
            </div>

            {/* Detalle de Productos */}
            <div className="space-y-1.5 border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between font-bold text-slate-800 text-[10px]">
                <span>CANT / ARTÍCULO</span>
                <span>TOTAL</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">2x Camiseta Polo Algodón</p>
                  <p className="text-[9px] text-slate-500">Talla L • Azul Marino</p>
                </div>
                <span className="font-bold">$90.000</span>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="font-bold text-slate-900">1x Tenis Deportivos Pro</p>
                  <p className="text-[9px] text-slate-500">Talla 41 • Negro</p>
                </div>
                <span className="font-bold">$189.000</span>
              </div>
            </div>

            {/* Totales */}
            <div className="space-y-1 text-right border-b border-dashed border-slate-400 pb-3 mb-3">
              <div className="flex justify-between text-slate-600">
                <span>SUBTOTAL:</span>
                <span>$279.000</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>DESCUENTO INLINE:</span>
                <span>-$15.000</span>
              </div>
              <div className="flex justify-between font-black text-sm text-slate-900 pt-1 border-t border-slate-300">
                <span>TOTAL A PAGAR:</span>
                <span>$264.000</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600 pt-1">
                <span>MÉTODO:</span>
                <span className="font-bold">EFECTIVO ($300.000)</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-600">
                <span>CAMBIO:</span>
                <span className="font-bold">$36.000</span>
              </div>
            </div>

            {/* Código QR Simulado */}
            <div className="text-center space-y-2 pt-1">
              <div className="mx-auto w-24 h-24 bg-slate-100 border border-slate-300 rounded p-1.5 flex flex-col items-center justify-center shadow-inner">
                <QrCode className="h-16 w-16 text-slate-800" />
                <span className="text-[8px] font-bold text-slate-600 font-mono tracking-tighter">
                  PAGOS / DIAN QR
                </span>
              </div>
              <p className="text-[9px] font-bold text-slate-800 uppercase tracking-tight">
                {config.mensaje_bienvenida || '¡Gracias por su compra!'}
              </p>
              <p className="text-[8px] text-slate-600 italic">
                {config.pie_pagina || 'Garantía de calidad TumiFact.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
