import React, { useState } from 'react';
import type { AppData, MarketSummaryItem } from '../types';
import { Sparkline } from '../components/Sparkline';
import { money, compactMoney, signedPct } from '../lib/format';

type SortKey = 'name' | 'price' | 'change' | 'volume';

interface MarketsPageProps {
  data: AppData;
  onOpenCoin: (symbol: string) => void;
}

const sortValue = (c: MarketSummaryItem, key: SortKey): string | number => {
  switch (key) {
    case 'name':
      return c.name.toLowerCase();
    case 'price':
      return c.current_price_usd;
    case 'change':
      return c.price_change_percentage_24h;
    default:
      return c.volume_24h;
  }
};

export const MarketsPage: React.FC<MarketsPageProps> = ({ data, onOpenCoin }) => {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'volume', desc: true });
  const mode = data.currencyMode;
  const coins = data.marketSummary;

  const rows = [...coins].sort((a, b) => {
    const va = sortValue(a, sort.key);
    const vb = sortValue(b, sort.key);
    const cmp = va < vb ? -1 : va > vb ? 1 : 0;
    return sort.desc ? -cmp : cmp;
  });

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, desc: !s.desc } : { key, desc: key !== 'name' }));

  const upCount = coins.filter((c) => c.price_change_percentage_24h >= 0).length;
  const mover = coins.reduce<MarketSummaryItem | null>(
    (best, c) =>
      !best || Math.abs(c.price_change_percentage_24h) > Math.abs(best.price_change_percentage_24h) ? c : best,
    null,
  );

  // Header cell that sorts the table when clicked. A plain function rather than a
  // nested component so the button keeps keyboard focus across re-renders.
  const sortTh = (k: SortKey, label: string, className = '') => {
    const active = sort.key === k;
    return (
      <th
        aria-sort={active ? (sort.desc ? 'descending' : 'ascending') : 'none'}
        className={`py-2 pr-4 font-normal ${className}`}
      >
        <button onClick={() => toggle(k)} className={`hover:text-ink ${active ? 'text-ink' : ''}`}>
          {label}
          <span className="ml-1 inline-block w-2 text-[10px]">{active ? (sort.desc ? '↓' : '↑') : ''}</span>
        </button>
      </th>
    );
  };

  if (!coins.length) return <p className="text-sm text-ink-3">No market data yet.</p>;

  return (
    <div>
      <p className="max-w-3xl text-[15px] leading-relaxed">
        {upCount === 0
          ? `All ${coins.length} coins are down`
          : upCount === coins.length
            ? `All ${coins.length} coins are up`
            : `${upCount} of ${coins.length} coins are up`}{' '}
        over the last 24 hours.
        {mover && (
          <>
            {' '}
            The biggest move is {mover.name} at{' '}
            <span className={mover.price_change_percentage_24h >= 0 ? 'text-up' : 'text-down'}>
              {signedPct(mover.price_change_percentage_24h)}
            </span>
            .
          </>
        )}
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink text-left text-xs text-ink-3">
              <th className="w-8 py-2 pr-2 font-normal">#</th>
              {sortTh('name', 'Coin')}
              <th className="hidden py-2 pr-4 font-normal md:table-cell">Category</th>
              {sortTh('price', 'Price', 'text-right')}
              {sortTh('change', '24h', 'text-right')}
              <th className="hidden py-2 pr-4 text-right font-normal lg:table-cell">24h high</th>
              <th className="hidden py-2 pr-4 text-right font-normal lg:table-cell">24h low</th>
              {sortTh('volume', 'Volume', 'hidden text-right sm:table-cell')}
              <th className="hidden py-2 text-right font-normal md:table-cell">Last 24h</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c, i) => {
              const ratio = c.current_price_usd ? c.current_price_inr / c.current_price_usd : 1;
              const conv = (usd: number) => (mode === 'USD' ? usd : usd * ratio);
              const up = c.price_change_percentage_24h >= 0;
              const selected = c.symbol === data.selectedSymbol;
              return (
                <tr
                  key={c.symbol}
                  onClick={() => onOpenCoin(c.symbol)}
                  className={`cursor-pointer border-b border-rule/70 ${selected ? 'bg-hover' : 'hover:bg-hover/50'}`}
                >
                  <td className="py-3 pr-2 font-mono text-xs text-ink-3">{i + 1}</td>
                  <td className="py-3 pr-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenCoin(c.symbol);
                      }}
                      className="flex items-center gap-2 text-left"
                    >
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-ink-3">{c.ticker}</span>
                    </button>
                  </td>
                  <td className="hidden py-3 pr-4 text-[13px] text-ink-3 md:table-cell">{c.category}</td>
                  <td className="py-3 pr-4 text-right font-mono tabular-nums">
                    {money(mode === 'USD' ? c.current_price_usd : c.current_price_inr, mode)}
                  </td>
                  <td className={`py-3 pr-4 text-right font-mono tabular-nums ${up ? 'text-up' : 'text-down'}`}>
                    {signedPct(c.price_change_percentage_24h)}
                  </td>
                  <td className="hidden py-3 pr-4 text-right font-mono text-ink-2 tabular-nums lg:table-cell">
                    {money(conv(c.high_24h), mode)}
                  </td>
                  <td className="hidden py-3 pr-4 text-right font-mono text-ink-2 tabular-nums lg:table-cell">
                    {money(conv(c.low_24h), mode)}
                  </td>
                  <td className="hidden py-3 pr-4 text-right font-mono text-ink-2 tabular-nums sm:table-cell">
                    {compactMoney(conv(c.volume_24h), mode)}
                  </td>
                  <td className="hidden py-3 text-right md:table-cell">
                    <span className="inline-block align-middle">
                      <Sparkline points={c.sparkline} up={up} width={72} height={22} />
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-3">
        Click a coin to open its chart and forecast. Click a column heading to sort. Volume is the 24h traded value
        reported by Yahoo Finance.
      </p>
    </div>
  );
};
