import { useEffect, useState } from 'react';

interface Product {
  id: number;
  nombre: string;
  precio_detal: string;
  stock_actual: string;
}

export function PosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Product[]>([]);
  const [status, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/v1/products')
      .then((res) => res.json())
      .then((data) => setProducts(data.data || []))
      .catch(() => setStatus('Error cargando productos'));
  }, []);

  const addToCart = (product: Product) => setCart((prev) => [...prev, product]);

  const checkout = async () => {
    if (cart.length === 0) return;
    const payload = {
      productos: cart.map((item) => ({
        producto_id: item.id,
        cantidad: 1,
        precio: Number(item.precio_detal || 0),
      })),
    };

    const res = await fetch('/api/v1/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (res.ok) {
      setStatus(`Venta creada #${data.sale?.id}`);
      setCart([]);
    } else {
      setStatus(data.error || 'Error al vender');
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 gap-4 p-4 lg:grid-cols-[1fr_360px]">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
        <h1 className="text-2xl font-bold">POS Nuevo Stack</h1>
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
          {cart.map((item, index) => (
            <div key={`${item.id}-${index}`} className="text-sm">
              {item.nombre}
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={checkout}
          className="mt-4 w-full rounded-xl bg-blue-600 px-4 py-2 font-bold text-white hover:bg-blue-500"
        >
          Cobrar ({cart.length})
        </button>
        {status && <p className="mt-3 text-sm text-slate-300">{status}</p>}
      </section>
    </div>
  );
}
