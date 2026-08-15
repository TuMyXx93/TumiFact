export const APP_LOCALE = 'es-CO';
export const APP_CURRENCY = 'COP';

export const numberFormat = new Intl.NumberFormat(APP_LOCALE, {
  maximumFractionDigits: 0
});

export const numberFormatWithDecimals = new Intl.NumberFormat(APP_LOCALE, {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

export const currencyFormat = new Intl.NumberFormat(APP_LOCALE, {
  style: 'currency',
  currency: APP_CURRENCY,
  minimumFractionDigits: 0,
  maximumFractionDigits: 0
});

export function formatNumber(value: number | bigint | string | null | undefined): string {
  const num = typeof value === 'bigint'
    ? value
    : Number(value ?? 0);
  if (!Number.isFinite(num)) return '0';
  return numberFormat.format(num);
}

export function formatCurrency(value: number | bigint | string | null | undefined): string {
  const num = typeof value === 'bigint'
    ? value
    : Number(value ?? 0);
  if (!Number.isFinite(num)) return '$0';
  return currencyFormat.format(num);
}

export const APP_TIMEZONE = 'America/Bogota';

export function formatDate(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return '';
  }
}

export function formatDateShort(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleDateString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch {
    return '';
  }
}

export function formatTime(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  try {
    const date = value instanceof Date ? value : new Date(value);
    return date.toLocaleTimeString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  } catch {
    return '';
  }
}
