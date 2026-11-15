import { SUPPORTED_COINS } from "./config.ts";
import { fetchTickerHistory, getUsdToInrRate, roundBar } from "./market.ts";

const r = (v: number, d: number) => Math.round(v * 10 ** d) / 10 ** d;

const DISCLAIMER_TEXT =
  "ALL INVESTMENTS ARE SUBJECT TO PRICE FLUCTUATIONS AND OTHER MARKET RISKS. " +
  "This tool is strictly for educational, analytical, and demonstration purposes. " +
  "Predictions are generated using a simple Linear Regression model fitted on historical closing prices " +
  "and should not be construed as investment, financial, or trading advice.";

// Deterministic PRNG so the 80/20 split is reproducible (like random_state=42).
function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function fitLinear(x: number[], y: number[]) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (x[i] - mx) * (y[i] - my);
    sxx += (x[i] - mx) ** 2;
  }
  const slope = sxx === 0 ? 0 : sxy / sxx;
  const intercept = my - slope * mx;
  return (v: number) => intercept + slope * v;
}

export async function runPriceForecast(symbol: string, nDaysIn = 7) {
  const meta = SUPPORTED_COINS[symbol];
  const nDays = Math.max(1, Math.min(30, Math.trunc(nDaysIn)));
  const usdInr = await getUsdToInrRate();

  let bars = await fetchTickerHistory(symbol, "1Y");
  if (bars.length < nDays + 15) bars = await fetchTickerHistory(symbol, "ALL");
  if (bars.length < nDays + 10) {
    throw new Error(`Insufficient historical data points available to train model for ${symbol}.`);
  }

  const closes = bars.map((b) => b.close);
  // Feature: today's close; target: close n_days later.
  const X = closes.slice(0, closes.length - nDays);
  const y = closes.slice(nDays);
  if (X.length < 10) throw new Error("Too few training samples after applying shift horizon.");

  const idx = X.map((_, i) => i);
  const rand = mulberry32(42);
  for (let i = idx.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  const nTest = Math.ceil(idx.length * 0.2);
  const testIdx = idx.slice(0, nTest);
  const trainIdx = idx.slice(nTest);

  const predict = fitLinear(trainIdx.map((i) => X[i]), trainIdx.map((i) => y[i]));

  const yTest = testIdx.map((i) => y[i]);
  const pTest = testIdx.map((i) => predict(X[i]));
  const meanY = yTest.reduce((a, b) => a + b, 0) / yTest.length;
  const ssRes = yTest.reduce((s, v, i) => s + (v - pTest[i]) ** 2, 0);
  const ssTot = yTest.reduce((s, v) => s + (v - meanY) ** 2, 0);
  const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
  const mae = yTest.reduce((s, v, i) => s + Math.abs(v - pTest[i]), 0) / yTest.length;
  const rmse = Math.sqrt(ssRes / yTest.length);

  const currentPrice = closes.at(-1)!;
  const lastDateStr = bars.at(-1)!.date.slice(0, 10);
  const lastDate = new Date(`${lastDateStr}T00:00:00Z`);
  const baseDate = Number.isNaN(lastDate.getTime()) ? new Date() : lastDate;

  const forecast = closes.slice(-nDays).map((c, i) => {
    const p = predict(c);
    const d = new Date(baseDate.getTime() + (i + 1) * 86400000);
    return {
      day: i + 1,
      date: d.toISOString().slice(0, 10),
      predicted_usd: r(p, 4),
      predicted_inr: r(p * usdInr, 2),
      delta_percentage: r(currentPrice ? ((p - currentPrice) / currentPrice) * 100 : 0, 2),
    };
  });

  return {
    symbol,
    ticker: meta.ticker,
    name: meta.name,
    n_days: nDays,
    current_price_usd: r(currentPrice, 4),
    current_price_inr: r(currentPrice * usdInr, 2),
    usd_to_inr_rate: usdInr,
    forecast,
    metrics: {
      r2_score: r(r2, 4),
      r2_percentage: r(r2 * 100, 2),
      mae: r(mae, 4),
      rmse: r(rmse, 4),
      train_samples: trainIdx.length,
      test_samples: testIdx.length,
      model_type: "Linear Regression",
    },
    historical_close: bars.slice(-30).map(roundBar),
    disclaimer: DISCLAIMER_TEXT,
  };
}
