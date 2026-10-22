/**
 * Cola de ventas offline para el POS.
 *
 * Cada venta encolada conserva su `Idempotency-Key`: al reintentarse, el
 * backend la reconoce y no duplica la factura. La cola persiste en
 * `localStorage` para sobrevivir a una recarga de la terminal.
 */

export interface QueuedSale {
  /** Idempotency-Key UUID: garantiza que el reintento no duplique la venta. */
  idempotencyKey: string;
  path: string;
  payload: unknown;
  createdAt: string;
  attempts: number;
}

const STORAGE_KEY = 'tumifact.offlineSales';

function uuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getQueuedSales(): QueuedSale[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedSale[]) : [];
  } catch {
    return [];
  }
}

function persist(sales: QueuedSale[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sales));
}

export function enqueueSale(path: string, payload: unknown, idempotencyKey?: string): QueuedSale {
  const queued: QueuedSale = {
    idempotencyKey: idempotencyKey || uuid(),
    path,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
  };
  persist([...getQueuedSales(), queued]);
  return queued;
}

export function pendingCount(): number {
  return getQueuedSales().length;
}

/**
 * Reintenta las ventas encoladas en orden cronológico.
 * Una venta se elimina de la cola solo cuando el backend la acepta.
 */
export async function flushQueuedSales(
  send: (sale: QueuedSale) => Promise<boolean>
): Promise<{ enviadas: number; pendientes: number }> {
  const cola = getQueuedSales();
  if (cola.length === 0) return { enviadas: 0, pendientes: 0 };

  let enviadas = 0;
  const restantes: QueuedSale[] = [];

  for (const sale of cola) {
    try {
      const ok = await send(sale);
      if (ok) {
        enviadas += 1;
      } else {
        restantes.push({ ...sale, attempts: sale.attempts + 1 });
      }
    } catch {
      restantes.push({ ...sale, attempts: sale.attempts + 1 });
    }
  }

  persist(restantes);
  return { enviadas, pendientes: restantes.length };
}

export function clearQueuedSales(): void {
  localStorage.removeItem(STORAGE_KEY);
}
