import React, { useState, useEffect, useRef, useMemo } from 'react';
import type { Producto, Cliente, DetalleFacturaInput } from '../../types';
import {
  ShoppingCart,
  User,
  Plus,
  Trash2,
  Printer,
  Search,
  CheckCircle2,
  AlertCircle,
  FolderOpen,
  BookmarkPlus,
  X,
  Percent,
  Tag,
  CreditCard,
  Banknote,
  Smartphone,
  ArrowRight,
  Sparkles,
  Calendar,
  Layers,
  Barcode
} from 'lucide-react';
import { apiFetch } from '../../lib/apiClient';
import { enqueueFactura } from '../../lib/offline-queue';
import { formatNumber, formatDate } from '../../lib/format';

interface POSTerminalProps {
  initialProductos?: Producto[];
  initialClientes?: Cliente[];
  user?: {
    id?: number;
    nombre?: string;
    apellido?: string;
    email?: string;
    rol_nombre?: string;
  };
}

export interface PedidoGuardado {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  productos: ExtendedCartItem[];
  total: number;
  forma_pago: 'efectivo' | 'transferencia' | 'tarjeta';
  descuento_global_porcentaje: number;
  fecha: string;
}

export interface ExtendedCartItem extends DetalleFacturaInput {
  producto_codigo?: string;
  descuento_porcentaje?: number;
  es_mayorista?: boolean;
}

