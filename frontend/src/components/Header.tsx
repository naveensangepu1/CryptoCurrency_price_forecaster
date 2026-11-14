import React from 'react';
import { Menu, RefreshCw } from 'lucide-react';
import type { CurrencyMode } from '../types';

interface HeaderProps {
  title: string;
  description: string;
  currencyMode: CurrencyMode;
  onToggleCurrency: (mode: CurrencyMode) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  lastUpdated?: string | null;
  onOpenMenu: () => void;
}

/** Top bar above each page: page title on the left, currency and refresh on the right. */
export const Header: React.FC<HeaderProps> = ({
  title,
  description,
  currencyMode,
  onToggleCurrency,
  onRefresh,
  isRefreshing,
  lastUpdated,
  onOpenMenu,
}) => {
  const updatedAt = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <header className="border-b border-rule">
      {/* Phones and tablets: the sidebar is hidden, so show the name and a menu button. */}
      <div className="flex items-center justify-between border-b border-rule px-4 py-3 sm:px-6 lg:hidden">
        <a href="#/overview" className="font-serif text-lg font-semibold">
          Crypto Price Forecaster
        </a>
        <button onClick={onOpenMenu} className="inline-flex items-center gap-1.5 text-sm text-ink-2 hover:text-ink">
          <Menu className="h-4 w-4" />
          Menu
        </button>
      </div>

      <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-x-8 gap-y-3 px-4 py-5 sm:px-6 lg:px-10">
        <div>
          <h1 className="font-serif text-[26px] leading-tight font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-[13px] text-ink-3">{description}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[13px]">
          {updatedAt && <span className="text-xs text-ink-3 tabular-nums">Prices as of {updatedAt}</span>}

          <div className="inline-flex rounded-[3px] border border-rule text-xs" role="group" aria-label="Currency">
            {(['USD', 'INR'] as CurrencyMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onToggleCurrency(mode)}
                aria-pressed={currencyMode === mode}
                className={`px-2.5 py-1 font-medium transition-colors ${
                  currencyMode === mode ? 'bg-ink text-paper' : 'text-ink-2 hover:bg-hover'
                }`}
              >
                {mode === 'USD' ? '$ USD' : '₹ INR'}
              </button>
            ))}
          </div>

          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 text-ink-2 hover:text-ink disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </div>
    </header>
  );
};
