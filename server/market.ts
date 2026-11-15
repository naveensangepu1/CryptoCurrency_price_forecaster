import { DEFAULT_USD_INR_RATE, SUPPORTED_COINS, VALID_RANGES } from "./config.ts";
import { fetchBars, type Bar } from "./yahoo.ts";

const r = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

let inrCache = { rate: DEFAULT_USD_INR_RATE, ts: 0 };
const INR_TTL_MS = 10 * 60 * 1000;

export async function getUsdToInrRate(): Promise<number> {
  if (Date.now() - inrCache.ts < INR_TTL_MS) return inrCache.rate;
  try {
    const bars = await fetchBars("USDINR=X", "5d", "1d");
    const rate = bars.at(-1)?.close;
    if (rate && rate > 0) {
      inrCache = { rate, ts: Date.now() };
      return rate;
    }
  } catch (e) {
    console.warn(`Failed to fetch USD/INR rate, using fallback: ${e}`);
  }
  return inrCache.rate;
}

export async function fetchTickerHistory(symbol: string, rangeKey = "1Y"): Promise<Bar[]> {
  const key = rangeKey.toUpperCase();
  const cfg = VALID_RANGES[key] ?? VALID_RANGES["1Y"];
  const yf = SUPPORTED_COINS[symbol]?.yf_symbol ?? symbol;
  try {
    let bars = await fetchBars(yf, cfg.period, cfg.interval, key === "7D");
    if (bars.length === 0) bars = await fetchBars(yf, "1y", "1d");
    return bars;
  } catch (e) {
    console.error(`Error fetching historical data for ${symbol} (${key}): ${e}`);
    return [];
  }
}

const roundBar = (b: Bar) => ({
  date: b.date,
  open: r(b.open, 4),
  high: r(b.high, 4),
  low: r(b.low, 4),
  close: r(b.close, 4),
  volume: r(b.volume, 2),
});

export async function getCoinHistoricalData(symbol: string, rangeKey: string) {
  const meta = SUPPORTED_COINS[symbol];
  const [bars, usdInr] = await Promise.all([fetchTickerHistory(symbol, rangeKey), getUsdToInrRate()]);
  const base = { symbol, ticker: meta.ticker, name: meta.name, range: rangeKey, usd_to_inr_rate: usdInr };
  if (bars.length === 0) {
    return { ...base, points: [], latest_price_usd: 0, latest_price_inr: 0, statistics: {} };
  }
  const points = bars.map(roundBar);
  const latest = points.at(-1)!.close;
  const first = points[0].close;
  const change = latest - first;
  const highs = points.map((p) => p.high).filter((v) => v > 0);
  const lows = points.map((p) => p.low).filter((v) => v > 0);
  return {
    ...base,
    points,
    latest_price_usd: latest,
    latest_price_inr: r(latest * usdInr, 2),
    statistics: {
      period_change: r(change, 4),
      period_change_percentage: r(first ? (change / first) * 100 : 0, 2),
      period_high: highs.length ? r(Math.max(...highs), 4) : latest,
      period_low: lows.length ? r(Math.min(...lows), 4) : latest,
      total_volume: r(points.reduce((s, p) => s + p.volume, 0), 2),
      data_points: points.length,
    },
  };
}

let overviewCache: { data: unknown[]; ts: number } | null = null;

export async function getMarketOverview() {
  if (overviewCache && Date.now() - overviewCache.ts < 5 * 60 * 1000) return overviewCache.data;
  const usdInr = await getUsdToInrRate();
  const results = await Promise.all(
    Object.values(SUPPORTED_COINS).map(async (meta) => {
      const empty = {
        symbol: meta.symbol, ticker: meta.ticker, name: meta.name, color: meta.color, category: meta.category,
        current_price_usd: 0, current_price_inr: 0, price_change_24h: 0, price_change_percentage_24h: 0,
        high_24h: 0, low_24h: 0, volume_24h: 0, sparkline: [] as number[],
      };
      try {
        const [daily, hourly] = await Promise.all([
          fetchBars(meta.yf_symbol, "5d", "1d"),
          fetchBars(meta.yf_symbol, "2d", "1h").catch(() => [] as Bar[]),
        ]);
        if (daily.length === 0) return empty;
        const last = daily.at(-1)!;
        const prev = daily.length >= 2 ? daily.at(-2)!.close : last.close;
        const change = last.close - prev;
        const spark = (hourly.length ? hourly.slice(-16) : daily).map((b) => r(b.close, 2));
        return {
          ...empty,
          current_price_usd: r(last.close, 4),
          current_price_inr: r(last.close * usdInr, 2),
          price_change_24h: r(change, 4),
          price_change_percentage_24h: r(prev ? (change / prev) * 100 : 0, 2),
          high_24h: r(last.high, 4),
          low_24h: r(last.low, 4),
          volume_24h: r(last.volume, 2),
          sparkline: spark,
        };
      } catch (e) {
        console.error(`Error fetching overview for ${meta.symbol}: ${e}`);
        return empty;
      }
    }),
  );
  if (results.some((c) => c.current_price_usd > 0)) overviewCache = { data: results, ts: Date.now() };
  return results;
}

export { roundBar };
