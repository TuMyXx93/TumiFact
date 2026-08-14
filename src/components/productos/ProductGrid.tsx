import React, { useState } from 'react';
import type { Producto } from '../../types';
import { Package, Plus, Search, CheckCircle2, AlertCircle, Trash2, Edit2 } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { formatNumber } from '../../lib/format';

interface ProductGridProps {
  initialProductos: Producto[];
}

export default function ProductGrid({ initialProductos = [] }: ProductGridProps) {
  const [productos, setProductos] = useState<Producto[]>(initialProductos);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<Producto | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Formulario nuevo/editar producto
  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    precio_kg: '',
    precio_unidad: '',
    precio_libra: ''
  });

  const filteredProductos = productos.filter(
    (p) =>
      p.nombre.toLowerCase().includes(search.toLowerCase()) ||
      p.codigo.toLowerCase().includes(search.toLowerCase())
  );

  const handleEditClick = (prod: Producto) => {
    setEditingProducto(prod);
    setFormData({
      codigo: prod.codigo,
      nombre: prod.nombre,
      precio_kg: prod.precio_kg ? String(prod.precio_kg) : '',
      precio_unidad: prod.precio_unidad ? String(prod.precio_unidad) : '',
      precio_libra: prod.precio_libra ? String(prod.precio_libra) : ''
    });
    setIsModalOpen(true);
  };

  const handleDeleteProducto = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;

    try {
      const res = await apiFetch(`/api/productos/${id}`, { method: 'DELETE' });

      // Parseo seguro del body
      let data: any = {};
      try { data = await res.json(); } catch (_) {}

      if (res.ok) {
        setProductos(productos.filter((p) => p.id !== id));
        setStatusMessage({ type: 'success', text: data.message || 'Producto eliminado exitosamente' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || `Error ${res.status} al eliminar el producto` });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'No se pudo conectar con el servidor para eliminar el producto' });
    }
  };

  const handleCreateOrUpdateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setStatusMessage({ type: 'error', text: 'El código y el nombre son requeridos' });
      return;
    }

    const payload = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      precio_kg: formData.precio_kg ? Number(formData.precio_kg) : 0,
      precio_unidad: formData.precio_unidad ? Number(formData.precio_unidad) : 0,
      precio_libra: formData.precio_libra ? Number(formData.precio_libra) : 0
    };

    try {
      const url = editingProducto
        ? `/api/productos/${editingProducto.id}`
        : '/api/productos';
      const method = editingProducto ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        if (editingProducto) {
          setProductos(productos.map((p) => (p.id === editingProducto.id ? { ...p, ...payload } : p)));
          setStatusMessage({ type: 'success', text: `Producto "${payload.nombre}" actualizado con éxito` });
        } else {
          setProductos([data, ...productos]);
          setStatusMessage({ type: 'success', text: `Producto "${data.nombre}" creado con éxito` });
        }
        setIsModalOpen(false);
        setEditingProducto(null);
        setFormData({ codigo: '', nombre: '', precio_kg: '', precio_unidad: '', precio_libra: '' });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al guardar el producto' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error al conectar con el servidor' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles de Búsqueda y Botón Crear */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código o nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Nuevo Producto
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
          {statusMessage.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {statusMessage.text}
        </div>
      )}

      {/* Tabla Interactivas de Productos */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Nombre del Producto</th>
                <th className="px-6 py-4">Precio KG</th>
                <th className="px-6 py-4">Precio Unidad</th>
                <th className="px-6 py-4">Precio Libra</th>
                <th className="px-6 py-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron productos registrados.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-400">#{item.id}</td>
                    <td className="px-6 py-4 font-mono text-blue-400 font-medium">{item.codigo}</td>
                    <td className="px-6 py-4 font-medium text-white">{item.nombre}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">${formatNumber(item.precio_kg || 0)}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">${formatNumber(item.precio_unidad || 0)}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">${formatNumber(item.precio_libra || 0)}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEditClick(item)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                          title="Editar producto"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProducto(item.id)}
                          className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                          title="Eliminar producto"
                        >
                          <Trash2 className="h-4 w-4" />
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

      {/* Modal Nuevo / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                {editingProducto ? `Editar Producto #${editingProducto.id}` : 'Registrar Nuevo Producto'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProducto(null);
                }}
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateProducto} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Código *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. FRESA-002"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 uppercase">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Manzana Roja"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-semibold text-slate-300 uppercase">Precio KG ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.precio_kg}
                    onChange={(e) => setFormData({ ...formData, precio_kg: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 uppercase">Precio Unidad ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.precio_unidad}
                    onChange={(e) => setFormData({ ...formData, precio_unidad: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-semibold text-slate-300 uppercase">Precio Libra ($)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={formData.precio_libra}
                    onChange={(e) => setFormData({ ...formData, precio_libra: e.target.value })}
                    className="w-full mt-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
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
                  Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
