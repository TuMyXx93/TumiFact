import {
  AlertCircle,
  Award,
  CheckCircle2,
  CreditCard,
  Edit2,
  Mail,
  MapPin,
  Phone,
  Search,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { formatNumber } from '../../lib/format';
import type { Cliente } from '../../types';

interface ClientManagerProps {
  initialClientes: Cliente[];
}

export default function ClientManager({ initialClientes = [] }: ClientManagerProps) {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Formulario nuevo/editar cliente
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    numero_identificacion: '',
    email: '',
    telefono: '',
    telefono_secundario: '',
    direccion_texto: '',
    tipo_cliente: 'detal',
    notas: '',
  });

  const filteredClientes = clientes.filter((c) => {
    const term = search.toLowerCase();
    const fullName = `${c.nombre} ${c.apellido || ''}`.toLowerCase();
    const ident = (c.numero_identificacion || '').toLowerCase();
    const tel = (c.telefono || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    return (
      fullName.includes(term) || ident.includes(term) || tel.includes(term) || email.includes(term)
    );
  });

  const handleEditClick = (c: Cliente) => {
    setEditingCliente(c);
    setFormData({
      nombre: c.nombre,
      apellido: c.apellido || '',
      numero_identificacion: c.numero_identificacion || '',
      email: c.email || '',
      telefono: c.telefono || '',
      telefono_secundario: c.telefono_secundario || '',
      direccion_texto: c.direccion_texto || c.direccion?.calle || '',
      tipo_cliente: c.tipo_cliente || 'detal',
      notas: c.notas || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteCliente = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este cliente?')) return;

    try {
      const res = await apiFetch(`/api/clientes/${id}`, { method: 'DELETE' });
      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (res.ok) {
        setClientes(clientes.filter((c) => c.id !== id));
        setStatusMessage({
          type: 'success',
          text: data.message || 'Cliente eliminado exitosamente',
        });
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || `Error ${res.status} al eliminar el cliente`,
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'No se pudo conectar con el servidor para eliminar el cliente',
      });
    }
  };

  const handleCreateOrUpdateCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setStatusMessage({ type: 'error', text: 'El nombre del cliente es requerido' });
      return;
    }

    const payload = {
      nombre: formData.nombre.trim(),
      apellido: formData.apellido.trim() || null,
      numero_identificacion: formData.numero_identificacion.trim() || null,
      email: formData.email.trim() || null,
      telefono: formData.telefono.trim() || null,
      telefono_secundario: formData.telefono_secundario.trim() || null,
      direccion_texto: formData.direccion_texto.trim() || null,
      tipo_cliente: formData.tipo_cliente,
      notas: formData.notas.trim() || null,
    };

    try {
      const url = editingCliente ? `/api/clientes/${editingCliente.id}` : '/api/clientes';
      const method = editingCliente ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        if (editingCliente) {
          setClientes(clientes.map((c) => (c.id === editingCliente.id ? { ...c, ...payload } : c)));
          setStatusMessage({
            type: 'success',
            text: `Cliente "${payload.nombre}" actualizado exitosamente`,
          });
        } else {
          setClientes([data, ...clientes]);
          setStatusMessage({
            type: 'success',
            text: `Cliente "${data.nombre}" registrado exitosamente`,
          });
        }
        setIsModalOpen(false);
        setEditingCliente(null);
        setFormData({
          nombre: '',
          apellido: '',
          numero_identificacion: '',
          email: '',
          telefono: '',
          telefono_secundario: '',
          direccion_texto: '',
          tipo_cliente: 'detal',
          notas: '',
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al guardar el cliente' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Búsqueda y Registro */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, documento, tel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={() => {
            setEditingCliente(null);
            setFormData({
              nombre: '',
              apellido: '',
              numero_identificacion: '',
              email: '',
              telefono: '',
              telefono_secundario: '',
              direccion_texto: '',
              tipo_cliente: 'detal',
              notas: '',
            });
            setIsModalOpen(true);
          }}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Nuevo Cliente
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          {statusMessage.text}
        </div>
      )}

      {/* Grid de Tarjetas de Clientes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredClientes.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center text-slate-500 text-sm">
            No se encontraron clientes registrados.
          </div>
        ) : (
          filteredClientes.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 hover:border-blue-500/40 transition-all shadow-lg group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-semibold text-blue-400">#{c.id}</span>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      c.tipo_cliente === 'vip'
                        ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        : c.tipo_cliente === 'mayorista'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {c.tipo_cliente || 'detal'}
                  </span>
                  <button
                    onClick={() => handleEditClick(c)}
                    className="p-1 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                    title="Editar cliente"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteCliente(c.id)}
                    className="p-1 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                    title="Eliminar cliente"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-white text-base group-hover:text-blue-300 transition-colors">
                  {c.nombre} {c.apellido || ''}
                </h3>
                {c.numero_identificacion && (
                  <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <CreditCard className="h-3 w-3 text-slate-500" />
                    <span>Doc: {c.numero_identificacion}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80 text-xs text-slate-400">
                {c.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500" />
                    <span>{c.telefono}</span>
                  </div>
                )}
                {c.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{c.email}</span>
                  </div>
                )}
                {(c.direccion_texto || c.direccion?.calle) && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-slate-500" />
                    <span className="truncate">{c.direccion_texto || c.direccion?.calle}</span>
                  </div>
                )}
              </div>

              {/* Métricas del cliente */}
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Compras: <strong>{c.numero_facturas || 0}</strong>
                </span>
                <span className="text-emerald-400 font-semibold">
                  ${formatNumber(c.total_compras || 0)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal Nuevo / Editar Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                {editingCliente
                  ? `Editar Cliente #${editingCliente.id}`
                  : 'Registrar Nuevo Cliente'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingCliente(null);
                }}
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateCliente} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Juan"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">
                    Apellido / Razón
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Pérez o S.A.S."
                    value={formData.apellido}
                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">
                    Documento / NIT
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 1020304050"
                    value={formData.numero_identificacion}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_identificacion: e.target.value })
                    }
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">
                    Tipo de Cliente
                  </label>
                  <select
                    value={formData.tipo_cliente}
                    onChange={(e) => setFormData({ ...formData, tipo_cliente: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="detal">Detal / Minorista</option>
                    <option value="mayorista">Mayorista</option>
                    <option value="vip">VIP / Especial</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">
                    Teléfono Principal
                  </label>
                  <input
                    type="text"
                    placeholder="ej. 301 523 4567"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="cliente@ejemplo.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase">Dirección</label>
                <input
                  type="text"
                  placeholder="ej. Calle 50 #25-15, Medellín"
                  value={formData.direccion_texto}
                  onChange={(e) => setFormData({ ...formData, direccion_texto: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-sm hover:bg-slate-700 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors shadow-lg shadow-blue-500/25"
                >
                  Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
