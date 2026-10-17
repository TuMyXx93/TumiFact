export interface QueuedSale {
  id: string;
  payload: unknown;
  createdAt: string;
}

const STORAGE_KEY = 'tumifact.offlineSales';

export function enqueueSale(payload: unknown): QueuedSale {
  const queued: QueuedSale = {
    id: crypto.randomUUID(),
    payload,
    createdAt: new Date().toISOString(),
  };

  const current = getQueuedSales();
  current.push(queued);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  return queued;
}

export function getQueuedSales(): QueuedSale[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as QueuedSale[];
  } catch {
    return [];
  }
}

export function clearQueuedSales(): void {
  localStorage.removeItem(STORAGE_KEY);
}
