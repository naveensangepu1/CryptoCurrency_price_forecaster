// Minimal Yahoo Finance chart API client (replaces the Python yfinance dependency).

export interface Bar {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

const cache = new Map<string, { data: Bar[]; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000;

function fmtDate(epochSec: number, withTime: boolean): string {
  const iso = new Date(epochSec * 1000).toISOString();
  return withTime ? `${iso.slice(0, 10)} ${iso.slice(11, 16)}` : iso.slice(0, 10);
}

export async function fetchBars(yfSymbol: string, range: string, interval: string, withTime = false): Promise<Bar[]> {
  const key = `${yfSymbol}|${range}|${interval}|${withTime}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.ts < CACHE_TTL_MS) return hit.data;

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yfSymbol)}?range=${range}&interval=${interval}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CryptoForecaster/2.0)" },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Market data request failed (${res.status}) for ${yfSymbol}`);
  const json: any = await res.json();
  const result = json?.chart?.result?.[0];
  const timestamps: number[] = result?.timestamp ?? [];
  const q = result?.indicators?.quote?.[0] ?? {};
  const bars: Bar[] = [];
  timestamps.forEach((t, i) => {
    const close = q.close?.[i];
    if (close == null || !Number.isFinite(close)) return;
    bars.push({
      date: fmtDate(t, withTime),
      open: q.open?.[i] ?? close,
      high: q.high?.[i] ?? close,
      low: q.low?.[i] ?? close,
      close,
      volume: q.volume?.[i] ?? 0,
    });
  });
  cache.set(key, { data: bars, ts: Date.now() });
  return bars;
}
