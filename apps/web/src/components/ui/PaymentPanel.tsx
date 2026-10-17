import { useState } from 'react';
import { Button } from './Button';

type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

export function PaymentPanel({ total = 0 }: { total?: number }) {
  const [method, setMethod] = useState<PaymentMethod>('efectivo');

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {(['efectivo', 'tarjeta', 'transferencia', 'mixto'] as PaymentMethod[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMethod(m)}
            className={`rounded-xl border px-3 py-2 text-xs font-bold capitalize ${
              method === m
                ? 'border-blue-500 bg-blue-600 text-white'
                : 'border-slate-700 bg-slate-800 text-slate-300'
            }`}
          >
            {m}
          </button>
        ))}
      </div>
      <div className="text-right text-lg font-black text-emerald-400">
        ${total.toLocaleString('es-CO')}
      </div>
      <Button className="w-full">Cobrar</Button>
    </div>
  );
}
