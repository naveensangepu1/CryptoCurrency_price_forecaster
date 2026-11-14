import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { HistoricalPoint, TimeRange, CurrencyMode, ForecastPoint } from '../types';
import { TextTabs } from './TextTabs';
import {
  CHART_COLORS,
  MONTHS,
  money,
  compactMoney,
  parseDate,
  dayMonth,
  fullDate,
} from '../lib/format';

interface PriceChartProps {
  points: HistoricalPoint[];
  symbol: string;
  ticker: string;
  range: TimeRange;
  onRangeChange: (r: TimeRange) => void;
  currencyMode: CurrencyMode;
  usdInrRate: number;
  forecastPoints?: ForecastPoint[];
  isLoading: boolean;
}

interface Row {
  date: string;
  price: number | null;
  forecast: number | null;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
}

const RANGES: TimeRange[] = ['7D', '1M', '3M', '6M', '1Y', 'ALL'];

const PERIOD: Record<TimeRange, string> = {
  '7D': 'over the past week',
  '1M': 'over the past month',
  '3M': 'over the past three months',
  '6M': 'over the past six months',
  '1Y': 'over the past year',
  ALL: '',
};

const RESOLUTION: Record<TimeRange, string> = {
  '7D': 'hourly',
  '1M': 'daily',
  '3M': 'daily',
  '6M': 'daily',
  '1Y': 'daily',
  ALL: 'weekly',
};

// For the longer ranges, put one tick at the start of each day / month / year
// instead of letting the axis pick arbitrary dates.
function tickBucket(range: TimeRange, date: string): string | null {
  const d = parseDate(date);
  if (range === '7D') return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  if (range === '1Y') return `${d.getFullYear()}-${d.getMonth()}`;
  if (range === 'ALL') return `${d.getFullYear()}`;
  return null;
}

function tickLabel(range: TimeRange, date: string): string {
  if (!date) return '';
  const d = parseDate(date);
  if (range === 'ALL') return String(d.getFullYear());
  if (range === '1Y') return `${MONTHS[d.getMonth()]} ’${String(d.getFullYear()).slice(2)}`;
  return dayMonth(date);
}

