import React from 'react';
import type { CoinInfo, MarketSummaryItem, CurrencyMode } from '../types';
import { money, compactMoney, signedPct } from '../lib/format';

interface CoinSelectorProps {
  coins: CoinInfo[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  activeSummary?: MarketSummaryItem;
  currencyMode: CurrencyMode;
  /** One-line version for the Forecast and Past data pages. */
  compact?: boolean;
}

/**
 * Heading for the selected coin: name, live price, 24h numbers.
 * On wide screens you pick coins from the watchlist on the right; on smaller
 * screens that list drops below the page, so there's a plain dropdown here too.
 */
export const CoinSelector: React.FC<CoinSelectorProps> = ({
  coins,
  selectedSymbol,
  onSelectCoin,
  activeSummary,
  currencyMode,
  compact = false,
}) => {
  const coin = coins.find((c) => c.symbol === selectedSymbol) || coins[0];
  if (!coin) return null;

  // The summary only carries a USD/INR pair for the current price,
  // so use that ratio to convert the other 24h numbers.
  const s = activeSummary;
  const ratio = s && s.current_price_usd ? s.current_price_inr / s.current_price_usd : 1;
  const conv = (usd: number) => (currencyMode === 'USD' ? usd : usd * ratio);
  const up = (s?.price_change_percentage_24h ?? 0) >= 0;
  const price = s ? money(currencyMode === 'USD' ? s.current_price_usd : s.current_price_inr, currencyMode) : null;

  const picker = (
    <label className="text-xs text-ink-3 xl:hidden">
      <span className="mr-2">Coin</span>
      <select
        value={selectedSymbol}
        onChange={(e) => onSelectCoin(e.target.value)}
        className="rounded-[3px] border border-rule bg-card px-2 py-1.5 text-sm text-ink"
      >
        {coins.map((c) => (
          <option key={c.symbol} value={c.symbol}>
            {c.name} ({c.ticker})
          </option>
        ))}
      </select>
    </label>
  );

  if (compact) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-rule pb-4">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="h-2.5 w-2.5 self-center rounded-full" style={{ backgroundColor: coin.color }} />
          <h2 className="font-serif text-2xl font-semibold">{coin.name}</h2>
          <span className="text-sm text-ink-3">{coin.symbol}</span>
          {s && (
            <>
              <span className="font-mono text-lg tabular-nums">{price}</span>
              <span className={`font-mono text-sm tabular-nums ${up ? 'text-up' : 'text-down'}`}>
                {up ? '▲' : '▼'} {signedPct(s.price_change_percentage_24h)}
              </span>
            </>
          )}
        </div>
        {picker}
      </div>
    );
  }

  return (
    <section>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[13px] text-ink-3">{coin.category}</p>
          <h2 className="mt-0.5 font-serif text-4xl font-semibold tracking-tight">
            {coin.name}{' '}
            <span className="font-sans text-base font-normal tracking-normal text-ink-3">{coin.symbol}</span>
          </h2>
        </div>
        {picker}
      </div>

      {s && (
        <p className="mt-3 flex flex-wrap items-baseline gap-x-3">
          <span className="font-mono text-3xl font-medium tabular-nums">{price}</span>
          <span className={`font-mono text-sm tabular-nums ${up ? 'text-up' : 'text-down'}`}>
            {up ? '▲' : '▼'} {signedPct(s.price_change_percentage_24h)}{' '}
            <span className="font-sans text-ink-3">in the last 24h</span>
          </span>
        </p>
      )}

      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-2">{coin.description}</p>

      {s && (
        <dl className="mt-4 grid grid-cols-3 border-y border-rule text-sm sm:max-w-lg">
          <div className="py-2 pr-3">
            <dt className="text-xs text-ink-3">24h high</dt>
            <dd className="font-mono tabular-nums">{money(conv(s.high_24h), currencyMode)}</dd>
          </div>
          <div className="border-l border-rule py-2 px-3">
            <dt className="text-xs text-ink-3">24h low</dt>
            <dd className="font-mono tabular-nums">{money(conv(s.low_24h), currencyMode)}</dd>
          </div>
          <div className="border-l border-rule py-2 pl-3">
            <dt className="text-xs text-ink-3">24h volume</dt>
            <dd className="font-mono tabular-nums">{compactMoney(conv(s.volume_24h), currencyMode)}</dd>
          </div>
        </dl>
      )}
    </section>
  );
};
