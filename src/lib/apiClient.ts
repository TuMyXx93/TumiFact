const HEALTH_PATH = '/api/health/db';
const SESSION_HEALTHY_KEY = 'tumifact.healthyApiBase';
const LOCAL_OVERRIDE_KEY = 'tumifact.apiBaseUrl';

/** Timeout global para todas las peticiones apiFetch (ms) */
const FETCH_TIMEOUT_MS = 10_000;

const ENV_API_BASE = (import.meta.env.PUBLIC_API_BASE_URL || '').trim();
const ENV_API_PORT = (import.meta.env.PUBLIC_API_PORT || '').trim();
const ENV_API_PORTS = (import.meta.env.PUBLIC_API_PORTS || '').trim();
const ENV_API_AUTO_DISCOVERY = (import.meta.env.PUBLIC_API_AUTO_DISCOVERY || 'true')
  .trim()
  .toLowerCase();
const ENV_API_PORT_SCAN_RANGE = (import.meta.env.PUBLIC_API_PORT_SCAN_RANGE || '3000-3999').trim();

let cachedApiBase: string | null = null;
let scanAttempted = false;
let refreshInFlight: Promise<boolean> | null = null;

interface ProbeResult {
  ok: boolean;
  latencyMs?: number;
}

declare global {
  interface Window {
    __TUMIFACT_API_BASE__?: string;
  }
}

function normalizeBase(value: string | null | undefined): string | null {
  if (!value || typeof value !== 'string') return null;
  return value.trim().replace(/\/+$/, '');
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`;
}

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function parseCsvPorts(raw: string): number[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((item) => Number.parseInt(item.trim(), 10))
    .filter((port) => Number.isInteger(port) && port > 0 && port < 65536);
}

function parsePortRange(raw: string): number[] {
  const trimmed = raw.trim();
  if (!trimmed.includes('-')) {
    const single = Number.parseInt(trimmed, 10);
    return Number.isInteger(single) && single > 0 && single < 65536 ? [single] : [];
  }

  const [startRaw, endRaw] = trimmed.split('-', 2);
  const start = Number.parseInt(startRaw, 10);
  const end = Number.parseInt(endRaw, 10);
  if (!Number.isInteger(start) || !Number.isInteger(end)) return [];

  const min = Math.max(1, Math.min(start, end));
  const max = Math.min(65535, Math.max(start, end));
  if (max - min > 2000) return [];

  const ports: number[] = [];
  for (let port = min; port <= max; port += 1) ports.push(port);
  return ports;
}

function getWindowContext() {
  if (typeof window === 'undefined') return null;
  return {
    protocol: window.location.protocol,
    hostname: window.location.hostname,
    origin: window.location.origin,
  };
}

function getCandidateBases(): string[] {
  const ctx = getWindowContext();
  if (!ctx) return [];

  const queryBase = normalizeBase(
    new URLSearchParams(window.location.search).get('apiBase') ||
      new URLSearchParams(window.location.search).get('api')
  );
  const sessionBase = normalizeBase(sessionStorage.getItem(SESSION_HEALTHY_KEY));
  const localBase = normalizeBase(localStorage.getItem(LOCAL_OVERRIDE_KEY));
  const globalBase = normalizeBase(window.__TUMIFACT_API_BASE__);

  const candidates = [
    normalizeBase(ENV_API_BASE),
    queryBase,
    globalBase,
    sessionBase,
    localBase,
    normalizeBase(ctx.origin),
  ];

  const portCandidates = [...parseCsvPorts(ENV_API_PORTS)];
  if (ENV_API_PORT) {
    const envPort = Number.parseInt(ENV_API_PORT, 10);
    if (Number.isInteger(envPort) && envPort > 0 && envPort < 65536) {
      portCandidates.unshift(envPort);
    }
  }

  for (const port of new Set(portCandidates)) {
    candidates.push(normalizeBase(`${ctx.protocol}//${ctx.hostname}:${port}`));
  }

  return [...new Set(candidates.filter(Boolean) as string[])];
}

