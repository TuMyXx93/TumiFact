import React, { useState, useEffect } from 'react';
import type { Producto, Cliente, DetalleFacturaInput } from '../../types';
import { ShoppingCart, User, Plus, Trash2, Printer, Search, CheckCircle2, AlertCircle, FolderOpen, BookmarkPlus, X } from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';

interface BillingPOSProps {
  initialProductos: Producto[];
  initialClientes: Cliente[];
}

export interface PedidoGuardado {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  productos: DetalleFacturaInput[];
  total: number;
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta';
  fecha: string;
}

export default function BillingPOS({ initialProductos = [], initialClientes = [] }: BillingPOSProps) {
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>(initialClientes[0]?.id || '');
  const [formaPago, setFormaPago] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');

  // Filtro local de clientes
  const [clientSearch, setClientSearch] = useState('');

  // Búsqueda de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>(initialProductos);
  const [isSearching, setIsSearching] = useState(false);

  // Carrito de compras
  const [cart, setCart] = useState<DetalleFacturaInput[]>([]);
  const [efectivoRecibido, setEfectivoRecibido] = useState<number | ''>('');
  
  // Estado de emisión
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFacturaId, setLastFacturaId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pedidos Guardados en localStorage
  const [pedidosGuardados, setPedidosGuardados] = useState<PedidoGuardado[]>([]);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [pedidoActualId, setPedidoActualId] = useState<number | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('tumifact_pedidos');
      if (saved) {
        setPedidosGuardados(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando pedidos guardados:', e);
    }
  }, []);

  const syncPedidosStorage = (pedidos: PedidoGuardado[]) => {
    setPedidosGuardados(pedidos);
    localStorage.setItem('tumifact_pedidos', JSON.stringify(pedidos));
  };

  // Buscar productos dinámicamente
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(initialProductos.slice(0, 10));
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await apiFetch(`/api/productos/buscar?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Error buscando productos:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, initialProductos]);

  // Agregar producto al carrito
  const addToCart = (producto: Producto) => {
    const existingIndex = cart.findIndex((item) => item.producto_id === producto.id);
    const precioPredeterminado = Number(producto.precio_kg || producto.precio_unidad || 1000);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingIndex].cantidad += 1;
      updatedCart[existingIndex].subtotal = updatedCart[existingIndex].cantidad * updatedCart[existingIndex].precio;
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          producto_id: producto.id,
          cantidad: 1,
          precio: precioPredeterminado,
          unidad: 'KG',
          subtotal: precioPredeterminado
        }
      ]);
    }
  };

  // Actualizar cantidad de ítem
  const updateCantidad = (index: number, cantidad: number) => {
    if (cantidad <= 0) return;
    const updated = [...cart];
    updated[index].cantidad = cantidad;
    updated[index].subtotal = cantidad * updated[index].precio;
    setCart(updated);
  };

  // Actualizar precio de ítem
  const updatePrecio = (index: number, precio: number) => {
    if (precio < 0) return;
    const updated = [...cart];
    updated[index].precio = precio;
    updated[index].subtotal = updated[index].cantidad * precio;
    setCart(updated);
  };

  // Actualizar unidad de ítem (KG, LB, UND) y ajustar precio según tarifario
  const updateUnidad = (index: number, unidad: 'KG' | 'LB' | 'UND') => {
    const updated = [...cart];
    const item = updated[index];
    item.unidad = unidad;

    const prod = searchResults.find((p) => p.id === item.producto_id) || initialProductos.find((p) => p.id === item.producto_id);
    if (prod) {
      let nuevoPrecio = item.precio;
      if (unidad === 'KG' && prod.precio_kg) nuevoPrecio = Number(prod.precio_kg);
      else if (unidad === 'UND' && prod.precio_unidad) nuevoPrecio = Number(prod.precio_unidad);
      else if (unidad === 'LB' && prod.precio_libra) nuevoPrecio = Number(prod.precio_libra);
      
      item.precio = nuevoPrecio;
      item.subtotal = item.cantidad * nuevoPrecio;
    }

    setCart(updated);
  };

  // Eliminar ítem del carrito
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Guardar pedido pendiente en localStorage
  const handleGuardarPedido = () => {
    if (!selectedClienteId) {
      setStatusMessage({ type: 'error', text: 'Selecciona un cliente para guardar el pedido' });
      return;
    }
    if (cart.length === 0) {
      setStatusMessage({ type: 'error', text: 'Agrega al menos un producto antes de guardar' });
      return;
    }

    const clienteObj = clientes.find((c) => c.id === Number(selectedClienteId));
    const nuevoPedido: PedidoGuardado = {
      id: Date.now(),
      cliente_id: Number(selectedClienteId),
      cliente_nombre: clienteObj ? clienteObj.nombre : `Cliente #${selectedClienteId}`,
      productos: [...cart],
      total: totalFactura,
      forma_pago: formaPago,
      fecha: new Date().toLocaleString()
    };

    const nuevosPedidos = [nuevoPedido, ...pedidosGuardados];
    syncPedidosStorage(nuevosPedidos);

    setCart([]);
    setStatusMessage({ type: 'success', text: `Pedido de ${nuevoPedido.cliente_nombre} guardado en cola.` });
  };

  // Cargar pedido guardado
  const handleCargarPedido = (pedido: PedidoGuardado) => {
    setSelectedClienteId(pedido.cliente_id);
    setCart(pedido.productos);
    setFormaPago(pedido.forma_pago);
    setPedidoActualId(pedido.id);
    setShowPedidosModal(false);
    setStatusMessage({ type: 'success', text: `Pedido de ${pedido.cliente_nombre} cargado a la caja.` });
  };

  // Eliminar pedido guardado
  const handleEliminarPedidoGuardado = (id: number) => {
    const filtrados = pedidosGuardados.filter((p) => p.id !== id);
    syncPedidosStorage(filtrados);
  };

  // Cálculos totales
  const totalFactura = cart.reduce((sum, item) => sum + (item.subtotal || item.cantidad * item.precio), 0);
  const cambioEfectivo = typeof efectivoRecibido === 'number' ? Math.max(0, efectivoRecibido - totalFactura) : 0;

  // Emitir Factura
  const handleEmitirFactura = async () => {
    if (!selectedClienteId) {
      setStatusMessage({ type: 'error', text: 'Por favor selecciona un cliente para la factura' });
      return;
    }

    if (cart.length === 0) {
      setStatusMessage({ type: 'error', text: 'El carrito de ventas está vacío' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const payload = {
        cliente_id: Number(selectedClienteId),
        total: totalFactura,
        forma_pago: formaPago,
        productos: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: Number(item.cantidad),
          precio: Number(item.precio),
          unidad: item.unidad,
          subtotal: Number(item.cantidad * item.precio)
        }))
      };

      const res = await apiFetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.id) {
        setStatusMessage({ type: 'success', text: `¡Factura #${data.id} emitida con éxito!` });
        setLastFacturaId(data.id);
        setCart([]);
        setEfectivoRecibido('');
        
        if (pedidoActualId) {
          handleEliminarPedidoGuardado(pedidoActualId);
          setPedidoActualId(null);
        }
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al emitir la factura' });
      }
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: 'Error de comunicación con el servidor' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sección Izquierda: Catálogo y Búsqueda de Productos */}
      <div className="lg:col-span-7 space-y-6">
        {/* Selección de Cliente */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400" />
              Cliente de la Venta
            </label>
            <span className="text-xs text-slate-500">{clientes.length} Clientes disponibles</span>
          </div>

          <select
            value={selectedClienteId}
            onChange={(e) => setSelectedClienteId(e.target.value ? Number(e.target.value) : '')}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors font-medium"
          >
            <option value="">-- Seleccionar Cliente registrado --</option>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.telefono ? `(${c.telefono})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Buscador de Productos */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-2xl space-y-4 shadow-lg">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar producto por nombre o código (ej. Fresas, PAPA-001)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {isSearching && (
              <span className="absolute right-3.5 top-3 text-xs text-blue-400 font-semibold animate-pulse">
                Buscando...
              </span>
            )}
          </div>

          {/* Resultados de Búsqueda */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {searchResults.length === 0 ? (
              <div className="col-span-2 text-center py-8 text-slate-500 text-sm">
                No se encontraron productos coincidentes.
              </div>
            ) : (
              searchResults.map((prod) => (
                <div
                  key={prod.id}
                  onClick={() => addToCart(prod)}
                  className="p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 hover:bg-slate-800 hover:border-blue-500/50 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div>
                    <span className="text-xs font-mono text-blue-400 font-semibold">{prod.codigo}</span>
                    <h4 className="text-sm font-semibold text-white group-hover:text-blue-300 transition-colors">
                      {prod.nombre}
                    </h4>
                    <p className="text-xs text-emerald-400 font-bold mt-1">
                      ${Number(prod.precio_kg || prod.precio_unidad || 0).toLocaleString()} / {prod.precio_kg ? 'KG' : 'UND'}
                    </p>
                  </div>
                  <button className="h-8 w-8 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Sección Derecha: Carrito, Totales y Facturación */}
      <div className="lg:col-span-5 bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-6 shadow-2xl flex flex-col justify-between">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-400" />
              Detalle de Venta ({cart.length})
            </h3>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPedidosModal(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1 transition-colors"
                title="Ver pedidos guardados"
              >
                <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold">{pedidosGuardados.length}</span>
              </button>

              {cart.length > 0 && (
                <button
                  onClick={handleGuardarPedido}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 rounded-lg flex items-center gap-1 transition-colors"
                  title="Guardar pedido temporalmente"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Guardar
                </button>
              )}

              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors ml-1"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Mensaje de Estado */}
          {statusMessage && (
            <div className="space-y-2">
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${
                  statusMessage.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  {statusMessage.type === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  <span>{statusMessage.text}</span>
                </div>
              </div>

              {lastFacturaId && statusMessage.type === 'success' && (
                <a
                  href={`/facturas/${lastFacturaId}/imprimir`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2 px-3 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-300 hover:bg-blue-600 hover:text-white font-semibold text-xs transition-all flex items-center justify-center gap-2"
                >
                  <Printer className="h-3.5 w-3.5" />
                  🖨️ Abrir Tiquete Térmico #{lastFacturaId} para Impresión
                </a>
              )}
            </div>
          )}

          {/* Tabla de Carrito */}
          <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-sm">
                Selecciona productos del panel izquierdo para agregar a la venta.
              </div>
            ) : (
              cart.map((item, index) => {
                const prod = searchResults.find((p) => p.id === item.producto_id) || { nombre: `Producto #${item.producto_id}` };
                return (
                  <div key={index} className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs font-semibold text-white">
                      <span>{prod.nombre}</span>
                      <button
                        onClick={() => removeFromCart(index)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Cant.</span>
                        <input
                          type="number"
                          min="1"
                          value={item.cantidad}
                          onChange={(e) => updateCantidad(index, Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                        />
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Unidad</span>
                        <select
                          value={item.unidad}
                          onChange={(e) => updateUnidad(index, e.target.value as any)}
                          className="w-full px-1.5 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs"
                        >
                          <option value="KG">KG</option>
                          <option value="LB">LB</option>
                          <option value="UND">UND</option>
                        </select>
                      </div>

                      <div>
                        <span className="text-[10px] text-slate-400 uppercase">Precio ($)</span>
                        <input
                          type="number"
                          value={item.precio}
                          onChange={(e) => updatePrecio(index, Number(e.target.value))}
                          className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-semibold text-emerald-400"
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Totales & Pago */}
        <div className="space-y-4 pt-4 border-t border-slate-800">
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Forma de Pago:</span>
              <select
                value={formaPago}
                onChange={(e) => setFormaPago(e.target.value as any)}
                className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-semibold text-white"
              >
                <option value="efectivo">Efectivo</option>
                <option value="transferencia">Transferencia (Nequi/Daviplata)</option>
                <option value="tarjeta">Tarjeta Débito/Crédito</option>
              </select>
            </div>

            {formaPago === 'efectivo' && (
              <div className="flex items-center justify-between pt-1">
                <span className="text-slate-400">Efectivo Recibido:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={efectivoRecibido}
                  onChange={(e) => setEfectivoRecibido(e.target.value ? Number(e.target.value) : '')}
                  className="w-32 px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-right font-semibold text-white text-xs"
                />
              </div>
            )}

            {formaPago === 'efectivo' && typeof efectivoRecibido === 'number' && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Cambio / Devuelta:</span>
                <span className="font-bold text-cyan-400">${cambioEfectivo.toLocaleString()}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xl font-bold text-white pt-3 border-t border-slate-800">
              <span className="font-['Outfit']">TOTAL:</span>
              <span className="text-emerald-400 font-mono">${totalFactura.toLocaleString()}</span>
            </div>
          </div>

          <button
            onClick={handleEmitirFactura}
            disabled={isSubmitting || cart.length === 0}
            className={`w-full py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
              isSubmitting || cart.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/25 transform hover:-translate-y-0.5'
            }`}
          >
            <Printer className="h-4 w-4" />
            {isSubmitting ? 'Emitiendo Factura...' : 'Emitir e Imprimir Factura'}
          </button>
        </div>
      </div>

      {/* Modal de Pedidos Guardados */}
      {showPedidosModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Outfit']">
                <FolderOpen className="h-5 w-5 text-amber-400" />
                Pedidos Guardados en Lista ({pedidosGuardados.length})
              </h3>
              <button
                onClick={() => setShowPedidosModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {pedidosGuardados.length === 0 ? (
              <p className="text-center py-8 text-slate-500 text-sm">No hay pedidos temporales guardados.</p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {pedidosGuardados.map((ped) => (
                  <div key={ped.id} className="p-4 bg-slate-800/80 border border-slate-700 rounded-xl flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ped.cliente_nombre}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                          {ped.fecha}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {ped.productos.length} producto(s) · Total: <span className="text-emerald-400 font-bold">${ped.total.toLocaleString()}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCargarPedido(ped)}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs rounded-lg transition-colors"
                      >
                        Cargar a Caja
                      </button>
                      <button
                        onClick={() => handleEliminarPedidoGuardado(ped.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg transition-colors"
                        title="Eliminar pedido"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