export default function POSTerminal({
  initialProductos = [],
  initialClientes = [],
  user
}: POSTerminalProps) {
  // Clientes
  const [clientes, setClientes] = useState<Cliente[]>(initialClientes);
  const [selectedClienteId, setSelectedClienteId] = useState<number | ''>(
    initialClientes[0]?.id || ''
  );
  const [clientFilter, setClientFilter] = useState('');

  // Búsqueda y catálogo de productos
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Producto[]>(initialProductos);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategoria, setSelectedCategoria] = useState<string>('todas');

  // Carrito de compras
  const [cart, setCart] = useState<ExtendedCartItem[]>([]);
  const [formaPago, setFormaPago] = useState<'efectivo' | 'transferencia' | 'tarjeta'>('efectivo');
  const [descuentoGlobal, setDescuentoGlobal] = useState<number>(0);
  const [efectivoRecibido, setEfectivoRecibido] = useState<number | ''>('');
  const [observaciones, setObservaciones] = useState('');

  // Modal de Separado directo desde POS
  const [showSeparadoModal, setShowSeparadoModal] = useState(false);
  const [abonoInicialSeparado, setAbonoInicialSeparado] = useState<number | ''>('');
  const [diasPlazoSeparado, setDiasPlazoSeparado] = useState<number>(30);
  const [isSubmittingSeparado, setIsSubmittingSeparado] = useState(false);

  // Estados de emisión
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastFacturaId, setLastFacturaId] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Pedidos Guardados (Borradores)
  const [pedidosGuardados, setPedidosGuardados] = useState<PedidoGuardado[]>([]);
  const [showPedidosModal, setShowPedidosModal] = useState(false);
  const [pedidoActualId, setPedidoActualId] = useState<number | null>(null);

  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Estado de Caja Activa y Modal de Apertura Rápida
  const [cajaActiva, setCajaActiva] = useState<{ id: number; estado: string; monto_apertura: string | number } | null>(null);
  const [showAbrirCajaModal, setShowAbrirCajaModal] = useState(false);
  const [montoAperturaInput, setMontoAperturaInput] = useState<number | ''>('');
  const [isOpeningCaja, setIsOpeningCaja] = useState(false);

  // Modal de Tiquete Térmico Post-Venta
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketData, setTicketData] = useState<{
    factura: any;
    detalles: any[];
    config: any;
  } | null>(null);
  const [isLoadingTicket, setIsLoadingTicket] = useState(false);

  const fetchCajaEstado = async () => {
    try {
      const res = await apiFetch('/api/caja/estado');
      if (res.ok) {
        const data = await res.json();
        if (data.abierta && data.sesion) {
          setCajaActiva(data.sesion);
        } else {
          setCajaActiva(null);
        }
      }
    } catch (err) {
      console.error('Error consultando estado de caja en POS:', err);
    }
  };

  // Cargar borradores y verificar estado de caja al iniciar
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tumifact_pedidos_v2') || localStorage.getItem('tumifact_pedidos');
      if (saved) {
        setPedidosGuardados(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error cargando pedidos guardados:', e);
    }

    fetchCajaEstado();
  }, []);

  const handleAbrirCajaRapida = async () => {
    const monto = typeof montoAperturaInput === 'number' ? montoAperturaInput : 0;
    if (monto < 0) {
      setStatusMessage({ type: 'error', text: 'El monto de apertura no puede ser negativo' });
      return;
    }

    setIsOpeningCaja(true);
    try {
      const res = await apiFetch('/api/caja/abrir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto_apertura: monto,
          notas: 'Apertura rápida desde Terminal POS'
        })
      });

      const data = await res.json();
      if (res.ok && data.sesion) {
        setCajaActiva(data.sesion);
        setShowAbrirCajaModal(false);
        setMontoAperturaInput('');
        setStatusMessage({ type: 'success', text: `¡Caja abierta exitosamente con base de $${formatNumber(monto)}!` });
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al abrir caja' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de conexión al abrir caja' });
    } finally {
      setIsOpeningCaja(false);
    }
  };

  // Cargar datos de factura para tiquete térmico
  const handleVerImprimirTicket = async (facturaId: number) => {
    setIsLoadingTicket(true);
    setShowTicketModal(true);
    try {
      const res = await apiFetch(`/api/facturas/${facturaId}/imprimir`);
      if (res.ok) {
        const data = await res.json();
        setTicketData(data);
      } else {
        setStatusMessage({ type: 'error', text: 'No se pudo cargar el tiquete para impresión' });
        setShowTicketModal(false);
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de red al obtener tiquete' });
      setShowTicketModal(false);
    } finally {
      setIsLoadingTicket(false);
    }
  };

  const syncPedidosStorage = (pedidos: PedidoGuardado[]) => {
    setPedidosGuardados(pedidos);
    localStorage.setItem('tumifact_pedidos_v2', JSON.stringify(pedidos));
  };

  // Filtrar clientes en el select
  const filteredClientes = useMemo(() => {
    if (!clientFilter.trim()) return clientes;
    const term = clientFilter.toLowerCase();
    return clientes.filter(
      (c) =>
        c.nombre?.toLowerCase().includes(term) ||
        c.apellido?.toLowerCase().includes(term) ||
        c.numero_identificacion?.includes(term) ||
        c.telefono?.includes(term)
    );
  }, [clientes, clientFilter]);

  // Búsqueda debounce de productos
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(initialProductos);
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
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, initialProductos]);

  // Categorías disponibles
  const categorias = useMemo(() => {
    const set = new Set<string>();
    initialProductos.forEach((p) => {
      if (p.categoria_nombre) set.add(p.categoria_nombre);
      else if (p.categoria_tipo) set.add(p.categoria_tipo);
    });
    return Array.from(set);
  }, [initialProductos]);

  // Productos mostrados en la grilla filtrados por categoría
  const displayedProducts = useMemo(() => {
    if (selectedCategoria === 'todas') return searchResults;
    return searchResults.filter(
      (p) => p.categoria_nombre === selectedCategoria || p.categoria_tipo === selectedCategoria
    );
  }, [searchResults, selectedCategoria]);

  // Función para determinar la unidad de medida predeterminada según categoría
  const getDefaultUnidadForProduct = (producto: any): 'UND' | 'KG' | 'LB' | 'PAR' | 'MTS' => {
    const catTipo = (producto.categoria_tipo || '').toLowerCase();
    const catNombre = (producto.categoria_nombre || '').toLowerCase();

    if (catTipo === 'calzado' || catNombre.includes('calzado') || catNombre.includes('zapato')) {
      return 'PAR';
    }
    if (catTipo === 'perecedero' || catNombre.includes('perecedero') || catNombre.includes('fruta') || catNombre.includes('verdura')) {
      if (producto.precio_kg && Number(producto.precio_kg) > 0) return 'KG';
      if (producto.precio_libra && Number(producto.precio_libra) > 0) return 'LB';
      return 'UND';
    }
    // Para Prendas, Tecnología, Bisutería, Artesanías y Genérico:
    return 'UND';
  };

  // Agregar producto al carrito
  const addToCart = (producto: any, forceMayorista: boolean = false) => {
    const existingIndex = cart.findIndex((item) => item.producto_id === producto.id);

    // Determinación de precio base y unidad inteligente
    const pDetal = Number(producto.precio_detal || producto.precio_unidad || producto.precio_kg || 1000);
    const unidad = getDefaultUnidadForProduct(producto);

    let precioBase = pDetal;
    if (unidad === 'KG' && producto.precio_kg) precioBase = Number(producto.precio_kg);
    else if (unidad === 'LB' && producto.precio_libra) precioBase = Number(producto.precio_libra);
    else if (unidad === 'UND' && producto.precio_unidad) precioBase = Number(producto.precio_unidad);

    if (forceMayorista && producto.precio_mayorista) {
      precioBase = Number(producto.precio_mayorista);
    }

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const currentItem = updatedCart[existingIndex];
      const newQty = currentItem.cantidad + 1;

      // Auto-aplicar precio mayorista si supera cantidad mínima
      let currentPrecio = currentItem.precio;
      let esMayorista = currentItem.es_mayorista || forceMayorista;
      if (producto.precio_mayorista && producto.cantidad_mayorista && newQty >= producto.cantidad_mayorista) {
        currentPrecio = Number(producto.precio_mayorista);
        esMayorista = true;
      }

      const descPorc = currentItem.descuento_porcentaje || 0;
      const subtotalSinDesc = newQty * currentPrecio;
      const descMonto = (subtotalSinDesc * descPorc) / 100;

      updatedCart[existingIndex] = {
        ...currentItem,
        cantidad: newQty,
        precio: currentPrecio,
        es_mayorista: esMayorista,
        descuento_aplicado: descMonto,
        subtotal: Math.max(0, subtotalSinDesc - descMonto)
      };
      setCart(updatedCart);
    } else {
      setCart([
        ...cart,
        {
          producto_id: producto.id,
          producto_nombre: producto.nombre,
          producto_codigo: producto.codigo,
          cantidad: 1,
          precio: precioBase,
          precio_original: precioBase,
          unidad,
          descuento_porcentaje: 0,
          descuento_aplicado: 0,
          es_mayorista: forceMayorista,
          subtotal: precioBase
        }
      ]);
    }
  };

  // Modificar cantidad
  const updateCantidad = (index: number, cantidad: number) => {
    if (cantidad <= 0) return;
    const updated = [...cart];
    const item = updated[index];
    const prod = searchResults.find((p) => p.id === item.producto_id) || initialProductos.find((p) => p.id === item.producto_id);

    let precioActual = item.precio;
    let esMayorista = item.es_mayorista;
    if (prod && prod.precio_mayorista && prod.cantidad_mayorista) {
      if (cantidad >= prod.cantidad_mayorista) {
        precioActual = Number(prod.precio_mayorista);
        esMayorista = true;
      } else if (!item.es_mayorista) {
        // Regresar a precio detal
        if (item.unidad === 'KG' && prod.precio_kg) precioActual = Number(prod.precio_kg);
        else if (item.unidad === 'LB' && prod.precio_libra) precioActual = Number(prod.precio_libra);
        else if (item.unidad === 'UND' && prod.precio_unidad) precioActual = Number(prod.precio_unidad);
        else precioActual = Number(prod.precio_detal || item.precio_original || 1000);
      }
    }

    const descPorc = item.descuento_porcentaje || 0;
    const subtotalSinDesc = cantidad * precioActual;
    const descMonto = (subtotalSinDesc * descPorc) / 100;

    updated[index] = {
      ...item,
      cantidad,
      precio: precioActual,
      es_mayorista: esMayorista,
      descuento_aplicado: descMonto,
      subtotal: Math.max(0, subtotalSinDesc - descMonto)
    };
    setCart(updated);
  };

  // Modificar precio unitario directo
  const updatePrecio = (index: number, precio: number) => {
    if (precio < 0) return;
    const updated = [...cart];
    const item = updated[index];
    const descPorc = item.descuento_porcentaje || 0;
    const subtotalSinDesc = item.cantidad * precio;
    const descMonto = (subtotalSinDesc * descPorc) / 100;

    updated[index] = {
      ...item,
      precio,
      descuento_aplicado: descMonto,
      subtotal: Math.max(0, subtotalSinDesc - descMonto)
    };
    setCart(updated);
  };

  // Modificar descuento inline por ítem (porcentaje 0-100)
  const updateDescuentoPorcentaje = (index: number, descuentoPorc: number) => {
    const val = Math.max(0, Math.min(100, descuentoPorc));
    const updated = [...cart];
    const item = updated[index];
    const subtotalSinDesc = item.cantidad * item.precio;
    const descMonto = (subtotalSinDesc * val) / 100;

    updated[index] = {
      ...item,
      descuento_porcentaje: val,
      descuento_inline_tipo: 'porcentaje',
      descuento_inline_valor: val,
      descuento_aplicado: descMonto,
      subtotal: Math.max(0, subtotalSinDesc - descMonto)
    };
    setCart(updated);
  };

  // Modificar unidad de medida y recalcular precio
  const updateUnidad = (index: number, unidad: 'KG' | 'LB' | 'UND') => {
    const updated = [...cart];
    const item = updated[index];
    item.unidad = unidad;

    const prod =
      searchResults.find((p) => p.id === item.producto_id) ||
      initialProductos.find((p) => p.id === item.producto_id);

    if (prod) {
      let nuevoPrecio = item.precio;
      if (unidad === 'KG' && prod.precio_kg) nuevoPrecio = Number(prod.precio_kg);
      else if (unidad === 'UND' && prod.precio_unidad) nuevoPrecio = Number(prod.precio_unidad);
      else if (unidad === 'LB' && prod.precio_libra) nuevoPrecio = Number(prod.precio_libra);

      item.precio = nuevoPrecio;
      item.precio_original = nuevoPrecio;
      const descPorc = item.descuento_porcentaje || 0;
      const subtotalSinDesc = item.cantidad * nuevoPrecio;
      const descMonto = (subtotalSinDesc * descPorc) / 100;
      item.descuento_aplicado = descMonto;
      item.subtotal = Math.max(0, subtotalSinDesc - descMonto);
    }

    setCart(updated);
  };

  // Toggle Mayorista / Detal por ítem
  const toggleItemMayorista = (index: number) => {
    const updated = [...cart];
    const item = updated[index];
    const prod =
      searchResults.find((p) => p.id === item.producto_id) ||
      initialProductos.find((p) => p.id === item.producto_id);

    if (!prod || !prod.precio_mayorista) return;

    const willBeMayorista = !item.es_mayorista;
    let nuevoPrecio = willBeMayorista
      ? Number(prod.precio_mayorista)
      : Number(prod.precio_kg || prod.precio_unidad || prod.precio_detal || item.precio_original);

    const descPorc = item.descuento_porcentaje || 0;
    const subtotalSinDesc = item.cantidad * nuevoPrecio;
    const descMonto = (subtotalSinDesc * descPorc) / 100;

    updated[index] = {
      ...item,
      es_mayorista: willBeMayorista,
      precio: nuevoPrecio,
      descuento_aplicado: descMonto,
      subtotal: Math.max(0, subtotalSinDesc - descMonto)
    };
    setCart(updated);
  };

  // Eliminar ítem
  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  // Cálculos de Totales Financieros
  const subtotalBruto = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.cantidad * item.precio, 0);
  }, [cart]);

  const totalDescuentosItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.descuento_aplicado || 0), 0);
  }, [cart]);

  const subtotalNeto = Math.max(0, subtotalBruto - totalDescuentosItems);

  const montoDescuentoGlobal = useMemo(() => {
    if (descuentoGlobal <= 0) return 0;
    return (subtotalNeto * Math.min(100, descuentoGlobal)) / 100;
  }, [subtotalNeto, descuentoGlobal]);

  const totalFactura = Math.max(0, Math.round(subtotalNeto - montoDescuentoGlobal));
  const cambioEfectivo =
    typeof efectivoRecibido === 'number' ? Math.max(0, efectivoRecibido - totalFactura) : 0;

  // Guardar pedido borrador
  const handleGuardarPedido = () => {
    if (!selectedClienteId) {
      setStatusMessage({ type: 'error', text: 'Selecciona un cliente para guardar el pedido en lista' });
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
      cliente_nombre: clienteObj
        ? `${clienteObj.nombre} ${clienteObj.apellido || ''}`.trim()
        : `Cliente #${selectedClienteId}`,
      productos: [...cart],
      total: totalFactura,
      forma_pago: formaPago,
      descuento_global_porcentaje: descuentoGlobal,
      fecha: formatDate(new Date())
    };

    const nuevosPedidos = [nuevoPedido, ...pedidosGuardados];
    syncPedidosStorage(nuevosPedidos);

    setCart([]);
    setStatusMessage({ type: 'success', text: `Pedido de ${nuevoPedido.cliente_nombre} guardado en lista.` });
  };

  // Cargar pedido borrador
  const handleCargarPedido = (pedido: PedidoGuardado) => {
    setSelectedClienteId(pedido.cliente_id);
    setCart(pedido.productos);
    setFormaPago(pedido.forma_pago);
    setDescuentoGlobal(pedido.descuento_global_porcentaje || 0);
    setPedidoActualId(pedido.id);
    setShowPedidosModal(false);
    setStatusMessage({ type: 'success', text: `Pedido de ${pedido.cliente_nombre} cargado al POS.` });
  };

  // Eliminar pedido borrador
  const handleEliminarPedidoGuardado = (id: number) => {
    const filtrados = pedidosGuardados.filter((p) => p.id !== id);
    syncPedidosStorage(filtrados);
  };

  // Emitir Factura POS con Idempotencia
  const handleEmitirFactura = async () => {
    if (!cajaActiva) {
      setStatusMessage({
        type: 'error',
        text: 'Caja cerrada. Debe abrir un turno de caja antes de realizar ventas.'
      });
      setShowAbrirCajaModal(true);
      return;
    }

    if (!selectedClienteId) {
      setStatusMessage({ type: 'error', text: 'Seleccione o registre un cliente para la venta' });
      return;
    }

    if (cart.length === 0) {
      setStatusMessage({ type: 'error', text: 'El carrito del terminal POS está vacío' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    // Clave de Idempotencia única para evitar dobles facturas
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `pos-${Date.now()}`;
    let payload: any = null;

    try {
      payload = {
        idempotency_key: idempotencyKey,
        cliente_id: Number(selectedClienteId),
        sesion_caja_id: cajaActiva.id,
        total: totalFactura,
        subtotal: subtotalBruto,
        descuento_total: totalDescuentosItems + montoDescuentoGlobal,
        forma_pago: formaPago,
        observaciones: observaciones.trim() || undefined,
        productos: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: Number(item.cantidad),
          precio: Number(item.precio),
          unidad: item.unidad,
          descuento_inline_tipo: item.descuento_porcentaje ? 'porcentaje' : null,
          descuento_inline_valor: item.descuento_porcentaje || 0,
          descuento_aplicado: item.descuento_aplicado || 0,
          subtotal: Number(item.subtotal)
        }))
      };

      const res = await apiFetch('/api/facturas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.id) {
        setStatusMessage({
          type: 'success',
          text: `¡Venta procesada con éxito! Factura POS #${data.id} generada.`
        });
        setLastFacturaId(data.id);
        setCart([]);
        setEfectivoRecibido('');
        setDescuentoGlobal(0);
        setObservaciones('');

        if (pedidoActualId) {
          handleEliminarPedidoGuardado(pedidoActualId);
          setPedidoActualId(null);
        }

        // Mostrar tiquete térmico inmediatamente
        handleVerImprimirTicket(data.id);
      } else {
        // Si es error 4xx de validación, mostrar mensaje; no encolar
        setStatusMessage({ type: 'error', text: data.error || `Error ${res.status} al procesar la factura` });
      }
    } catch (err: any) {
      // Fase 4.2: Offline queue — si falla red (offline) o 5xx, encolar para replay
      const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
      const isNetworkError = err?.message?.includes('Failed to fetch') || err?.name === 'TypeError' || isOffline;

      if (isNetworkError) {
        try {
          const offlineHeaders: Record<string, string> = { 'Idempotency-Key': idempotencyKey };
          // Reenviar Authorization si existe en apiClient
          const offlineId = await enqueueFactura(payload, offlineHeaders);
          setStatusMessage({
            type: 'success',
            text: `📴 Sin conexión — Factura encolada offline (#${offlineId.slice(0, 8)}). Se sincronizará al reconectar.`
          });
          // Limpiar carrito igual — la venta está "prometida" offline
          setCart([]);
          setEfectivoRecibido('');
          setDescuentoGlobal(0);
          setObservaciones('');
        } catch (queueErr) {
          setStatusMessage({ type: 'error', text: 'Sin conexión y fallo al encolar offline. Reintente.' });
        }
      } else {
        setStatusMessage({ type: 'error', text: 'Error de comunicación con el servidor' });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Convertir carrito a Separado (Layaway)
  const handleCrearSeparado = async () => {
    if (!selectedClienteId) {
      setStatusMessage({ type: 'error', text: 'Seleccione un cliente para registrar el plan de separado' });
      return;
    }
    if (cart.length === 0) {
      setStatusMessage({ type: 'error', text: 'El carrito no tiene productos para separar' });
      return;
    }
    const abono = typeof abonoInicialSeparado === 'number' ? abonoInicialSeparado : 0;
    if (abono <= 0) {
      setStatusMessage({ type: 'error', text: 'Debe ingresar un abono inicial mayor a $0' });
      return;
    }
    if (abono > totalFactura) {
      setStatusMessage({ type: 'error', text: 'El abono inicial no puede superar el total del separado' });
      return;
    }

    setIsSubmittingSeparado(true);
    const idempotencyKey = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `sep-${Date.now()}`;

    try {
      const payload = {
        idempotency_key: idempotencyKey,
        cliente_id: Number(selectedClienteId),
        sesion_caja_id: cajaActiva?.id || undefined,
        descripcion: `Separado POS: ${cart.map((c) => `${c.cantidad}x ${c.producto_nombre || 'Item'}`).join(', ')}`,
        valor_total: totalFactura,
        abono_inicial: abono,
        forma_pago_abono: formaPago,
        dias_plazo: diasPlazoSeparado,
        observaciones: observaciones.trim() || undefined,
        productos: cart.map((item) => ({
          producto_id: item.producto_id,
          cantidad: Number(item.cantidad),
          precio: Number(item.precio),
          unidad: item.unidad,
          descuento_aplicado: item.descuento_aplicado || 0,
          subtotal: Number(item.subtotal)
        }))
      };

      const res = await apiFetch('/api/separados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok && data.id) {
        setStatusMessage({
          type: 'success',
          text: `¡Plan de Separado #${data.id} creado con éxito! Abono registrado: $${formatNumber(abono)}.`
        });
        setCart([]);
        setShowSeparadoModal(false);
        setAbonoInicialSeparado('');
      } else {
        setStatusMessage({ type: 'error', text: data.error || 'Error al registrar el plan de separado' });
      }
    } catch (err) {
      setStatusMessage({ type: 'error', text: 'Error de red al crear el separado' });
    } finally {
      setIsSubmittingSeparado(false);
    }
  };

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 items-start w-full">
      {/* Banner de Estado de Caja */}
      <div className="w-full lg:col-span-12">
        {!cajaActiva ? (
          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3 text-rose-300 min-w-0">
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-rose-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 text-rose-400" />
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs sm:text-sm text-white font-['Outfit'] truncate">Turno de Caja Cerrado</h4>
                <p className="text-[11px] sm:text-xs text-rose-300/80 line-clamp-2 sm:line-clamp-1">
                  Se requiere abrir turno de caja con base inicial para realizar ventas.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowAbrirCajaModal(true)}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer shrink-0 text-center"
            >
              💰 Abrir Caja
            </button>
          </div>
        ) : (
          <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-300 backdrop-blur-md">
            <div className="flex items-center gap-2 min-w-0">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <span className="font-semibold text-emerald-200 truncate">
                Caja Abierta #{cajaActiva.id}
              </span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-300 font-mono text-[11px]">
                Base: ${formatNumber(Number(cajaActiva.monto_apertura || 0))}
              </span>
            </div>
            <a
              href="/caja"
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 shrink-0"
            >
              Administrar →
            </a>
          </div>
        )}
      </div>

      {/* ========================================================== */}
      {/* PANEL IZQUIERDO: CATÁLOGO, CLIENTE & BÚSQUEDA RÁPIDA      */}
      {/* ========================================================== */}
      <div className="w-full lg:col-span-7 space-y-5 min-w-0">

        {/* Selección de Cliente con Búsqueda Integrada */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-3 shadow-xl backdrop-blur-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <User className="h-4 w-4 text-blue-400 shrink-0" />
              Cliente Facturación
            </label>
            <span className="text-[11px] text-slate-500 font-mono">
              {filteredClientes.length} clientes disponibles
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-4">
              <input
                type="text"
                placeholder="Filtrar por CC o Nombre..."
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 bg-slate-800/90 border border-slate-700/80 rounded-xl text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="sm:col-span-8">
              <select
                value={selectedClienteId}
                onChange={(e) => setSelectedClienteId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-white text-xs font-semibold focus:outline-none focus:border-blue-500 transition-colors truncate"
              >
                <option value="">-- Seleccionar Cliente Registrado --</option>
                {filteredClientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} {c.apellido || ''} {c.numero_identificacion ? `(Doc: ${c.numero_identificacion})` : ''} {c.telefono ? `· ${c.telefono}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros de Categoría */}
        <div className="bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4 shadow-xl backdrop-blur-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <input
              ref={barcodeInputRef}
              type="text"
              placeholder="Buscar por nombre, código o código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/90 border border-slate-700 text-white text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            {isSearching && (
              <span className="absolute right-3.5 top-3 text-xs text-blue-400 font-semibold animate-pulse">
                Buscando...
              </span>
            )}
          </div>

          {/* Selector de Categorías Pills */}
          {categorias.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs no-scrollbar">
              <button
                type="button"
                onClick={() => setSelectedCategoria('todas')}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${selectedCategoria === 'todas'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
              >
                Todas las categorías
              </button>
              {categorias.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoria(cat)}
                  className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all shrink-0 cursor-pointer ${selectedCategoria === cat
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Grilla de Productos */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[460px] overflow-y-auto pr-1">
            {displayedProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-slate-500 text-sm">
                No se encontraron productos coincidentes en el inventario.
              </div>
            ) : (
              displayedProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 hover:bg-slate-800 hover:border-blue-500/50 transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => addToCart(prod, false)}
                >
                  <div>
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-[10px] font-mono text-blue-400 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                        {prod.codigo}
                      </span>
                      {typeof prod.stock_actual === 'number' && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${prod.stock_actual <= (prod.stock_minimo || 5)
                            ? 'bg-rose-500/20 text-rose-300'
                            : 'bg-slate-700 text-slate-300'
                            }`}
                        >
                          Stock: {prod.stock_actual}
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
                      {prod.nombre}
                    </h4>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-emerald-400 font-extrabold font-mono">
                        ${formatNumber(prod.precio_kg || prod.precio_unidad || prod.precio_detal || 0)}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {' '}/ {prod.precio_kg ? 'KG' : prod.precio_libra ? 'LB' : 'UND'}
                        </span>
                      </p>
                      {prod.precio_mayorista && (
                        <p className="text-[10px] text-amber-400">
                          Mayorista: ${formatNumber(prod.precio_mayorista)} (≥{prod.cantidad_mayorista || 6})
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      className="h-7 w-7 rounded-lg bg-blue-600/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all shrink-0"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* PANEL DERECHO: CARRITO, DESCUENTOS, TOTALES & ACCIONES   */}
      {/* ========================================================== */}
      <div className="w-full lg:col-span-5 bg-slate-900/95 border border-slate-800 p-4 sm:p-6 rounded-2xl space-y-5 shadow-2xl backdrop-blur-xl flex flex-col justify-between min-w-0">
        <div className="space-y-4">

          {/* Header Carrito */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white font-['Outfit'] flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-400" />
              Terminal de Venta ({cart.length})
            </h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowPedidosModal(true)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                title="Ver lista de pedidos en cola"
              >
                <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
                <span className="font-semibold">{pedidosGuardados.length}</span>
              </button>

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={handleGuardarPedido}
                  className="px-2.5 py-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-xs text-amber-300 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                  title="Guardar temporalmente para atender a otro cliente"
                >
                  <BookmarkPlus className="h-3.5 w-3.5" />
                  Guardar
                </button>
              )}

              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={() => setCart([])}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors ml-1 cursor-pointer"
                >
                  Vaciar
                </button>
              )}
            </div>
          </div>

          {/* Mensajes de Alerta / Éxito */}
          {statusMessage && (
            <div className="space-y-2">
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between gap-2 border ${statusMessage.type === 'success'
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
                <button
                  type="button"
                  onClick={() => handleVerImprimirTicket(lastFacturaId)}
                  className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  Ver / Imprimir Tiquete Térmico #{lastFacturaId}
                </button>
              )}
            </div>
          )}

          {/* Lista de Ítems en Carrito */}
          <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="text-center py-14 text-slate-500 text-sm space-y-2">
                <ShoppingCart className="h-8 w-8 mx-auto text-slate-600 opacity-50" />
                <p>El terminal está listo. Añada productos desde el catálogo.</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div
                  key={index}
                  className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl space-y-2.5 hover:border-slate-600 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-semibold text-white">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-blue-400 font-bold">
                        {item.producto_codigo}
                      </span>
                      <span className="truncate max-w-[180px]">{item.producto_nombre}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleItemMayorista(index)}
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold transition-all cursor-pointer ${item.es_mayorista
                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                          : 'bg-slate-700 text-slate-400 hover:text-white'
                          }`}
                        title="Alternar precio mayorista"
                      >
                        {item.es_mayorista ? 'MAYOR' : 'DETAL'}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromCart(index)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Controles de Cantidad, Unidad, Precio y Descuento */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Cant.</span>
                      <input
                        type="number"
                        min="1"
                        step="any"
                        value={item.cantidad}
                        onChange={(e) => updateCantidad(index, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Unidad</span>
                      <select
                        value={item.unidad}
                        onChange={(e) => updateUnidad(index, e.target.value as any)}
                        className="w-full px-1 py-1 bg-slate-900 border border-slate-700 rounded text-white text-xs font-medium focus:outline-none focus:border-blue-500"
                      >
                        <option value="UND">UND</option>
                        <option value="PAR">PAR</option>
                        <option value="KG">KG</option>
                        <option value="LB">LB</option>
                        <option value="MTS">MTS</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block mb-0.5">Precio ($)</span>
                      <input
                        type="number"
                        min="0"
                        value={item.precio}
                        onChange={(e) => updatePrecio(index, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-emerald-400 text-xs font-semibold focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block mb-0.5 flex items-center justify-between">
                        <span>Desc%</span>
                        {item.descuento_porcentaje ? (
                          <span className="text-amber-400 font-bold">{item.descuento_porcentaje}%</span>
                        ) : null}
                      </span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="0"
                        value={item.descuento_porcentaje || ''}
                        onChange={(e) => updateDescuentoPorcentaje(index, Number(e.target.value))}
                        className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-300 text-xs font-semibold text-center focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Resumen del Ítem */}
                  <div className="flex items-center justify-between text-[11px] pt-1 text-slate-400 border-t border-slate-700/40">
                    <span>
                      {item.descuento_aplicado && item.descuento_aplicado > 0 ? (
                        <span className="text-amber-400">
                          - ${formatNumber(item.descuento_aplicado)} desc.
                        </span>
                      ) : (
                        'Precio regular'
                      )}
                    </span>
                    <span className="font-extrabold text-white font-mono text-xs">
                      ${formatNumber(item.subtotal || 0)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ========================================================== */}
        {/* LIQUIDACIÓN DE TOTALES, DESCUENTOS Y MEDIOS DE PAGO       */}
        {/* ========================================================== */}
        <div className="space-y-4 pt-4 border-t border-slate-800">

          {/* Descuento Global */}
          <div className="flex items-center justify-between gap-3 bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
              <Percent className="h-3.5 w-3.5 text-amber-400" />
              Descuento General Ticket:
            </span>
            <div className="flex items-center gap-1 w-28">
              <input
                type="number"
                min="0"
                max="100"
                placeholder="0"
                value={descuentoGlobal || ''}
                onChange={(e) => setDescuentoGlobal(Number(e.target.value))}
                className="w-full px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-right font-bold text-amber-300"
              />
              <span className="text-xs text-slate-400 font-bold">%</span>
            </div>
          </div>

          {/* Formas de Pago */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
              Forma de Pago
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormaPago('efectivo')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${formaPago === 'efectivo'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                <Banknote className="h-4 w-4" />
                Efectivo
              </button>

              <button
                type="button"
                onClick={() => setFormaPago('transferencia')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${formaPago === 'transferencia'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                <Smartphone className="h-4 w-4" />
                Transferencia
              </button>

              <button
                type="button"
                onClick={() => setFormaPago('tarjeta')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${formaPago === 'tarjeta'
                  ? 'bg-purple-600/20 border-purple-500 text-purple-300 shadow-md shadow-purple-500/10'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                  }`}
              >
                <CreditCard className="h-4 w-4" />
                Tarjeta
              </button>
            </div>
          </div>

          {/* Campo Efectivo Recibido y Cambio */}
          {formaPago === 'efectivo' && (
            <div className="p-3 bg-slate-800/50 rounded-xl border border-slate-700/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-300 font-medium">Efectivo Recibido:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={efectivoRecibido}
                  onChange={(e) => setEfectivoRecibido(e.target.value ? Number(e.target.value) : '')}
                  className="w-36 px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-right font-bold text-white text-sm focus:border-emerald-500"
                />
              </div>

              {typeof efectivoRecibido === 'number' && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/40">
                  <span className="text-slate-400">Cambio / Devuelta:</span>
                  <span className="font-extrabold text-cyan-400 font-mono text-sm">
                    ${formatNumber(cambioEfectivo)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Desglose de Totales */}
          <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
            <div className="flex justify-between">
              <span>Subtotal Bruto:</span>
              <span className="font-mono text-slate-200">${formatNumber(subtotalBruto)}</span>
            </div>
            {totalDescuentosItems > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Descuento en Líneas:</span>
                <span className="font-mono">- ${formatNumber(totalDescuentosItems)}</span>
              </div>
            )}
            {montoDescuentoGlobal > 0 && (
              <div className="flex justify-between text-amber-400">
                <span>Descuento General ({descuentoGlobal}%):</span>
                <span className="font-mono">- ${formatNumber(montoDescuentoGlobal)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-2xl font-extrabold text-white pt-2 border-t border-slate-800">
              <span className="font-['Outfit'] tracking-tight">TOTAL:</span>
              <span className="text-emerald-400 font-mono tracking-tight">${formatNumber(totalFactura)}</span>
            </div>
          </div>

          {/* Botones de Acción Primaria */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowSeparadoModal(true)}
              disabled={cart.length === 0}
              className="py-3 px-3 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 hover:border-amber-500/60 transition-all flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-amber-400" />
              Convertir a Separado
            </button>

            <button
              type="button"
              onClick={handleEmitirFactura}
              disabled={isSubmitting || cart.length === 0}
              className={`py-3 px-4 rounded-xl font-bold text-xs shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${isSubmitting || cart.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-emerald-500/25 transform hover:-translate-y-0.5'
                }`}
            >
              <Printer className="h-4 w-4" />
              {isSubmitting ? 'Emitiendo Factura...' : 'Emitir Factura POS'}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================== */}
      {/* MODAL DE CONVERTIR A SEPARADO (LAYAWAY)                    */}
      {/* ========================================================== */}
      {showSeparadoModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Outfit']">
                <Calendar className="h-5 w-5 text-amber-400" />
                Registrar Plan de Separado
              </h3>
              <button
                type="button"
                onClick={() => setShowSeparadoModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 space-y-1">
                <p className="font-bold">Total del Plan de Apartado: ${formatNumber(totalFactura)}</p>
                <p className="text-[11px] text-amber-400/80">
                  Los productos quedarán reservados en bodega hasta completar el 100% de los abonos.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Monto del Abono Inicial ($ COP) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={totalFactura}
                  placeholder={`Ej: ${Math.round(totalFactura * 0.3)} (Sugerido 30%)`}
                  value={abonoInicialSeparado}
                  onChange={(e) => setAbonoInicialSeparado(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Plazo de Vigencia (Días) *
                </label>
                <select
                  value={diasPlazoSeparado}
                  onChange={(e) => setDiasPlazoSeparado(Number(e.target.value))}
                  className="w-full px-3 py-2.5 bg-slate-800 border border-slate-700 rounded-xl text-white font-medium focus:border-amber-500"
                >
                  <option value={15}>15 Días calendario</option>
                  <option value={30}>30 Días calendario (Estándar)</option>
                  <option value={45}>45 Días calendario</option>
                  <option value={60}>60 Días calendario</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider">
                  Observaciones o Notas Adicionales
                </label>
                <textarea
                  rows={2}
                  placeholder="Detalles de apartado, tallas reservadas, condiciones..."
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowSeparadoModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCrearSeparado}
                disabled={isSubmittingSeparado || !abonoInicialSeparado}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 disabled:opacity-40"
              >
                {isSubmittingSeparado ? 'Registrando Separado...' : 'Confirmar y Guardar Separado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL DE PEDIDOS GUARDADOS (COLA TEMPORAL)                 */}
      {/* ========================================================== */}
      {showPedidosModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-3xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 font-['Outfit']">
                <FolderOpen className="h-5 w-5 text-amber-400" />
                Borradores de Pedidos en Cola ({pedidosGuardados.length})
              </h3>
              <button
                type="button"
                onClick={() => setShowPedidosModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {pedidosGuardados.length === 0 ? (
              <p className="text-center py-10 text-slate-500 text-sm">
                No hay pedidos en cola guardados.
              </p>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {pedidosGuardados.map((ped) => (
                  <div
                    key={ped.id}
                    className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{ped.cliente_nombre}</span>
                        <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono">
                          {ped.fecha}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {ped.productos.length} producto(s) · Total:{' '}
                        <span className="text-emerald-400 font-bold font-mono">
                          ${formatNumber(ped.total)}
                        </span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCargarPedido(ped)}
                        className="px-3.5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Cargar a POS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEliminarPedidoGuardado(ped.id)}
                        className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar pedido guardado"
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

      {/* ========================================================== */}
      {/* MODAL DE APERTURA RÁPIDA DE CAJA                           */}
      {/* ========================================================== */}
      {showAbrirCajaModal && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2 font-['Outfit']">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">💰</span>
                Apertura de Turno de Caja
              </h3>
              <button
                type="button"
                onClick={() => setShowAbrirCajaModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 sm:space-y-4 text-xs">
              <div className="p-3 bg-slate-800/80 border border-slate-700/80 rounded-xl text-slate-300 space-y-1">
                <p className="font-semibold text-white">Requisito Obligatorio POS 2026</p>
                <p className="text-slate-400 text-[11px]">
                  Ingrese la base de dinero en efectivo con la que inicia la jornada para garantizar el cuadre de arqueo.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 uppercase tracking-wider text-[10px] sm:text-xs">
                  Monto de Apertura / Base en Efectivo ($ COP) *
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Ej: 50000"
                  value={montoAperturaInput}
                  onChange={(e) => setMontoAperturaInput(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white font-bold text-sm sm:text-base focus:border-emerald-500 focus:outline-none"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAbrirCajaModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleAbrirCajaRapida}
                disabled={isOpeningCaja || montoAperturaInput === ''}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 text-xs disabled:opacity-40 text-center"
              >
                {isOpeningCaja ? 'Abriendo Turno...' : 'Confirmar y Abrir Caja'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* MODAL INTERACTIVO DE TIQUETE TÉRMICO POST-VENTA            */}
      {/* ========================================================== */}
      {showTicketModal && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white font-['Outfit']">Venta Exitosa</h3>
                  <p className="text-[11px] text-slate-400">Comprobante térmico listo para impresión</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowTicketModal(false);
                  setTicketData(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {isLoadingTicket ? (
              <div className="py-12 text-center space-y-3">
                <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-xs text-slate-400">Generando vista de tiquete térmico...</p>
              </div>
            ) : ticketData ? (
              <div className="space-y-4">
                {/* Previsualización del Tiquete Térmico */}
                <div className="bg-white text-black p-4 sm:p-5 rounded-xl sm:rounded-2xl font-mono text-[11px] shadow-inner max-h-[340px] sm:max-h-[380px] overflow-y-auto leading-relaxed">
                  {ticketData.config?.logo_src && (
                    <img
                      src={ticketData.config.logo_src}
                      alt="Logo"
                      className="max-h-12 max-w-[120px] mx-auto mb-2 object-contain"
                    />
                  )}
                  <div className="text-center">
                    <p className="font-extrabold text-sm">{ticketData.config?.nombre_negocio || 'TumiFact'}</p>
                    {ticketData.config?.nit && <p>NIT: {ticketData.config.nit}</p>}
                    {ticketData.config?.direccion && <p>{ticketData.config.direccion}</p>}
                    {ticketData.config?.telefono && <p>Tel: {ticketData.config.telefono}</p>}
                  </div>

                  <div className="border-t border-dashed border-black my-2.5" />

                  <div className="space-y-0.5 text-[10px]">
                    <p><strong>FACTURA POS:</strong> #{ticketData.factura.id}</p>
                    <p><strong>FECHA:</strong> {new Date(ticketData.factura.created_at || ticketData.factura.fecha).toLocaleString('es-CO')}</p>
                    <p><strong>CLIENTE:</strong> {ticketData.factura.cliente_nombre}</p>
                    <p><strong>MÉTODO DE PAGO:</strong> {(ticketData.factura.forma_pago || 'efectivo').toUpperCase()}</p>
                  </div>

                  <div className="border-t border-dashed border-black my-2.5" />

                  <div className="space-y-1.5">
                    {ticketData.detalles.map((d: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start text-[10px]">
                        <div>
                          <p className="font-bold">{d.producto_nombre}</p>
                          <p className="text-neutral-600">
                            {Number(d.cantidad)} {d.unidad_medida || 'UND'} × ${Number(d.precio_unitario).toLocaleString('es-CO')}
                          </p>
                        </div>
                        <p className="font-bold font-mono">${Number(d.subtotal).toLocaleString('es-CO')}</p>
                      </div>
                    ))}
                  </div>

                  <div className="border-t-2 border-dashed border-black my-2.5 pt-2 flex justify-between text-xs font-black">
                    <span>TOTAL:</span>
                    <span>${Number(ticketData.factura.total).toLocaleString('es-CO')}</span>
                  </div>

                  {ticketData.config?.qr_src && (
                    <div className="text-center pt-2">
                      <img src={ticketData.config.qr_src} alt="QR" className="max-h-20 max-w-[80px] mx-auto" />
                    </div>
                  )}

                  <p className="text-center text-[9px] text-neutral-600 mt-2 italic">
                    {ticketData.config?.pie_pagina || '¡Gracias por su compra!'}
                  </p>
                </div>

                {/* Botones de Acción Térmica */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <a
                    href={`/facturas/${ticketData.factura.id}/imprimir`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-center"
                  >
                    📄 Abrir Tiquete
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      const printWindow = window.open(`/facturas/${ticketData.factura.id}/imprimir`, '_blank');
                      if (printWindow) {
                        printWindow.focus();
                      }
                    }}
                    className="py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-blue-500/20 cursor-pointer"
                  >
                    <Printer className="h-4 w-4" />
                    Imprimir Tiquete
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
