import { useCallback, useEffect, useState } from 'react';
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

let lineCounter = 0;

export function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [status, setStatus] = useState('');
  const [credential, setCredential] = useState('admin@tumifact.com');
  const [password, setPassword] = useState('Password*2026');

  const loadProducts = useCallback(async () => {
    const res = await apiFetch('/api/v1/products');
    if (res.ok) {
      const data = await res.json();
      setProducts(data.data || []);
    } else {
      setStatus('Debes iniciar sesión para ver el catálogo');
    }
  }, []);

  useEffect(() => {
    if (getToken()) void loadProducts();
  }, [loadProducts]);

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
      void loadProducts();
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

  const checkout = async () => {
    if (cart.length === 0) return;
    const payload = {
      productos: cart.map((line) => ({
        producto_id: line.product.id,
        cantidad: line.cantidad,
        precio: Number(line.product.precio_detal || 0),
      })),
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
      } else {
        setStatus(data.error || 'Error al vender');
      }
    } catch {
      setStatus('Sin conexión: la venta no pudo registrarse');
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
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
        <button
          type="button"
          onClick={checkout}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500"
        >
          Cobrar ({cart.reduce((n, l) => n + l.cantidad, 0)})
        </button>
        {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      </section>
    </div>
  );
}