async function probeBase(baseUrl: string): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 1200);

  try {
    const startedAt = performance.now();
    const response = await fetch(`${baseUrl}${HEALTH_PATH}`, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    if (!response.ok) return { ok: false };

    const elapsed = Math.round(performance.now() - startedAt);
    const payload = await response.json().catch(() => null);
    const latencyMs = typeof payload?.latencyMs === 'number' ? payload.latencyMs : elapsed;

    return payload?.connected === true ? { ok: true, latencyMs } : { ok: false };
  } catch {
    return { ok: false };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function scanLocalPorts(): Promise<string | null> {
  const ctx = getWindowContext();
  if (!ctx || !isLocalHost(ctx.hostname)) return null;
  if (ENV_API_AUTO_DISCOVERY === 'false') return null;
  if (scanAttempted) return null;

  scanAttempted = true;

  const ports = parsePortRange(ENV_API_PORT_SCAN_RANGE);
  if (ports.length === 0) return null;

  const maxBatchSize = 24;
  for (let i = 0; i < ports.length; i += maxBatchSize) {
    const batch = ports.slice(i, i + maxBatchSize);
    const probes = await Promise.all(
      batch.map(async (port) => {
        const base = `${ctx.protocol}//${ctx.hostname}:${port}`;
        const result = await probeBase(base);
        return result.ok ? base : null;
      })
    );

    const healthy = probes.find(Boolean);
    if (healthy) return healthy;
  }

  return null;
}

function persistHealthyBase(baseUrl: string): void {
  cachedApiBase = baseUrl;
  window.__TUMIFACT_API_BASE__ = baseUrl;
  sessionStorage.setItem(SESSION_HEALTHY_KEY, baseUrl);
  localStorage.setItem(LOCAL_OVERRIDE_KEY, baseUrl);
}

function clearHealthyBase(): void {
  cachedApiBase = null;
  if (typeof window !== 'undefined') {
    delete window.__TUMIFACT_API_BASE__;
    sessionStorage.removeItem(SESSION_HEALTHY_KEY);
  }
}

export async function resolveApiBaseUrl(force = false): Promise<string | null> {
  if (typeof window === 'undefined') {
    return normalizeBase(ENV_API_BASE);
  }

  // BUG FIX: En desarrollo sin PUBLIC_API_BASE_URL configurada, usar rutas relativas
  // para que el proxy Vite (astro.config.mjs) las redirija correctamente
  if (!ENV_API_BASE && ENV_API_AUTO_DISCOVERY === 'false') {
    return ''; // Ruta relativa → /api/... se maneja por el proxy
  }

  if (!force && cachedApiBase) return cachedApiBase;

  const candidates = getCandidateBases();
  for (const baseUrl of candidates) {
    const probe = await probeBase(baseUrl);
    if (probe.ok) {
      persistHealthyBase(baseUrl);
      return baseUrl;
    }
  }

  const discoveredBase = await scanLocalPorts();
  if (discoveredBase) {
    persistHealthyBase(discoveredBase);
    return discoveredBase;
  }

  clearHealthyBase();
  return null;
}

export function getStoredAuthToken(): string | null {
  // The access token is HttpOnly. Browser requests authenticate via credentials.
  return null;
}

export async function resolveApiUrl(path: string): Promise<string> {
  const cleanPath = normalizePath(path);
  const baseUrl = await resolveApiBaseUrl();
  return baseUrl ? `${baseUrl}${cleanPath}` : cleanPath;
}

function handleUnauthorized(): void {
  if (typeof window === 'undefined' || window.location.pathname === '/login') return;
  localStorage.removeItem('tumifact_user');
  sessionStorage.removeItem('tumifact_user');
  window.location.href = '/login';
}

async function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const url = await resolveApiUrl('/api/auth/refresh');
        const response = await fetch(url, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });
        return response.ok;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }
  return refreshInFlight;
}

export async function apiFetch(
  path: string,
  init?: RequestInit & { timeoutMs?: number }
): Promise<Response> {
  const cleanPath = normalizePath(path);
  const primaryUrl = await resolveApiUrl(cleanPath);

  // Headers por defecto + inyección de Token JWT si existe
  const headers = new Headers(init?.headers || {});
  const token = getStoredAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  // AbortController con timeout configurable (default: FETCH_TIMEOUT_MS)
  const timeoutMs = init?.timeoutMs ?? FETCH_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Quitar timeoutMs de las opciones nativas de fetch
  const { timeoutMs: _omit, ...restInit } = init ?? {};
  const fetchInit: RequestInit = {
    ...restInit,
    headers,
    credentials: restInit.credentials || 'include',
    signal: controller.signal,
  };

  try {
    const res = await fetch(primaryUrl, fetchInit);
    clearTimeout(timeoutId);
    if (
      res.status === 401 &&
      cleanPath !== '/api/auth/login' &&
      cleanPath !== '/api/auth/refresh' &&
      cleanPath !== '/api/auth/logout'
    ) {
      if (await refreshSession()) {
        const retryController = new AbortController();
        const retryTimeoutId = setTimeout(() => retryController.abort(), timeoutMs);
        try {
          const retryResponse = await fetch(primaryUrl, {
            ...fetchInit,
            signal: retryController.signal,
          });
          clearTimeout(retryTimeoutId);
          if (retryResponse.status === 401) handleUnauthorized();
          return retryResponse;
        } catch (retryError) {
          clearTimeout(retryTimeoutId);
          throw retryError;
        }
      }
      handleUnauthorized();
    }
    return res;
  } catch (err) {
    clearTimeout(timeoutId);

    // Recovery: solo reintenta si tenemos un base cacheado (NO re-escanea puertos)
    const fallbackBase = cachedApiBase;
    if (!fallbackBase || fallbackBase === primaryUrl.replace(cleanPath, '')) {
      throw err;
    }

    const fallbackController = new AbortController();
    const fallbackTimeoutId = setTimeout(() => fallbackController.abort(), timeoutMs);
    try {
      const res = await fetch(`${fallbackBase}${cleanPath}`, {
        ...fetchInit,
        signal: fallbackController.signal,
      });
      clearTimeout(fallbackTimeoutId);
      if (res.status === 401) handleUnauthorized();
      return res;
    } catch (fallbackErr) {
      clearTimeout(fallbackTimeoutId);
      throw fallbackErr;
    }
  }
}
