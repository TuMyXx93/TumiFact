import {
  AlertCircle,
  Apple,
  Boxes,
  CheckCircle2,
  Edit2,
  Footprints,
  Gem,
  Laptop,
  Package,
  Plus,
  Search,
  Shirt,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import type React from 'react';
import { useMemo, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { formatNumber } from '../../lib/format';
import type { Producto } from '../../types';

interface Categoria {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  campos_extra?: Array<{ key: string; label: string; type: string; options?: string[] }>;
}

interface ProductGridProps {
  initialProductos: any[];
  initialCategorias?: Categoria[];
}

export default function ProductGrid({
  initialProductos = [],
  initialCategorias = [],
}: ProductGridProps) {
  const [productos, setProductos] = useState<any[]>(initialProductos);
  const [categorias] = useState<Categoria[]>(initialCategorias);
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any | null>(null);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: initialCategorias[0]?.id || 1,
    precio_detal: '',
    precio_mayorista: '',
    cantidad_mayorista: '12',
    stock_actual: '50',
    stock_minimo: '5',
    precio_kg: '',
    precio_unidad: '',
    precio_libra: '',
    atributos: {} as Record<string, any>,
  });

  const getCategoryIcon = (tipo?: string) => {
    switch (tipo) {
      case 'vestimenta':
        return <Shirt className="h-4 w-4 text-rose-400" />;
      case 'tecnologia':
        return <Laptop className="h-4 w-4 text-cyan-400" />;
      case 'calzado':
        return <Footprints className="h-4 w-4 text-amber-400" />;
      case 'perecedero':
        return <Apple className="h-4 w-4 text-emerald-400" />;
      case 'artesania':
        return <Sparkles className="h-4 w-4 text-purple-400" />;
      case 'bisuteria':
        return <Gem className="h-4 w-4 text-pink-400" />;
      default:
        return <Package className="h-4 w-4 text-blue-400" />;
    }
  };

  const filteredProductos = useMemo(() => {
    return productos.filter((p) => {
      const matchesSearch =
        p.nombre.toLowerCase().includes(search.toLowerCase()) ||
        p.codigo.toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        selectedCategoriaId === 'all' || p.categoria_id === selectedCategoriaId;
      return matchesSearch && matchesCategory;
    });
  }, [productos, search, selectedCategoriaId]);

  const currentSelectedCategory = useMemo(() => {
    return categorias.find((c) => c.id === Number(formData.categoria_id));
  }, [categorias, formData.categoria_id]);

  const handleEditClick = (prod: any) => {
    setEditingProducto(prod);
    setFormData({
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      categoria_id: prod.categoria_id || categorias[0]?.id || 1,
      precio_detal: prod.precio_detal
        ? String(prod.precio_detal)
        : prod.precio_unidad
          ? String(prod.precio_unidad)
          : '',
      precio_mayorista: prod.precio_mayorista ? String(prod.precio_mayorista) : '',
      cantidad_mayorista: prod.cantidad_mayorista ? String(prod.cantidad_mayorista) : '12',
      stock_actual: prod.stock_actual ? String(prod.stock_actual) : '0',
      stock_minimo: prod.stock_minimo ? String(prod.stock_minimo) : '5',
      precio_kg: prod.precio_kg ? String(prod.precio_kg) : '',
      precio_unidad: prod.precio_unidad ? String(prod.precio_unidad) : '',
      precio_libra: prod.precio_libra ? String(prod.precio_libra) : '',
      atributos: typeof prod.atributos === 'object' ? prod.atributos : {},
    });
    setIsModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingProducto(null);
    setFormData({
      codigo: `PROD-${Date.now().toString().slice(-4)}`,
      nombre: '',
      descripcion: '',
      categoria_id: categorias[0]?.id || 1,
      precio_detal: '',
      precio_mayorista: '',
      cantidad_mayorista: '12',
      stock_actual: '50',
      stock_minimo: '5',
      precio_kg: '',
      precio_unidad: '',
      precio_libra: '',
      atributos: {},
    });
    setIsModalOpen(true);
  };

  const handleDeleteProducto = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este producto del catálogo?')) return;

    try {
      const res = await apiFetch(`/api/productos/${id}`, { method: 'DELETE' });
      let data: any = {};
      try {
        data = await res.json();
      } catch (_) {}

      if (res.ok) {
        setProductos(productos.filter((p) => p.id !== id));
        setStatusMessage({
          type: 'success',
          text: data.message || 'Producto eliminado exitosamente',
        });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al eliminar' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de conexión' });
    }
  };

  const handleCreateOrUpdateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setStatusMessage({ type: 'error', text: 'El código y el nombre son obligatorios' });
      return;
    }

    const pDetal =
      Number(formData.precio_detal) ||
      Number(formData.precio_unidad) ||
      Number(formData.precio_kg) ||
      0;
    const pMayor = Number(formData.precio_mayorista) || pDetal;

    // Normalizar atributos según la categoría actual
    const cleanedAtributos: Record<string, any> = {};
    if (currentSelectedCategory?.campos_extra) {
      for (const campo of currentSelectedCategory.campos_extra) {
        const rawVal = formData.atributos[campo.key];
        if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
          if (campo.type === 'number') {
            const num = Number(rawVal);
            cleanedAtributos[campo.key] = isNaN(num) ? rawVal : num;
          } else {
            cleanedAtributos[campo.key] = rawVal;
          }
        }
      }
    } else if (formData.atributos && typeof formData.atributos === 'object') {
      Object.entries(formData.atributos).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanedAtributos[k] = v;
        }
      });
    }

    const payload = {
      codigo: formData.codigo.trim(),
      nombre: formData.nombre.trim(),
      descripcion: formData.descripcion.trim() || null,
      categoria_id: Number(formData.categoria_id) || null,
      precio_detal: pDetal,
      precio_mayorista: pMayor,
      cantidad_mayorista: Number(formData.cantidad_mayorista) || 10,
      stock_actual: Number(formData.stock_actual) || 0,
      stock_minimo: Number(formData.stock_minimo) || 5,
      precio_unidad: pDetal,
      precio_kg: Number(formData.precio_kg) || pDetal,
      precio_libra: Number(formData.precio_libra) || pDetal / 2,
      atributos: cleanedAtributos,
    };

    try {
      const url = editingProducto ? `/api/productos/${editingProducto.id}` : '/api/productos';
      const method = editingProducto ? 'PUT' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        const catInfo = categorias.find((c) => c.id === payload.categoria_id);
        const enriched = {
          ...data,
          ...payload,
          id: editingProducto ? editingProducto.id : data.id,
          categoria_nombre: catInfo?.nombre || 'General',
          categoria_tipo: catInfo?.tipo || 'generico',
        };

        if (editingProducto) {
          setProductos(productos.map((p) => (p.id === editingProducto.id ? enriched : p)));
          setStatusMessage({
            type: 'success',
            text: `Producto "${payload.nombre}" actualizado con éxito`,
          });
        } else {
          setProductos([enriched, ...productos]);
          setStatusMessage({
            type: 'success',
            text: `Producto "${payload.nombre}" añadido al catálogo`,
          });
        }
        setIsModalOpen(false);
      } else {
        let errorDetail = data.error || 'Error al guardar producto';
        if (data.details && typeof data.details === 'object') {
          const detailStrings = Object.entries(data.details).map(([k, v]) => `${k}: ${v}`);
          if (detailStrings.length > 0) {
            errorDetail += ` (${detailStrings.join(', ')})`;
          }
        }
        setStatusMessage({ type: 'error', text: errorDetail });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de conexión con el servidor' });
    }
  };

  return (
    <div className="space-y-6">
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

      <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 lg:pb-0 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedCategoriaId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategoriaId === 'all'
                ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <Boxes className="h-3.5 w-3.5" />
            Todas las Familias ({productos.length})
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategoriaId(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategoriaId === cat.id
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-500/20'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {getCategoryIcon(cat.tipo)}
              {cat.nombre}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar por nombre, código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          <button
            onClick={handleOpenNewModal}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 shrink-0"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-800/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-5 py-3.5">Código</th>
                <th className="px-5 py-3.5">Producto & Familia</th>
                <th className="px-5 py-3.5">Atributos / Variante</th>
                <th className="px-5 py-3.5">Precio Detal</th>
                <th className="px-5 py-3.5">Precio Mayorista</th>
                <th className="px-5 py-3.5">Stock</th>
                <th className="px-5 py-3.5 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {filteredProductos.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No se encontraron productos para los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                filteredProductos.map((item) => {
                  const attrs =
                    typeof item.atributos === 'object' && item.atributos ? item.atributos : {};
                  const attrEntries = Object.entries(attrs).filter(
                    ([_, v]) => v !== undefined && v !== ''
                  );

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-blue-400 font-medium">
                        {item.codigo}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {getCategoryIcon(item.categoria_tipo)}
                          <div>
                            <p className="font-semibold text-white">{item.nombre}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {item.categoria_nombre || 'General'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {attrEntries.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {attrEntries.map(([k, v]) => (
                              <span
                                key={k}
                                className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] font-mono text-slate-300"
                              >
                                {k}: <strong className="text-white">{String(v)}</strong>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-emerald-400 font-bold font-mono">
                        $
                        {formatNumber(
                          item.precio_detal || item.precio_unidad || item.precio_kg || 0
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-cyan-400 font-mono">
                        {item.precio_mayorista ? (
                          <span>
                            ${formatNumber(item.precio_mayorista)}{' '}
                            <span className="text-[10px] text-slate-500">
                              (≥{item.cantidad_mayorista || 10} uds)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600 text-[11px]">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold ${
                            Number(item.stock_actual) <= Number(item.stock_minimo || 5)
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          }`}
                        >
                          {item.stock_actual || 0} uds
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors"
                            title="Editar producto"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProducto(item.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                            title="Eliminar producto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white font-['Space_Grotesk'] flex items-center gap-2">
                <Package className="h-5 w-5 text-blue-400" />
                {editingProducto
                  ? `Editar Producto: ${editingProducto.nombre}`
                  : 'Registrar Producto en Catálogo'}
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

            <form onSubmit={handleCreateOrUpdateProducto} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Familia de Producto *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {categorias.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, categoria_id: cat.id })}
                      className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all text-left ${
                        Number(formData.categoria_id) === cat.id
                          ? 'bg-blue-600/20 border-blue-500 text-white font-bold'
                          : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {getCategoryIcon(cat.tipo)}
                      <span className="truncate">{cat.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 uppercase">
                    Código SKU / EAN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. VEST-001"
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Camiseta Polo Algodón"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase">
                  Descripción Breve (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="ej. Disco de estado sólido Kingston 512GB NVMe M.2"
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                <div>
                  <label className="font-semibold text-emerald-400 uppercase">
                    Precio Detal (Venta) *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="any"
                    placeholder="45000"
                    value={formData.precio_detal}
                    onChange={(e) => setFormData({ ...formData, precio_detal: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-cyan-400 uppercase">Precio Mayorista</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="35000"
                    value={formData.precio_mayorista}
                    onChange={(e) => setFormData({ ...formData, precio_mayorista: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase">
                    Mínimo Mayorista (Uds)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="12"
                    value={formData.cantidad_mayorista}
                    onChange={(e) =>
                      setFormData({ ...formData, cantidad_mayorista: e.target.value })
                    }
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 uppercase">Stock Inicial</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    className="w-full mt-1 px-3.5 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {currentSelectedCategory?.campos_extra &&
                currentSelectedCategory.campos_extra.length > 0 && (
                  <div className="space-y-3 p-4 rounded-xl bg-slate-800/30 border border-slate-800">
                    <p className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="h-3.5 w-3.5 text-blue-400" />
                      Atributos Específicos ({currentSelectedCategory.nombre})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {currentSelectedCategory.campos_extra.map((campo) => (
                        <div key={campo.key}>
                          <label className="text-slate-400 uppercase font-semibold">
                            {campo.label}
                          </label>
                          {campo.type === 'select' && campo.options ? (
                            <select
                              value={formData.atributos[campo.key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  atributos: { ...formData.atributos, [campo.key]: e.target.value },
                                })
                              }
                              className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            >
                              <option value="">Seleccione...</option>
                              {campo.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={
                                campo.type === 'number'
                                  ? 'number'
                                  : campo.type === 'date'
                                    ? 'date'
                                    : 'text'
                              }
                              placeholder={`ej. ${campo.label}`}
                              value={formData.atributos[campo.key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  atributos: { ...formData.atributos, [campo.key]: e.target.value },
                                })
                              }
                              className="w-full mt-1 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-blue-500"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-blue-500/25 transition-all"
                >
                  {editingProducto ? 'Actualizar Producto' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
