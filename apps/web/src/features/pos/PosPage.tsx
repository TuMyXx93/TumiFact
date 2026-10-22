import { calcularDescuentos, type DescuentoCatalogo } from '@tumifact/discounts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SearchInput } from '../../components/ui/SearchInput';
import { apiFetch, getToken, setToken } from '../../lib/api';
import {
  enqueueSale,
  flushQueuedSales,
  pendingCount,
  type QueuedSale,
} from '../../lib/offlineQueue';

interface Product {
  id: number;
  nombre: string;
  precio_detal: string;
  stock_actual: string;
}

interface CartLine {
  lineId: string;
  product: Product;
  cantidad: number;
}

interface DescuentoSeleccion {
  descuento_id: number;
  producto_id?: number;
}

let lineCounter = 0;

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `pos-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discounts, setDiscounts] = useState<DescuentoCatalogo[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<DescuentoSeleccion | null>(null);
  const [status, setStatus] = useState('');
  const [pending, setPending] = useState(0);
  const [credential, setCredential] = useState('admin@tumifact.com');
  const [password, setPassword] = useState('Password*2026');
  const [filter, setFilter] = useState('');

  const loadCatalog = useCallback(async () => {
    const [prodRes, discRes] = await Promise.all([
      apiFetch('/api/v1/products'),
      apiFetch('/api/v1/discounts'),
    ]);
    if (prodRes.ok) {
      const data = await prodRes.json();
      setProducts(data.data || []);
    } else {
      setStatus('Debes iniciar sesión para ver el catálogo');
    }
    if (discRes.ok) {
      const data = await discRes.json();
      setDiscounts(data.data || []);
    }
  }, []);

  /**
   * Reintenta las ventas encoladas: conservan su Idempotency-Key, así el
   * backend no duplica la factura aunque se haya registrado antes.
   */
  const syncOfflineSales = useCallback(async () => {
    const resultado = await flushQueuedSales(async (sale: QueuedSale) => {
      const res = await apiFetch(sale.path, {
        method: 'POST',
        headers: { 'Idempotency-Key': sale.idempotencyKey },
        body: JSON.stringify(sale.payload),
      });
      return res.ok;
    });
    setPending(resultado.pendientes);
    if (resultado.enviadas > 0) {
      setStatus(`${resultado.enviadas} venta(s) offline sincronizadas`);
    }
  }, []);

  useEffect(() => {
    setPending(pendingCount());
    if (!getToken()) return;
    void loadCatalog();
    void syncOfflineSales();
  }, [loadCatalog, syncOfflineSales]);

  const handleLogin = async () => {
    const res = await fetch('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential, password }),
    });
    if (res.ok) {
      const data = await res.json();
      setToken(data.token);
      setStatus(`Sesión iniciada como ${data.user.nombre}`);
      void loadCatalog();
      void syncOfflineSales();
    } else {
      setStatus('Credenciales incorrectas');
    }
  };

  const addToCart = (product: Product) =>
    setCart((prev) => {
      const existing = prev.find((line) => line.product.id === product.id);
      if (existing) {
        return prev.map((line) =>
          line.lineId === existing.lineId ? { ...line, cantidad: line.cantidad + 1 } : line
        );
      }
      lineCounter += 1;
      return [...prev, { lineId: `line-${lineCounter}`, product, cantidad: 1 }];
    });

  const filteredProducts = useMemo(() => {
    const term = filter.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) => p.nombre.toLowerCase().includes(term) || String(p.id).includes(term)
    );
  }, [products, filter]);

  /**
   * Previsualiza el total con el MISMO motor que usa el backend
   * (`@tumifact/discounts`), para que el cajero nunca vea un total distinto
   * al que se cobra.
   */
  const preview = useMemo(() => {
    if (cart.length === 0) {
      return { subtotal: 0, descuentoTotal: 0, total: 0, rechazados: [] as any[] };
    }
    return calcularDescuentos({
      lineas: cart.map((line) => ({
        producto_id: line.product.id,
        cantidad: line.cantidad,
        precio_unitario: Number(line.product.precio_detal || 0),
      })),
      solicitudes: selectedDiscount ? [selectedDiscount] : [],
      descuentos: discounts,
      limites: {
        descuento_max_porcentaje: 100,
        descuento_max_monto: Number.MAX_SAFE_INTEGER,
        puede_aprobar_descuentos: true,
      },
      hoy: new Date(),
    });
  }, [cart, discounts, selectedDiscount]);

  const checkout = async () => {
    if (cart.length === 0) return;
    const idempotencyKey = uuid();
    const payload = {
      total: preview.total,
      productos: cart.map((line) => ({
        producto_id: line.product.id,
        cantidad: line.cantidad,
        precio: Number(line.product.precio_detal || 0),
      })),
      descuentos: selectedDiscount ? [selectedDiscount] : [],
    };

    try {
      const res = await apiFetch('/api/v1/sales', {
        method: 'POST',
        headers: { 'Idempotency-Key': idempotencyKey },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus(`Venta creada #${data.sale?.id}`);
        setCart([]);
        setSelectedDiscount(null);
      } else {
        setStatus(data.error || 'Error al vender');
      }
    } catch {
      // Sin red: la venta se encola con su Idempotency-Key para reintentar.
      enqueueSale('/api/v1/sales', payload, idempotencyKey);
      setPending(pendingCount());
      setStatus('Sin conexión: venta encolada para sincronizar');
      setCart([]);
      setSelectedDiscount(null);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_380px]">
      <Card className="min-h-[70vh]">
        <h1 className="text-2xl font-bold">POS Nuevo Stack</h1>
        {pending > 0 && (
          <div className="mt-2">
            <Badge tone="warning">{pending} venta(s) pendiente(s) de sincronizar</Badge>
          </div>
        )}

        {!getToken() && (
          <div className="mt-4 flex flex-wrap gap-2">
            <input
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              value={credential}
              onChange={(e) => setCredential(e.target.value)}
              placeholder="Correo o documento"
            />
            <input
              className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
            />
            <Button onClick={handleLogin}>Iniciar sesión</Button>
          </div>
        )}

        <SearchInput
          className="mt-4"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Buscar producto..."
        />

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addToCart(product)}
              className="rounded-xl border border-slate-700 bg-slate-800 p-3 text-left hover:border-blue-500"
            >
              <div className="font-semibold">{product.nombre}</div>
              <div className="text-sm text-slate-400">${product.precio_detal}</div>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-bold">Carrito</h2>
        <div className="mt-3 space-y-2">
          {cart.map((line) => (
            <div key={line.lineId} className="text-sm">
              {line.cantidad} × {line.product.nombre}
            </div>
          ))}
        </div>

        {discounts.length > 0 && (
          <select
            className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-xs"
            value={selectedDiscount?.descuento_id ?? ''}
            onChange={(e) => {
              const id = e.target.value;
              if (!id) {
                setSelectedDiscount(null);
                return;
              }
              const descuento = discounts.find((d) => d.id === Number(id));
              setSelectedDiscount({
                descuento_id: Number(id),
                producto_id: descuento?.aplica_a === 'linea' ? cart[0]?.product.id : undefined,
              });
            }}
          >
            <option value="">Sin descuento</option>
            {discounts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.nombre} ({d.tipo === 'porcentaje' ? `${d.valor}%` : `$${d.valor}`})
                {d.requiere_aprobacion ? ' — requiere aprobación' : ''}
              </option>
            ))}
          </select>
        )}

        <div className="mt-4 space-y-1 text-sm">
          <div className="flex justify-between text-slate-400">
            <span>Subtotal</span>
            <span>${preview.subtotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-slate-400">
            <span>Descuento</span>
            <span>-${preview.descuentoTotal.toLocaleString('es-CO')}</span>
          </div>
          <div className="flex justify-between text-lg font-black text-emerald-400">
            <span>Total</span>
            <span>${preview.total.toLocaleString('es-CO')}</span>
          </div>
        </div>

        {preview.rechazados.length > 0 && (
          <p className="mt-2 text-xs text-amber-400">
            El descuento no aplica: {preview.rechazados[0].motivo}
          </p>
        )}

        <Button className="mt-4 w-full" onClick={checkout} disabled={cart.length === 0}>
          Cobrar ({cart.reduce((n, l) => n + l.cantidad, 0)})
        </Button>
        {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      </Card>
    </div>
  );
}
