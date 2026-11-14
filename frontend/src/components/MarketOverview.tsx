import React from 'react';
import type { MarketSummaryItem, CurrencyMode } from '../types';
import { money, signedPct } from '../lib/format';
import { Sparkline } from './Sparkline';

interface MarketOverviewProps {
  coins: MarketSummaryItem[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  currencyMode: CurrencyMode;
}

export const MarketOverview: React.FC<MarketOverviewProps> = ({
  coins,
  selectedSymbol,
  onSelectCoin,
  currencyMode,
}) => {
  return (
    <section aria-labelledby="watchlist-heading">
      <div className="flex items-baseline justify-between border-b border-ink pb-1.5">
        <h3 id="watchlist-heading" className="font-serif text-lg font-semibold">
          Watchlist
        </h3>
        <span className="text-xs text-ink-3">24h</span>
      </div>

      {coins.length === 0 ? (
        <p className="py-4 text-sm text-ink-3">No prices yet.</p>
      ) : (
        <ul className="divide-y divide-rule">
          {coins.map((coin) => {
            const selected = coin.symbol === selectedSymbol;
            const up = coin.price_change_percentage_24h >= 0;
            const price = currencyMode === 'USD' ? coin.current_price_usd : coin.current_price_inr;

            return (
              <li key={coin.symbol}>
                <button
                  onClick={() => onSelectCoin(coin.symbol)}
                  aria-current={selected ? 'true' : undefined}
                  className={`grid w-full grid-cols-[minmax(0,1fr)_56px_auto] items-center gap-3 border-l-2 py-2.5 pr-1 pl-2.5 text-left transition-colors ${
                    selected ? 'border-ink bg-hover' : 'border-transparent hover:bg-hover/60'
                  }`}
                >
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 text-sm font-semibold">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: coin.color }} />
                      {coin.ticker}
                    </span>
                    <span className="block truncate text-xs text-ink-3">{coin.name}</span>
                  </span>

                  <Sparkline points={coin.sparkline} up={up} />

                  <span className="text-right">
                    <span className="block font-mono text-[13px] tabular-nums">{money(price, currencyMode)}</span>
                    <span className={`block font-mono text-xs tabular-nums ${up ? 'text-up' : 'text-down'}`}>
                      {signedPct(coin.price_change_percentage_24h)}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
      <a
        href="#/markets"
        className="mt-3 inline-block text-[13px] text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
      >
        Compare all markets
      </a>
    </section>
  );
};
