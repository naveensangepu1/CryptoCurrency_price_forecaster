import React from 'react';
import type { AppData, TimeRange } from '../types';
import { WatchlistLayout } from '../components/WatchlistLayout';
import { CoinSelector } from '../components/CoinSelector';
import { HistoricalTable } from '../components/HistoricalTable';
import { TextTabs } from '../components/TextTabs';
import { money, compactMoney, signedPct, fullDate } from '../lib/format';

const RANGES: { value: TimeRange; label: string }[] = [
  { value: '7D', label: '7D' },
  { value: '1M', label: '1M' },
  { value: '3M', label: '3M' },
  { value: '6M', label: '6M' },
  { value: '1Y', label: '1Y' },
  { value: 'ALL', label: 'All' },
];

export const HistoryPage: React.FC<{ data: AppData }> = ({ data }) => {
  const mode = data.currencyMode;
  const rate = mode === 'INR' ? data.usdInrRate : 1;
  const pts = data.historicalPoints;

  let stats: React.ReactNode = null;
  if (pts.length > 1) {
    const high = pts.reduce((a, b) => (b.high > a.high ? b : a));
    const low = pts.reduce((a, b) => (b.low < a.low ? b : a));
    const first = pts[0].close;
    const last = pts[pts.length - 1].close;
    const pct = first ? ((last - first) / first) * 100 : 0;
    const volume = pts.reduce((sum, p) => sum + p.volume, 0);

    stats = (
      <dl className="grid grid-cols-2 border-b border-rule text-sm sm:grid-cols-4">
        <div className="py-3 pr-4">
          <dt className="text-xs text-ink-3">Highest</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums">{money(high.high * rate, mode)}</dd>
          <dd className="text-xs text-ink-3">{fullDate(high.date)}</dd>
        </div>
        <div className="border-l border-rule py-3 px-4">
          <dt className="text-xs text-ink-3">Lowest</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums">{money(low.low * rate, mode)}</dd>
          <dd className="text-xs text-ink-3">{fullDate(low.date)}</dd>
        </div>
        <div className="border-t border-rule py-3 pr-4 sm:border-t-0 sm:border-l sm:px-4">
          <dt className="text-xs text-ink-3">Change</dt>
          <dd className={`mt-0.5 font-mono text-lg tabular-nums ${pct >= 0 ? 'text-up' : 'text-down'}`}>
            {signedPct(pct)}
          </dd>
          <dd className="text-xs text-ink-3">
            {money(first * rate, mode)} → {money(last * rate, mode)}
          </dd>
        </div>
        <div className="border-t border-l border-rule py-3 px-4 sm:border-t-0">
          <dt className="text-xs text-ink-3">Total volume</dt>
          <dd className="mt-0.5 font-mono text-lg tabular-nums">{compactMoney(volume * rate, mode)}</dd>
          <dd className="text-xs text-ink-3">over {pts.length} rows</dd>
        </div>
      </dl>
    );
  }

  return (
    <WatchlistLayout data={data}>
      <CoinSelector
        compact
        coins={data.coins}
        selectedSymbol={data.selectedSymbol}
        onSelectCoin={data.onSelectCoin}
        activeSummary={data.activeSummary}
        currencyMode={mode}
      />

      <section aria-labelledby="summary-heading" className={data.isLoadingHistory ? 'opacity-50' : ''}>
        <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-rule pb-2">
          <h3 id="summary-heading" className="font-serif text-xl font-semibold">
            Summary
          </h3>
          <div className="text-[13px]">
            <TextTabs label="Time range" value={data.selectedRange} onChange={data.onRangeChange} options={RANGES} />
          </div>
        </div>
        {stats ?? <p className="mt-3 text-sm text-ink-3">Not enough rows to summarise.</p>}
        <p className="mt-2 text-xs text-ink-3">
          {data.selectedRange === '7D'
            ? 'The 7D range uses hourly rows.'
            : data.selectedRange === 'ALL'
              ? 'The All range uses weekly rows.'
              : 'One row per day.'}{' '}
          The same range is used on the Overview chart.
        </p>
      </section>

      <div className={data.isLoadingHistory ? 'opacity-50' : ''}>
        <HistoricalTable points={pts} ticker={data.ticker} currencyMode={mode} usdInrRate={data.usdInrRate} />
      </div>
    </WatchlistLayout>
  );
};
