import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { ErrorAlert } from './components/ErrorAlert';
import { OverviewPage } from './pages/OverviewPage';
import { MarketsPage } from './pages/MarketsPage';
import { ForecastPage } from './pages/ForecastPage';
import { HistoryPage } from './pages/HistoryPage';
import { AboutPage } from './pages/AboutPage';
import { api } from './services/api';
import { VIEWS, viewFromHash, type ViewId } from './lib/views';
import type {
  AppData,
  CoinInfo,
  MarketSummaryItem,
  HistoricalPoint,
  ForecastResponse,
  CurrencyMode,
  TimeRange,
  UserProfile,
} from './types';

export const App: React.FC = () => {
  // Which sidebar section is open. Kept in the URL hash (#/markets etc.).
  const [view, setView] = useState<ViewId>(() => viewFromHash(window.location.hash));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHashChange = () => {
      setView(viewFromHash(window.location.hash));
      setMenuOpen(false);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const closeMenu = useCallback(() => setMenuOpen(false), []);

  // Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('crypto_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [isGuest, setIsGuest] = useState<boolean>(false);

  // Market & Forecast States
  const [coins, setCoins] = useState<CoinInfo[]>([]);
  const [marketSummary, setMarketSummary] = useState<MarketSummaryItem[]>([]);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('BTC-USD');
  const [selectedRange, setSelectedRange] = useState<TimeRange>('1Y');
  const [historicalPoints, setHistoricalPoints] = useState<HistoricalPoint[]>([]);
  const [forecastData, setForecastData] = useState<ForecastResponse | null>(null);
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [currencyMode, setCurrencyMode] = useState<CurrencyMode>('USD');
  const [usdInrRate, setUsdInrRate] = useState<number>(84.56);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const [isLoadingMarket, setIsLoadingMarket] = useState<boolean>(true);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // 1. Initial Load: Coins, Market Overview, Rate
  const initApp = useCallback(async () => {
    setIsLoadingMarket(true);
    setError(null);
    try {
      const [coinsRes, overviewRes, rateRes] = await Promise.allSettled([
        api.getCoins(),
        api.getMarketOverview(),
        api.getUsdInrRate(),
      ]);

      if (coinsRes.status === 'fulfilled') {
        setCoins(coinsRes.value);
      }
      if (overviewRes.status === 'fulfilled') {
        setMarketSummary(overviewRes.value.coins);
        setLastUpdated(overviewRes.value.last_updated || null);
        if (overviewRes.value.usd_to_inr_rate) {
          setUsdInrRate(overviewRes.value.usd_to_inr_rate);
        }
      }
      if (rateRes.status === 'fulfilled' && rateRes.value.rate) {
        setUsdInrRate(rateRes.value.rate);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize market data.');
    } finally {
      setIsLoadingMarket(false);
    }
  }, []);

  useEffect(() => {
    // Only fetch data if authenticated or continuing as guest
    if (currentUser || isGuest) {
      initApp();
    }
  }, [currentUser, isGuest, initApp]);

  // 2. Fetch Historical Data when symbol or range changes
  const loadHistoricalData = useCallback(async (symbol: string, range: TimeRange) => {
    setIsLoadingHistory(true);
    try {
      const res = await api.getHistoricalData(symbol, range);
      setHistoricalPoints(res.points);
      if (res.usd_to_inr_rate) {
        setUsdInrRate(res.usd_to_inr_rate);
      }
    } catch (err: any) {
      console.error('Failed to load historical data:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    if ((currentUser || isGuest) && selectedSymbol) {
      loadHistoricalData(selectedSymbol, selectedRange);
    }
  }, [currentUser, isGuest, selectedSymbol, selectedRange, loadHistoricalData]);

  // 3. Fetch Forecast when symbol or forecastDays changes
  const runForecast = useCallback(async (days: number, symbol?: string) => {
    const sym = symbol || selectedSymbol;
    setIsLoadingForecast(true);
    try {
      const res = await api.getForecast(sym, days);
      setForecastData(res);
      if (res.usd_to_inr_rate) {
        setUsdInrRate(res.usd_to_inr_rate);
      }
    } catch (err: any) {
      console.error('Failed to generate forecast:', err);
    } finally {
      setIsLoadingForecast(false);
    }
  }, [selectedSymbol]);

  useEffect(() => {
    if ((currentUser || isGuest) && selectedSymbol) {
      runForecast(forecastDays, selectedSymbol);
    }
  }, [currentUser, isGuest, selectedSymbol, runForecast, forecastDays]);

  // Handle Login & Logout
  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem('crypto_user', JSON.stringify(user));
    } catch {
      // Ignore storage errors
    }
    setIsGuest(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsGuest(false);
    try {
      localStorage.removeItem('crypto_user');
    } catch {
      // Ignore storage errors
    }
  };

  const handleOpenLogin = () => {
    setCurrentUser(null);
    setIsGuest(false);
  };

  const handleContinueAsGuest = () => {
    setIsGuest(true);
  };

  // If user is not authenticated and not in guest mode, show the Login Page!
  if (!currentUser && !isGuest) {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onContinueAsGuest={handleContinueAsGuest}
      />
    );
  }

  // Handle coin selection
  const handleSelectCoin = (symbol: string) => {
    setSelectedSymbol(symbol);
  };

  // Handle manual refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        initApp(),
        loadHistoricalData(selectedSymbol, selectedRange),
        runForecast(forecastDays, selectedSymbol),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const activeCoinMeta = coins.find((c) => c.symbol === selectedSymbol);
  const activeSummary = marketSummary.find((s) => s.symbol === selectedSymbol);
  const ticker = activeCoinMeta?.ticker || selectedSymbol.split('-')[0];
  const viewInfo = VIEWS.find((v) => v.id === view)!;

  const data: AppData = {
    coins,
    marketSummary,
    selectedSymbol,
    onSelectCoin: handleSelectCoin,
    activeSummary,
    ticker,
    currencyMode,
    usdInrRate,
    lastUpdated,
    historicalPoints,
    selectedRange,
    onRangeChange: setSelectedRange,
    isLoadingHistory,
    forecastData,
    forecastDays,
    onForecastDaysChange: setForecastDays,
    onRunForecast: (d) => runForecast(d),
    isLoadingForecast,
  };

  let page: React.ReactNode;
  switch (view) {
    case 'markets':
      page = (
        <MarketsPage
          data={data}
          onOpenCoin={(symbol) => {
            setSelectedSymbol(symbol);
            window.location.hash = '/overview';
          }}
        />
      );
      break;
    case 'forecast':
      page = <ForecastPage data={data} />;
      break;
    case 'history':
      page = <HistoryPage data={data} />;
      break;
    case 'about':
      page = <AboutPage coins={coins} />;
      break;
    default:
      page = <OverviewPage data={data} />;
  }

  // The About page is static text, so it doesn't need to wait for prices.
  const waitingForPrices = view !== 'about' && isLoadingMarket && marketSummary.length === 0;

  return (
    <div className="min-h-screen bg-paper text-ink lg:flex">
      <Sidebar
        view={view}
        user={currentUser}
        onLogout={handleLogout}
        onOpenLogin={handleOpenLogin}
        usdInrRate={usdInrRate}
        forecastDays={forecastDays}
        coinCount={marketSummary.length}
        selectedTicker={ticker}
        mobileOpen={menuOpen}
        onCloseMobile={closeMenu}
      />

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <Header
          title={viewInfo.label}
          description={viewInfo.description}
          currencyMode={currencyMode}
          onToggleCurrency={setCurrencyMode}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-10">
          {error && <ErrorAlert message={error} onRetry={handleRefresh} />}
          {waitingForPrices ? <LoadingSkeleton /> : page}
        </main>

        <footer className="mt-16 border-t border-rule">
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-6 text-xs text-ink-3 sm:flex-row sm:justify-between sm:px-6 lg:px-10">
            <p>Prices from Yahoo Finance. Forecasts are for learning, not for trading.</p>
            <p>
              <a href="#/about" className="hover:text-ink">
                About the model
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
