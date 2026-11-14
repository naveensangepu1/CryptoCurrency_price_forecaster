import type { CurrencyMode } from '../types';

// Same values as the @theme block in index.css. Recharts draws SVG and
// doesn't pick up CSS variables everywhere, so it gets plain hex values.
export const CHART_COLORS = {
  line: '#27498b',
  forecast: '#c2571a',
  grid: '#e6e1d7',
  axis: '#7d7971',
};

const locale = (mode: CurrencyMode) => (mode === 'INR' ? 'en-IN' : 'en-US');

/** $65,622.41 or ₹61,84,255.42. Coins under $1 get 4 decimals. */
export function money(value: number, mode: CurrencyMode): string {
  if (!Number.isFinite(value)) return '-';
  const digits = value !== 0 && Math.abs(value) < 1 ? 4 : 2;
  return new Intl.NumberFormat(locale(mode), {
    style: 'currency',
    currency: mode,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

/** $32.44B, ₹3,057 Cr, ₹72.17 L - for volumes and axis labels. */
export function compactMoney(value: number, mode: CurrencyMode): string {
  if (!Number.isFinite(value)) return '-';
  // Intl's en-IN compact output ("₹32.85KCr") isn't how anyone writes rupees,
  // so use crore and lakh directly.
  if (mode === 'INR') {
    const a = Math.abs(value);
    if (a >= 1e7) {
      const cr = value / 1e7;
      return `₹${cr.toLocaleString('en-IN', { maximumFractionDigits: Math.abs(cr) >= 100 ? 0 : 2 })} Cr`;
    }
    if (a >= 1e5) return `₹${(value / 1e5).toLocaleString('en-IN', { maximumFractionDigits: 2 })} L`;
  }
  return new Intl.NumberFormat(locale(mode), {
    style: 'currency',
    currency: mode,
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
}

export function signedPct(value: number): string {
  const sign = value > 0 ? '+' : value < 0 ? '−' : '';
  return `${sign}${Math.abs(value).toFixed(2)}%`;
}

/** The API sends "2026-11-14" for daily rows and "2026-11-14 15:00" for hourly ones. */
export function parseDate(s: string): Date {
  const [day, time] = s.split(/[ T]/);
  const [y, m, d] = day.split('-').map(Number);
  const [hh, mm] = time ? time.split(':').map(Number) : [0, 0];
  return new Date(y, (m || 1) - 1, d || 1, hh || 0, mm || 0);
}

export function hasTime(s: string): boolean {
  return /[ T]\d{2}:\d{2}/.test(s);
}

// Spelled out here rather than via toLocaleDateString, which gives "Sept" in some browsers.
export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad2 = (n: number) => String(n).padStart(2, '0');

/** 14 Nov */
export function dayMonth(s: string): string {
  const d = parseDate(s);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** 14 Nov 2026, or 14 Nov 2026, 15:00 for hourly rows */
export function fullDate(s: string): string {
  const d = parseDate(s);
  const date = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  return hasTime(s) ? `${date}, ${pad2(d.getHours())}:${pad2(d.getMinutes())}` : date;
}
