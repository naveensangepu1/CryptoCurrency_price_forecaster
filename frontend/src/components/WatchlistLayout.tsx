import React from 'react';
import type { AppData } from '../types';
import { MarketOverview } from './MarketOverview';

interface WatchlistLayoutProps {
  data: AppData;
  children: React.ReactNode;
  /** Extra blocks under the watchlist. */
  aside?: React.ReactNode;
}

/**
 * Page body for the coin-specific pages: content on the left, watchlist on the right.
 * Below 1280px there isn't room for both next to the sidebar, so the watchlist moves under the content.
 */
export const WatchlistLayout: React.FC<WatchlistLayoutProps> = ({ data, children, aside }) => (
  <div className="grid gap-x-12 gap-y-12 xl:grid-cols-[minmax(0,1fr)_280px]">
    <div className="min-w-0 space-y-12">{children}</div>
    <aside className="space-y-10 xl:sticky xl:top-6 xl:self-start">
      <MarketOverview
        coins={data.marketSummary}
        selectedSymbol={data.selectedSymbol}
        onSelectCoin={data.onSelectCoin}
        currencyMode={data.currencyMode}
      />
      {aside}
    </aside>
  </div>
);