export const PriceChart: React.FC<PriceChartProps> = ({
  points,
  ticker,
  range,
  onRangeChange,
  currencyMode,
  usdInrRate,
  forecastPoints,
  isLoading,
}) => {
  const [chartType, setChartType] = useState<'area' | 'line'>('area');
  const [showForecast, setShowForecast] = useState(true);

  const rate = currencyMode === 'INR' ? usdInrRate : 1;
  const hasForecast = !!forecastPoints && forecastPoints.length > 0;

  const data: Row[] = points.map((p) => ({
    date: p.date,
    price: p.close * rate,
    forecast: null,
    open: p.open * rate,
    high: p.high * rate,
    low: p.low * rate,
    volume: p.volume * rate,
  }));

  if (showForecast && hasForecast && data.length > 0) {
    // Start the dashed line from the last real close so the two connect.
    const last = data[data.length - 1];
    last.forecast = last.price;
    forecastPoints!.forEach((fp) => {
      data.push({
        date: fp.date,
        price: null,
        forecast: currencyMode === 'INR' ? fp.predicted_inr : fp.predicted_usd,
      });
    });
  }

  const values = data
    .flatMap((d) => [d.price, d.forecast])
    .filter((v): v is number => v !== null && Number.isFinite(v));
  const lo = values.length ? Math.min(...values) : 0;
  const hi = values.length ? Math.max(...values) : 100;
  const pad = (hi - lo) * 0.06 || hi * 0.02;
  const domain: [number, number] = [Math.max(0, lo - pad), hi + pad];

  let ticks: string[] | undefined;
  if (tickBucket(range, data[0]?.date ?? '') !== null) {
    ticks = [];
    let prev = '';
    for (const d of data) {
      const b = tickBucket(range, d.date)!;
      if (b !== prev) ticks.push(d.date);
      prev = b;
    }
  }

  const first = points.length ? points[0].close * rate : 0;
  const latest = points.length ? points[points.length - 1].close * rate : 0;
  const diff = latest - first;
  const diffPct = first > 0 ? (diff / first) * 100 : 0;
  const up = diff >= 0;
  const period = range === 'ALL' && points.length ? `since ${fullDate(points[0].date)}` : PERIOD[range];

  // Pick one format for the whole axis based on the top value, so a 0 at the
  // bottom doesn't come out as "₹0.0000" next to "₹25.26K".
  const yTick = (v: number) => (hi >= 1000 ? compactMoney(v, currencyMode) : money(v, currencyMode));

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const row: Row = payload[0].payload;
    const isForecast = row.price === null;
    return (
      <div className="min-w-[170px] rounded-[3px] border border-rule bg-card px-3 py-2 text-xs shadow-sm">
        <div className="mb-1 text-ink-3">
          {fullDate(row.date)}
          {isForecast && <span className="ml-1.5 text-fc">· forecast</span>}
        </div>
        {isForecast ? (
          <div className="font-mono text-sm text-fc tabular-nums">{money(row.forecast ?? 0, currencyMode)}</div>
        ) : (
          <table className="w-full font-mono tabular-nums">
            <tbody>
              <tr>
                <td className="pr-3 font-sans text-ink-3">Close</td>
                <td className="text-right text-sm text-ink">{money(row.price ?? 0, currencyMode)}</td>
              </tr>
              {row.open !== undefined && (
                <tr>
                  <td className="pr-3 font-sans text-ink-3">Open</td>
                  <td className="text-right text-ink-2">{money(row.open, currencyMode)}</td>
                </tr>
              )}
              {row.high !== undefined && row.low !== undefined && (
                <tr>
                  <td className="pr-3 font-sans text-ink-3">High / low</td>
                  <td className="text-right text-ink-2">
                    {compactMoney(row.high, currencyMode)} / {compactMoney(row.low, currencyMode)}
                  </td>
                </tr>
              )}
              {!!row.volume && (
                <tr>
                  <td className="pr-3 font-sans text-ink-3">Volume</td>
                  <td className="text-right text-ink-2">{compactMoney(row.volume, currencyMode)}</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    );
  };

  const xAxis = (
    <XAxis
      dataKey="date"
      ticks={ticks}
      minTickGap={28}
      tickFormatter={(v) => tickLabel(range, String(v))}
      stroke={CHART_COLORS.axis}
      tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
      tickLine={false}
      axisLine={{ stroke: CHART_COLORS.grid }}
    />
  );
  const yAxis = (
    <YAxis
      domain={domain}
      orientation="right"
      width={68}
      tickFormatter={yTick}
      stroke={CHART_COLORS.axis}
      tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
      tickLine={false}
      axisLine={false}
    />
  );
  const grid = <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />;
  const tooltip = <Tooltip content={renderTooltip} cursor={{ stroke: CHART_COLORS.axis, strokeDasharray: '2 3' }} />;
  const forecastLine = (
    <Line
      type="linear"
      dataKey="forecast"
      stroke={CHART_COLORS.forecast}
      strokeWidth={1.75}
      strokeDasharray="5 4"
      dot={{ r: 2, fill: CHART_COLORS.forecast, strokeWidth: 0 }}
      activeDot={{ r: 3.5 }}
      connectNulls={false}
      isAnimationActive={false}
    />
  );
  const margin = { top: 8, right: 0, left: 0, bottom: 0 };

  return (
    <section aria-labelledby="chart-heading">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-rule pb-2">
        <h3 id="chart-heading" className="font-serif text-xl font-semibold">
          Price history
        </h3>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          <TextTabs
            label="Time range"
            value={range}
            onChange={onRangeChange}
            options={RANGES.map((r) => ({ value: r, label: r === 'ALL' ? 'All' : r }))}
          />
          <span className="hidden h-4 w-px bg-rule sm:block" />
          <TextTabs
            label="Chart style"
            value={chartType}
            onChange={setChartType}
            options={[
              { value: 'area', label: 'Area' },
              { value: 'line', label: 'Line' },
            ]}
          />
          {hasForecast && (
            <label className="flex cursor-pointer items-center gap-1.5 text-ink-2 select-none">
              <input
                type="checkbox"
                checked={showForecast}
                onChange={(e) => setShowForecast(e.target.checked)}
                className="h-3.5 w-3.5 accent-fc"
              />
              Show forecast
            </label>
          )}
        </div>
      </div>

      {points.length > 1 && (
        <p className="mt-3 text-sm text-ink-2">
          {ticker} is{' '}
          <span className={up ? 'text-up' : 'text-down'}>
            {up ? 'up' : 'down'} {Math.abs(diffPct).toFixed(2)}%
          </span>{' '}
          <span className="font-mono text-[13px] tabular-nums text-ink-3">
            ({diff >= 0 ? '+' : '−'}
            {money(Math.abs(diff), currencyMode)})
          </span>{' '}
          {period}.
        </p>
      )}

      <div className="relative mt-4 h-72 w-full sm:h-[380px]">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-paper/70 text-sm text-ink-3">
            Loading {range === 'ALL' ? 'full history' : range} data…
          </div>
        )}

        {data.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-ink-3">
            No price data for this range.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            {chartType === 'area' ? (
              <AreaChart data={data} margin={margin}>
                <defs>
                  <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART_COLORS.line} stopOpacity={0.14} />
                    <stop offset="100%" stopColor={CHART_COLORS.line} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                {grid}
                {xAxis}
                {yAxis}
                {tooltip}
                <Area
                  type="linear"
                  dataKey="price"
                  stroke={CHART_COLORS.line}
                  strokeWidth={1.5}
                  fill="url(#priceFill)"
                  activeDot={{ r: 3.5 }}
                  isAnimationActive={false}
                />
                {forecastLine}
              </AreaChart>
            ) : (
              <LineChart data={data} margin={margin}>
                {grid}
                {xAxis}
                {yAxis}
                {tooltip}
                <Line
                  type="linear"
                  dataKey="price"
                  stroke={CHART_COLORS.line}
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ r: 3.5 }}
                  isAnimationActive={false}
                />
                {forecastLine}
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-ink-3">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-[2px] w-4 bg-line" /> Closing price
          </span>
          {hasForecast && showForecast && (
            <span className="flex items-center gap-1.5">
              <span className="inline-block w-4 border-t-2 border-dashed border-fc" /> Forecast, next{' '}
              {forecastPoints!.length} {forecastPoints!.length === 1 ? 'day' : 'days'}
            </span>
          )}
        </div>
        <span>
          {points.length} {RESOLUTION[range]} closes from Yahoo Finance
        </span>
      </div>
    </section>
  );
};
