import {
  AlertCircle,
  Building2,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit2,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Plus,
  Search,
  Trash2,
  Truck,
  User,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import type { Proveedor } from '../../types';

interface ProveedoresManagerProps {
  initialProveedores?: Proveedor[];
}

export default function ProveedoresManager({
  initialProveedores = [],
}: ProveedoresManagerProps) {
  const [proveedores, setProveedores] = useState<Proveedor[]>(
    initialProveedores.filter((p) => p.activo !== false)
  );
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Formulario nuevo / editar proveedor
  const [formData, setFormData] = useState({
    nombre: '',
    razon_social: '',
    numero_identificacion: '',
    contacto_nombre: '',
    email: '',
    telefono: '',
    telefono_secundario: '',
    website: '',
    direccion_texto: '',
    plazo_pago_dias: 30,
    moneda: 'COP',
    notas: '',
  });

  const filteredProveedores = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (!term) return proveedores;
    return proveedores.filter((p) => {
      const nombre = (p.nombre || '').toLowerCase();
      const razon = (p.razon_social || '').toLowerCase();
      const nit = (p.numero_identificacion || '').toLowerCase();
      const contacto = (p.contacto_nombre || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const tel = (p.telefono || '').toLowerCase();
      return (
        nombre.includes(term) ||
        razon.includes(term) ||
        nit.includes(term) ||
        contacto.includes(term) ||
        email.includes(term) ||
        tel.includes(term)
      );
    });
  }, [proveedores, search]);

  const resetForm = () => {
    setFormData({
      nombre: '',
      razon_social: '',
      numero_identificacion: '',
      contacto_nombre: '',
      email: '',
      telefono: '',
      telefono_secundario: '',
      website: '',
      direccion_texto: '',
      plazo_pago_dias: 30,
      moneda: 'COP',
      notas: '',
    });
    setEditingProveedor(null);
  };

  const handleOpenCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditClick = (p: Proveedor) => {
    setEditingProveedor(p);
    setFormData({
      nombre: p.nombre || '',
      razon_social: p.razon_social || '',
      numero_identificacion: p.numero_identificacion || '',
      contacto_nombre: p.contacto_nombre || '',
      email: p.email || '',
      telefono: p.telefono || '',
      telefono_secundario: p.telefono_secundario || '',
      website: p.website || '',
      direccion_texto: (p as any).direccion_texto || p.direccion?.calle || '',
      plazo_pago_dias: p.plazo_pago_dias ?? 30,
      moneda: p.moneda || 'COP',
      notas: p.notas || '',
    });
    setIsModalOpen(true);
  };

  const handleDeleteProveedor = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Estás seguro de desactivar el proveedor "${nombre}"?`)) return;

    try {
      const res = await apiFetch(`/api/proveedores/${id}`, { method: 'DELETE' });
      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (res.ok) {
        setProveedores((prev) => prev.filter((p) => p.id !== id));
        setStatusMessage({
          type: 'success',
          text: data.message || `Proveedor "${nombre}" eliminado exitosamente`,
        });
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || `Error ${res.status} al eliminar proveedor`,
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error de conexión al intentar eliminar el proveedor',
      });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'El nombre del proveedor es obligatorio',
      });
      return;
    }

    const payload = {
      nombre: formData.nombre.trim(),
      razon_social: formData.razon_social.trim() || undefined,
      numero_identificacion: formData.numero_identificacion.trim() || undefined,
      contacto_nombre: formData.contacto_nombre.trim() || undefined,
      email: formData.email.trim() || undefined,
      telefono: formData.telefono.trim() || undefined,
      telefono_secundario: formData.telefono_secundario.trim() || undefined,
      website: formData.website.trim() || undefined,
      direccion_texto: formData.direccion_texto.trim() || undefined,
      plazo_pago_dias: Number(formData.plazo_pago_dias) || 30,
      moneda: formData.moneda || 'COP',
      notas: formData.notas.trim() || undefined,
    };

    setIsSubmitting(true);
    try {
      const url = editingProveedor
        ? `/api/proveedores/${editingProveedor.id}`
        : '/api/proveedores';
      const method = editingProveedor ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        const savedProveedor: Proveedor = data.proveedor || data;
        if (editingProveedor) {
          setProveedores((prev) =>
            prev.map((p) => (p.id === editingProveedor.id ? { ...p, ...savedProveedor } : p))
          );
          setStatusMessage({
            type: 'success',
            text: `Proveedor "${payload.nombre}" actualizado exitosamente`,
          });
        } else {
          setProveedores((prev) => [savedProveedor, ...prev]);
          setStatusMessage({
            type: 'success',
            text: `Proveedor "${payload.nombre}" registrado exitosamente`,
          });
        }
        setIsModalOpen(false);
        resetForm();
        setTimeout(() => setStatusMessage(null), 3500);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al guardar el proveedor',
        });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error de red o conexión al comunicarse con el servidor',
      });
    } finally {
      setIsSubmitting(false);
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
            placeholder="Buscar por nombre, NIT, contacto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          Nuevo Proveedor
        </button>
      </div>

      {/* Mensaje de Estado / Feedback */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs font-semibold flex items-center gap-2 border ${
            statusMessage.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Grid de Tarjetas de Proveedores */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProveedores.length === 0 ? (
          <div className="col-span-full bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4">
              <Truck className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white font-['Outfit'] mb-1">
              No hay proveedores {search ? 'que coincidan con la búsqueda' : 'registrados'}
            </h3>
            <p className="text-sm text-slate-400 max-w-md mx-auto mb-6">
              {search
                ? 'Intente con otro término de búsqueda o limpie el filtro actual.'
                : 'Empiece registrando proveedores para gestionar compras, entradas de inventario y plazos de pago.'}
            </p>
            {!search && (
              <button
                onClick={handleOpenCreateModal}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" /> Registrar Primer Proveedor
              </button>
            )}
          </div>
        ) : (
          filteredProveedores.map((p) => (
            <div
              key={p.id}
              className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 rounded-2xl p-5 transition-all shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-0.5 flex flex-col justify-between group"
            >
              <div>
                {/* Header de la tarjeta */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-sm shrink-0">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white group-hover:text-indigo-300 transition-colors text-base leading-tight">
                        {p.nombre}
                      </h4>
                      {p.razon_social && p.razon_social !== p.nombre && (
                        <p className="text-xs text-slate-400 leading-tight mt-0.5">
                          {p.razon_social}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Badges de condición comercial */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-300 border border-slate-700">
                      {p.moneda || 'COP'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {p.plazo_pago_dias} días
                    </span>
                  </div>
                </div>

                {/* Identificación */}
                {p.numero_identificacion && (
                  <div className="mb-3 px-3 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 text-[11px] text-slate-300 font-mono flex items-center justify-between">
                    <span className="text-slate-500">NIT / Doc:</span>
                    <span className="font-semibold">{p.numero_identificacion}</span>
                  </div>
                )}

                {/* Detalles de Contacto */}
                <div className="space-y-2 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80">
                  {p.contacto_nombre && (
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-300">{p.contacto_nombre}</span>
                    </div>
                  )}

                  {p.telefono && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <a
                        href={`tel:${p.telefono}`}
                        className="text-slate-300 hover:text-indigo-400 transition-colors"
                      >
                        {p.telefono}
                      </a>
                      {p.telefono_secundario && (
                        <span className="text-slate-600">/ {p.telefono_secundario}</span>
                      )}
                    </div>
                  )}

                  {p.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <a
                        href={`mailto:${p.email}`}
                        className="text-slate-300 hover:text-indigo-400 transition-colors truncate"
                      >
                        {p.email}
                      </a>
                    </div>
                  )}

                  {p.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <a
                        href={p.website.startsWith('http') ? p.website : `https://${p.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline inline-flex items-center gap-1 truncate"
                      >
                        {p.website} <ExternalLink className="h-3 w-3 inline" />
                      </a>
                    </div>
                  )}

                  {((p as any).direccion_texto || p.direccion?.calle) && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                      <span className="text-slate-400 truncate">
                        {(p as any).direccion_texto || p.direccion?.calle}
                      </span>
                    </div>
                  )}

                  {p.notas && (
                    <div className="mt-2 text-[11px] text-slate-500 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/40">
                      "{p.notas}"
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones de Tarjeta */}
              <div className="flex items-center justify-end gap-2 mt-5 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleEditClick(p)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-indigo-600/20 text-slate-300 hover:text-indigo-400 border border-slate-700 hover:border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  title="Editar proveedor"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Editar
                </button>
                <button
                  onClick={() => handleDeleteProveedor(p.id, p.nombre)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 transition-colors cursor-pointer"
                  title="Desactivar proveedor"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de Crear / Editar Proveedor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0d1424] border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white font-['Outfit']">
                    {editingProveedor ? 'Editar Proveedor' : 'Registrar Nuevo Proveedor'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingProveedor
                      ? `Actualizar información comercial de ${editingProveedor.nombre}`
                      : 'Complete los datos del distribuidor o proveedor mayorista'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nombre Comercial */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Nombre Comercial *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Andina S.A.S."
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Razón Social */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Razón Social
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuciones Andinas Ltda."
                    value={formData.razon_social}
                    onChange={(e) => setFormData({ ...formData, razon_social: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* NIT / Documento */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    NIT / Identificación Fiscal
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 900.123.456-1"
                    value={formData.numero_identificacion}
                    onChange={(e) =>
                      setFormData({ ...formData, numero_identificacion: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Contacto Principal */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez (Asesor Comercial)"
                    value={formData.contacto_nombre}
                    onChange={(e) => setFormData({ ...formData, contacto_nombre: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Correo Electrónico
                  </label>
                  <input
                    type="email"
                    placeholder="ventas@proveedor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Teléfono Principal
                  </label>
                  <input
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Teléfono Secundario */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Teléfono Secundario / PBX
                  </label>
                  <input
                    type="tel"
                    placeholder="(601) 234 5678"
                    value={formData.telefono_secundario}
                    onChange={(e) =>
                      setFormData({ ...formData, telefono_secundario: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Sitio Web */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Sitio Web
                  </label>
                  <input
                    type="text"
                    placeholder="www.proveedor.com"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Dirección */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Dirección Física / Despacho
                  </label>
                  <input
                    type="text"
                    placeholder="Zona Industrial Calle 13 #50-20"
                    value={formData.direccion_texto}
                    onChange={(e) =>
                      setFormData({ ...formData, direccion_texto: e.target.value })
                    }
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Plazo de Pago */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Plazo de Pago (Días)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formData.plazo_pago_dias}
                    onChange={(e) =>
                      setFormData({ ...formData, plazo_pago_dias: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Moneda */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Moneda de Facturación
                  </label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="COP">COP — Peso Colombiano</option>
                    <option value="USD">USD — Dólar Americano</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>

                {/* Notas / Observaciones */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Notas y Términos Comerciales
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Descuentos por pronto pago, horarios de entrega, etc."
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                  />
                </div>
              </div>

              {/* Botones de acción del Modal */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
                >
                  {isSubmitting
                    ? 'Guardando...'
                    : editingProveedor
                    ? 'Actualizar Proveedor'
                    : 'Guardar Proveedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
