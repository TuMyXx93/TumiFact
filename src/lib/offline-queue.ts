/**
 * Offline Queue — IndexedDB para facturas offline (Fase 4.2)
 * Patrón inspirado en tumi-suite Sale.channel OFFLINE + offlineId
 * Guarda POST /api/facturas fallidos por red y los reintenta al volver online.
 */

const DB_NAME = 'tumifact_offline';
const DB_VERSION = 1;
const STORE_FACTURAS = 'facturas_queue';

export interface QueuedFactura {
  offlineId: string; // UUID v4 generado en cliente
  payload: any; // CreateFacturaInput
  headers: Record<string, string>; // incluye Idempotency-Key y Authorization si existe
  createdAt: string;
  retries: number;
  lastError?: string;
  status?: 'pending' | 'failed' | 'needs_auth';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') return reject(new Error('IndexedDB no disponible'));
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_FACTURAS)) {
        db.createObjectStore(STORE_FACTURAS, { keyPath: 'offlineId' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueueFactura(
  payload: any,
  headers: Record<string, string> = {}
): Promise<string> {
  const db = await openDB();
  const offlineId =
    (globalThis as any).crypto?.randomUUID?.() ||
    `offline-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const item: QueuedFactura = {
    offlineId,
    payload: { ...payload, offlineId },
    headers: {
      ...headers,
      'Idempotency-Key': headers['Idempotency-Key'] || offlineId,
    },
    createdAt: new Date().toISOString(),
    retries: 0,
    status: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FACTURAS, 'readwrite');
    tx.objectStore(STORE_FACTURAS).put(item);
    tx.oncomplete = () => resolve(offlineId);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueuedFacturas(): Promise<QueuedFactura[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FACTURAS, 'readonly');
    const req = tx.objectStore(STORE_FACTURAS).getAll();
    req.onsuccess = () => resolve((req.result as QueuedFactura[]) || []);
    req.onerror = () => reject(req.error);
  });
}

export async function removeQueuedFactura(offlineId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FACTURAS, 'readwrite');
    tx.objectStore(STORE_FACTURAS).delete(offlineId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function getQueueCount(): Promise<number> {
  const items = await getQueuedFacturas().catch(() => []);
  return items.length;
}

/**
 * Reintenta todas las facturas en cola usando apiFetch.
 * Se llama en window 'online' y en intervalo cada 60s si hay cola.
 * Retorna { replayed, failed }.
 */
export async function replayQueuedFacturas(
  apiFetch: (url: string, opts: RequestInit) => Promise<Response>
): Promise<{ replayed: number; failed: number }> {
  const queued = await getQueuedFacturas();
  if (queued.length === 0) return { replayed: 0, failed: 0 };

  let replayed = 0;
  let failed = 0;

  for (const item of queued) {
    if (item.status && item.status !== 'pending') {
      failed++;
      continue;
    }
    try {
      const res = await apiFetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...item.headers },
        body: JSON.stringify(item.payload),
      });

      if (res.ok) {
        await removeQueuedFactura(item.offlineId);
        replayed++;
      } else {
        const data = await res.json().catch(() => ({}));
        item.lastError = data.error || `HTTP ${res.status}`;
        item.status =
          res.status === 401
            ? 'needs_auth'
            : res.status >= 400 && res.status < 500
              ? 'failed'
              : 'pending';
        // Ningún rechazo se elimina silenciosamente: 401 requiere sesión,
        // 409/422 revisión manual y 429/5xx reintento posterior.
        if (item.status === 'pending') item.retries++;
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_FACTURAS, 'readwrite');
          tx.objectStore(STORE_FACTURAS).put(item);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        failed++;
      }
    } catch (err) {
      item.retries++;
      item.status = 'pending';
      item.lastError = (err as Error).message;
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_FACTURAS, 'readwrite');
        tx.objectStore(STORE_FACTURAS).put(item);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      failed++;
    }
  }

  return { replayed, failed };
}

export async function clearQueue(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_FACTURAS, 'readwrite');
    tx.objectStore(STORE_FACTURAS).clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
