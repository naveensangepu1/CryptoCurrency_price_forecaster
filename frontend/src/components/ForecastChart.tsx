import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import type { ForecastResponse, CurrencyMode } from '../types';
import { CHART_COLORS, money, compactMoney, dayMonth, fullDate } from '../lib/format';

interface ForecastChartProps {
  forecast: ForecastResponse;
  currencyMode: CurrencyMode;
  usdInrRate: number;
}

interface Row {
  date: string;
  price: number | null;
  forecast: number | null;
}

/** Last 30 daily closes followed by the forecast, with a marker at the latest close. */
export const ForecastChart: React.FC<ForecastChartProps> = ({ forecast, currencyMode, usdInrRate }) => {
  const rate = currencyMode === 'INR' ? usdInrRate : 1;

  const data: Row[] = forecast.historical_close.map((p) => ({ date: p.date, price: p.close * rate, forecast: null }));
  const lastDate = data.length ? data[data.length - 1].date : undefined;
  if (data.length) data[data.length - 1].forecast = data[data.length - 1].price;
  forecast.forecast.forEach((fp) =>
    data.push({
      date: fp.date,
      price: null,
      forecast: currencyMode === 'INR' ? fp.predicted_inr : fp.predicted_usd,
    }),
  );

  const values = data.flatMap((d) => [d.price, d.forecast]).filter((v): v is number => v !== null);
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const pad = (hi - lo) * 0.08 || hi * 0.02;
  const yTick = (v: number) => (hi >= 1000 ? compactMoney(v, currencyMode) : money(v, currencyMode));

  const renderTooltip = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null;
    const row: Row = payload[0].payload;
    const isForecast = row.price === null;
    return (
      <div className="rounded-[3px] border border-rule bg-card px-3 py-2 text-xs shadow-sm">
        <div className="text-ink-3">
          {fullDate(row.date)}
          {isForecast && <span className="ml-1.5 text-fc">· forecast</span>}
        </div>
        <div className={`mt-0.5 font-mono text-sm tabular-nums ${isForecast ? 'text-fc' : 'text-ink'}`}>
          {money((isForecast ? row.forecast : row.price) ?? 0, currencyMode)}
        </div>
      </div>
    );
  };

  return (
    <figure>
      <div className="h-64 w-full sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 16, right: 0, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={CHART_COLORS.grid} vertical={false} />
            <XAxis
              dataKey="date"
              minTickGap={32}
              tickFormatter={(v) => dayMonth(String(v))}
              stroke={CHART_COLORS.axis}
              tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={{ stroke: CHART_COLORS.grid }}
            />
            <YAxis
              domain={[Math.max(0, lo - pad), hi + pad]}
              orientation="right"
              width={68}
              tickFormatter={yTick}
              stroke={CHART_COLORS.axis}
              tick={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip content={renderTooltip} cursor={{ stroke: CHART_COLORS.axis, strokeDasharray: '2 3' }} />
            {lastDate && (
              <ReferenceLine
                x={lastDate}
                stroke={CHART_COLORS.axis}
                strokeDasharray="2 3"
                label={{ value: 'latest close', position: 'insideTopLeft', fontSize: 11, fill: CHART_COLORS.axis, dy: -14 }}
              />
            )}
            <Line
              type="linear"
              dataKey="price"
              stroke={CHART_COLORS.line}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 3.5 }}
              isAnimationActive={false}
            />
            <Line
              type="linear"
              dataKey="forecast"
              stroke={CHART_COLORS.forecast}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              dot={{ r: 2.5, fill: CHART_COLORS.forecast, strokeWidth: 0 }}
              activeDot={{ r: 3.5 }}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="mt-2 text-xs leading-relaxed text-ink-3">
        Solid: the last {forecast.historical_close.length} daily closes. Dashed: the forecast. If the dashed line
        jumps away from today's price, that's the model, not a glitch: each forecast day is computed from a different
        past close, not from the day before it.
      </figcaption>
    </figure>
  );
};
