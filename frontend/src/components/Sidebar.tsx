import React, { useEffect } from 'react';
import { LayoutDashboard, Rows3, TrendingUp, Table2, BookOpen, X } from 'lucide-react';
import type { UserProfile } from '../types';
import { VIEWS, type ViewId } from '../lib/views';

const ICONS: Record<ViewId, React.ComponentType<{ className?: string; strokeWidth?: number }>> = {
  overview: LayoutDashboard,
  markets: Rows3,
  forecast: TrendingUp,
  history: Table2,
  about: BookOpen,
};

interface SidebarProps {
  view: ViewId;
  user: UserProfile | null;
  onLogout: () => void;
  onOpenLogin: () => void;
  usdInrRate: number;
  forecastDays: number;
  coinCount: number;
  selectedTicker: string;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => w[0])
      .join('')
      .slice(0, 2)
      .toUpperCase() || '?'
  );
}

const SidebarBody: React.FC<SidebarProps> = ({
  view,
  user,
  onLogout,
  onOpenLogin,
  usdInrRate,
  forecastDays,
  coinCount,
  selectedTicker,
}) => {
  // Small hints on the right of some links.
  const meta: Partial<Record<ViewId, string>> = {
    overview: selectedTicker,
    markets: String(coinCount || ''),
    forecast: `${forecastDays}d`,
  };

  const link = (id: ViewId) => {
    const item = VIEWS.find((v) => v.id === id)!;
    const Icon = ICONS[id];
    const active = view === id;
    return (
      <li key={id}>
        <a
          href={`#/${id}`}
          aria-current={active ? 'page' : undefined}
          className={`flex items-center gap-2.5 rounded-[3px] px-2.5 py-1.5 text-sm transition-colors ${
            active ? 'bg-card font-medium text-ink shadow-[0_0_0_1px_var(--color-rule)]' : 'text-ink-2 hover:bg-hover hover:text-ink'
          }`}
        >
          <Icon className={`h-4 w-4 ${active ? 'text-ink' : 'text-ink-3'}`} strokeWidth={1.75} />
          <span className="flex-1">{item.label}</span>
          {meta[id] && <span className="font-mono text-[11px] text-ink-3">{meta[id]}</span>}
        </a>
      </li>
    );
  };

  return (
    <>
      <a href="#/overview" className="block px-2.5">
        {/* pr-6 keeps the title clear of the close button in the phone menu */}
        <span className="block pr-6 font-serif text-[19px] leading-tight font-semibold">Crypto Price Forecaster</span>
        <span className="mt-1 block text-xs text-ink-3">Linear-regression forecasts, 8 coins</span>
      </a>

      <nav aria-label="Sections" className="mt-8">
        <p className="mb-1.5 px-2.5 text-xs text-ink-3">Prices</p>
        <ul className="space-y-0.5">{(['overview', 'markets'] as ViewId[]).map(link)}</ul>

        <p className="mt-6 mb-1.5 px-2.5 text-xs text-ink-3">Analysis</p>
        <ul className="space-y-0.5">{(['forecast', 'history'] as ViewId[]).map(link)}</ul>

        <p className="mt-6 mb-1.5 px-2.5 text-xs text-ink-3">Project</p>
        <ul className="space-y-0.5">{link('about')}</ul>
      </nav>

      <div className="mt-auto space-y-4 px-2.5 pt-8 text-[13px]">
        <p className="text-xs text-ink-3 tabular-nums">1 USD = ₹{usdInrRate.toFixed(2)}</p>
        <div className="border-t border-rule pt-4">
          {user ? (
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[3px] border border-rule bg-card text-xs font-semibold text-ink-2">
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate font-medium">{user.name}</p>
                <p className="truncate text-xs text-ink-3">{user.email}</p>
                <button
                  onClick={onLogout}
                  className="mt-1 text-xs text-ink-2 underline decoration-rule underline-offset-4 hover:text-ink hover:decoration-ink"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs text-ink-3">You're browsing as a guest.</p>
              <button
                onClick={onOpenLogin}
                className="mt-1 font-medium underline decoration-rule underline-offset-4 hover:decoration-ink"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Left-hand navigation. Fixed column on wide screens; on phones and tablets
 * it slides in from the left when the Menu button in the top bar is pressed.
 */
export const Sidebar: React.FC<SidebarProps> = (props) => {
  const { mobileOpen, onCloseMobile } = props;

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCloseMobile();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col overflow-y-auto border-r border-rule bg-side px-3 py-6 lg:flex">
        <SidebarBody {...props} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="absolute inset-0 bg-ink/30" onClick={onCloseMobile} />
          <div className="relative flex h-full w-64 max-w-[80%] flex-col overflow-y-auto bg-side px-3 py-6 shadow-xl">
            <button onClick={onCloseMobile} aria-label="Close menu" className="absolute top-5 right-3 p-1 text-ink-3 hover:text-ink">
              <X className="h-4 w-4" />
            </button>
            <SidebarBody {...props} />
          </div>
        </div>
      )}
    </>
  );
};
