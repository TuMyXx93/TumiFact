import {
  AlertCircle,
  Boxes,
  CheckCircle2,
  Edit2,
  Footprints,
  Laptop,
  Package,
  Plus,
  RefreshCw,
  Search,
  Shirt,
  SlidersHorizontal,
  Tag,
  Trash2,
  Truck,
} from 'lucide-react';
import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../../lib/apiClient';
import { formatNumber } from '../../lib/format';
import type { Producto } from '../../types';

interface Categoria {
  id: number;
  nombre: string;
  tipo: string;
  descripcion?: string;
  campos_extra?: Array<{
    key: string;
    label: string;
    type: string;
    options?: string[];
  }>;
}

interface ProveedorSummary {
  id: number;
  nombre: string;
  numero_identificacion?: string | null;
  activo?: boolean;
}

interface ProductGridProps {
  initialProductos: any[];
  initialCategorias?: Categoria[];
  initialProveedores?: ProveedorSummary[];
}

export default function ProductGrid({
  initialProductos = [],
  initialCategorias = [],
  initialProveedores = [],
}: ProductGridProps) {
  const [productos, setProductos] = useState<any[]>(
    initialProductos.filter((p) => p.activo !== false)
  );
  const [categorias, setCategorias] = useState<Categoria[]>(
    initialCategorias.filter((c: any) => c.activo !== false)
  );
  const [proveedores, setProveedores] = useState<ProveedorSummary[]>(
    initialProveedores.filter((pv: any) => pv.activo !== false)
  );
  const [selectedCategoriaId, setSelectedCategoriaId] = useState<number | 'all'>('all');
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProducto, setEditingProducto] = useState<any | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingProveedores, setIsLoadingProveedores] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    codigo: '',
    nombre: '',
    descripcion: '',
    categoria_id: initialCategorias[0]?.id ?? null,
    proveedor_id: null as number | null,
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

  // Auto-recuperación de categorías si llegan vacías por SSR
  const fetchCategorias = async () => {
    try {
      setIsLoadingCategories(true);
      const res = await apiFetch('/api/categorias');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const activeCats = data.filter((c: any) => c.activo !== false);
          setCategorias(activeCats);
          if (!formData.categoria_id && activeCats.length > 0) {
            setFormData((prev) => ({ ...prev, categoria_id: activeCats[0].id }));
          }
        }
      }
    } catch (err) {
      console.error('Error auto-recuperando categorías:', err);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Auto-recuperación de proveedores si llegan vacíos por SSR
  const fetchProveedores = async () => {
    try {
      setIsLoadingProveedores(true);
      const res = await apiFetch('/api/proveedores');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setProveedores(data.filter((pv: any) => pv.activo !== false));
        }
      }
    } catch (err) {
      console.error('Error auto-recuperando proveedores:', err);
    } finally {
      setIsLoadingProveedores(false);
    }
  };

  useEffect(() => {
    if (categorias.length === 0) {
      fetchCategorias();
    }
    if (proveedores.length === 0) {
      fetchProveedores();
    }
  }, []);

  const getCategoryIcon = (tipo?: string) => {
    switch (tipo?.toLowerCase()) {
      case 'ropa':
        return <Shirt className="h-4 w-4 text-rose-400" />;
      case 'tecnologia':
        return <Laptop className="h-4 w-4 text-cyan-400" />;
      case 'calzado':
        return <Footprints className="h-4 w-4 text-amber-400" />;
      case 'articulos':
        return <Package className="h-4 w-4 text-emerald-400" />;
      default:
        return <Boxes className="h-4 w-4 text-blue-400" />;
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

  const handleCategorySelect = (catId: number) => {
    const nextCat = categorias.find((c) => c.id === catId);
    const cleanAttrs: Record<string, any> = {};
    if (nextCat?.campos_extra) {
      for (const field of nextCat.campos_extra) {
        cleanAttrs[field.key] = formData.atributos[field.key] ?? '';
      }
    }
    setFormData((prev) => ({
      ...prev,
      categoria_id: catId,
      atributos: cleanAttrs,
    }));
  };

  const handleEditClick = (prod: any) => {
    setEditingProducto(prod);
    const catId = prod.categoria_id || (categorias[0]?.id ?? null);
    setFormData({
      codigo: prod.codigo,
      nombre: prod.nombre,
      descripcion: prod.descripcion || '',
      categoria_id: catId,
      proveedor_id: prod.proveedor_id ? Number(prod.proveedor_id) : null,
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
      atributos: typeof prod.atributos === 'object' && prod.atributos ? prod.atributos : {},
    });
    setIsModalOpen(true);
  };

  const handleOpenNewModal = () => {
    setEditingProducto(null);
    const defaultCatId = categorias[0]?.id ?? null;
    const defaultCat = categorias.find((c) => c.id === defaultCatId);
    const defaultAttrs: Record<string, any> = {};
    if (defaultCat?.campos_extra) {
      for (const field of defaultCat.campos_extra) {
        defaultAttrs[field.key] = '';
      }
    }
    setFormData({
      codigo: `PROD-${Date.now().toString().slice(-4)}`,
      nombre: '',
      descripcion: '',
      categoria_id: defaultCatId,
      proveedor_id: null,
      precio_detal: '',
      precio_mayorista: '',
      cantidad_mayorista: '12',
      stock_actual: '50',
      stock_minimo: '5',
      precio_kg: '',
      precio_unidad: '',
      precio_libra: '',
      atributos: defaultAttrs,
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
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage({
          type: 'error',
          text: data.error || 'Error al eliminar el producto',
        });
        setTimeout(() => setStatusMessage(null), 5000);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de conexión con el servidor' });
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  const handleCreateOrUpdateProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.codigo.trim() || !formData.nombre.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'El código y el nombre del producto son obligatorios',
      });
      return;
    }

    if (!formData.categoria_id) {
      setStatusMessage({
        type: 'error',
        text: 'Debe seleccionar una familia de producto',
      });
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
      categoria_id: Number(formData.categoria_id),
      proveedor_id: formData.proveedor_id ? Number(formData.proveedor_id) : null,
      precio_detal: pDetal,
      precio_mayorista: pMayor,
      cantidad_mayorista: Number(formData.cantidad_mayorista) || 10,
      stock_actual: Number(formData.stock_actual) || 0,
      stock_minimo: Number(formData.stock_minimo) || 5,
      precio_unidad: pDetal,
      precio_kg: pDetal,
      precio_libra: Math.round(pDetal / 2),
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
        const provInfo = proveedores.find((pv) => pv.id === payload.proveedor_id);
        const enriched = {
          ...data,
          ...payload,
          id: editingProducto ? editingProducto.id : data.id,
          categoria_nombre: catInfo?.nombre || 'General',
          categoria_tipo: catInfo?.tipo || 'articulos',
          proveedor_nombre: provInfo?.nombre || data.proveedor_nombre || null,
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
        let errorDetail = data.error || 'Error al guardar el producto';
        if (data.details && typeof data.details === 'object') {
          const detailStrings = Object.entries(data.details).map(([k, v]) => `${k}: ${v}`);
          if (detailStrings.length > 0) {
            errorDetail += ` (${detailStrings.join(', ')})`;
          }
        }
        setStatusMessage({ type: 'error', text: errorDetail });
      }
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: 'Error de conexión con el servidor',
      });
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

      {/* Barra de Filtros por Familia y Búsqueda */}
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

          {categorias.length === 0 && (
            <button
              type="button"
              onClick={fetchCategorias}
              disabled={isLoadingCategories}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingCategories ? 'animate-spin' : ''}`} />
              Cargar Familias
            </button>
          )}
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
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5 shrink-0 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Nuevo Producto
          </button>
        </div>
      </div>

      {/* Tabla de Productos */}
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
                    ([_, v]) => v !== undefined && v !== '' && v !== null
                  );
                  const isCalzado = item.categoria_tipo === 'calzado';
                  const unitLabel = isCalzado ? 'pares' : 'uds';

                  return (
                    <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-blue-400 font-medium">
                        {item.codigo}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/50 shrink-0">
                            {getCategoryIcon(item.categoria_tipo)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white truncate">{item.nombre}</p>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 font-mono">
                                {item.categoria_nombre || 'General'}
                              </span>
                              {item.proveedor_nombre ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded-md">
                                  <Truck className="h-2.5 w-2.5" />
                                  {item.proveedor_nombre}
                                </span>
                              ) : (
                                <span className="inline-flex items-center text-[10px] text-slate-500 italic">
                                  (Sin proveedor)
                                </span>
                              )}
                            </div>
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
                        ${formatNumber(item.precio_detal || item.precio_unidad || 0)}
                      </td>
                      <td className="px-5 py-3.5 text-cyan-400 font-mono">
                        {item.precio_mayorista ? (
                          <span>
                            ${formatNumber(item.precio_mayorista)}{' '}
                            <span className="text-[10px] text-slate-500">
                              (≥{item.cantidad_mayorista || 10} {unitLabel})
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
                          {item.stock_actual || 0} {unitLabel}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleEditClick(item)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-blue-400 rounded-lg transition-colors cursor-pointer"
                            title="Editar producto"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteProducto(item.id)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors cursor-pointer"
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

      {/* Modal de Crear / Editar Producto */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#0d1424] border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white font-['Outfit'] flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                  <Package className="h-5 w-5" />
                </div>
                {editingProducto
                  ? `Editar Producto: ${editingProducto.nombre}`
                  : 'Registrar Producto en Catálogo'}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingProducto(null);
                }}
                className="text-slate-400 hover:text-white transition-colors text-lg p-2 hover:bg-slate-800 rounded-xl cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateOrUpdateProducto} className="space-y-5 text-xs">
              {/* Sección 1: Selección de Familia de Producto */}
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Familia de Producto *</span>
                  {currentSelectedCategory && (
                    <span className="text-blue-400 font-mono text-[11px] font-bold">
                      Seleccionado: {currentSelectedCategory.nombre}
                    </span>
                  )}
                </label>

                {categorias.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
                    <span>No hay familias cargadas. Haga clic para sincronizar.</span>
                    <button
                      type="button"
                      onClick={fetchCategorias}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors"
                    >
                      Cargar Familias
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {categorias.map((cat) => {
                      const isSelected = Number(formData.categoria_id) === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => handleCategorySelect(cat.id)}
                          className={`p-3 rounded-2xl border flex flex-col items-center text-center gap-1.5 transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg shadow-blue-500/10 scale-[1.02]'
                              : 'bg-slate-900/90 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                          }`}
                        >
                          <div
                            className={`p-2 rounded-xl ${
                              isSelected
                                ? 'bg-blue-500/20 text-blue-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {getCategoryIcon(cat.tipo)}
                          </div>
                          <span className="font-bold text-xs leading-tight">{cat.nombre}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sección 2: Datos Básicos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Código SKU / EAN *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. ROPA-001, TEC-002..."
                    value={formData.codigo}
                    onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 font-mono transition-colors"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Camiseta Polo Algodón Piqué"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                  Descripción Breve (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalles, especificaciones y características principales..."
                  value={formData.descripcion}
                  onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>

              {/* Sección: Proveedor Asociado (Opcional) */}
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-2">
                <label className="font-semibold text-slate-300 uppercase tracking-wider block flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Truck className="h-4 w-4 text-indigo-400" />
                    Proveedor Mayorista (Opcional)
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">
                    Asociación manual o posterior
                  </span>
                </label>
                <select
                  value={formData.proveedor_id ?? ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      proveedor_id: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="">-- Sin proveedor asignado --</option>
                  {proveedores.map((prov) => (
                    <option key={prov.id} value={prov.id}>
                      {prov.nombre}{' '}
                      {prov.numero_identificacion ? `(${prov.numero_identificacion})` : ''}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500">
                  {proveedores.length === 0
                    ? 'No hay proveedores registrados en el directorio. Puede registrarlos en el módulo de Proveedores y asociarlos aquí en cualquier momento.'
                    : 'Seleccione un proveedor para vincular los suministros de este producto, o déjelo vacío si es de fabricación propia o adquisición libre.'}
                </p>
              </div>

              {/* Sección 3: Precios */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                <div>
                  <label className="font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
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
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
                    Precio Mayorista
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="35000"
                    value={formData.precio_mayorista}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        precio_mayorista: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-cyan-400 font-mono font-bold focus:outline-none focus:border-cyan-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Mínimo Mayorista (
                    {currentSelectedCategory?.tipo === 'calzado' ? 'Pares' : 'Uds'})
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="12"
                    value={formData.cantidad_mayorista}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cantidad_mayorista: e.target.value,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Sección 4: Inventario */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Stock Inicial ({currentSelectedCategory?.tipo === 'calzado' ? 'Pares' : 'Uds'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_actual}
                    onChange={(e) => setFormData({ ...formData, stock_actual: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                    Stock Mínimo (Alerta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock_minimo}
                    onChange={(e) => setFormData({ ...formData, stock_minimo: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
              </div>

              {/* Sección 5: Atributos Dinámicos Específicos según Familia */}
              {currentSelectedCategory?.campos_extra &&
                currentSelectedCategory.campos_extra.length > 0 && (
                  <div className="space-y-3 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
                    <p className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-400" />
                      Atributos Específicos ({currentSelectedCategory.nombre})
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {currentSelectedCategory.campos_extra.map((campo) => (
                        <div key={campo.key}>
                          <label className="text-slate-400 uppercase font-semibold text-[11px] block mb-1">
                            {campo.label}
                          </label>
                          {campo.type === 'select' && campo.options ? (
                            <select
                              value={formData.atributos[campo.key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  atributos: {
                                    ...formData.atributos,
                                    [campo.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                            >
                              <option value="">Seleccione {campo.label}...</option>
                              {campo.options.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type={campo.type === 'number' ? 'number' : 'text'}
                              placeholder={`ej. ${campo.label}`}
                              value={formData.atributos[campo.key] || ''}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  atributos: {
                                    ...formData.atributos,
                                    [campo.key]: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Botones de acción del Modal */}
              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingProducto(null);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
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
