import { calcularDescuentos, type DescuentoCatalogo } from '@tumifact/discounts';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, getToken, setToken } from '../../lib/api';

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

export function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [discounts, setDiscounts] = useState<DescuentoCatalogo[]>([]);
  const [selectedDiscount, setSelectedDiscount] = useState<DescuentoSeleccion | null>(null);
  const [status, setStatus] = useState('');
  const [credential, setCredential] = useState('admin@tumifact.com');
  const [password, setPassword] = useState('Password*2026');

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

  useEffect(() => {
    if (getToken()) void loadCatalog();
  }, [loadCatalog]);

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
      setStatus('Sin conexión: la venta no pudo registrarse');
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_380px]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <h1 className="text-2xl font-bold">POS Nuevo Stack</h1>

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
            <button
              type="button"
              onClick={handleLogin}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white"
            >
              Iniciar sesión
            </button>
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {products.map((product) => (
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
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
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

        <button
          type="button"
          onClick={checkout}
          disabled={cart.length === 0}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          Cobrar ({cart.reduce((n, l) => n + l.cantidad, 0)})
        </button>
        {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      </section>
    </div>
  );
}
