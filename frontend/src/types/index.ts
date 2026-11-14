export interface CoinInfo {
  symbol: string;
  ticker: string;
  name: string;
  color: string;
  category: string;
  description: string;
}

export interface MarketSummaryItem {
  symbol: string;
  ticker: string;
  name: string;
  color: string;
  category: string;
  current_price_usd: float;
  current_price_inr: float;
  price_change_24h: float;
  price_change_percentage_24h: float;
  high_24h: float;
  low_24h: float;
  volume_24h: float;
  sparkline: number[];
}

export type float = number;

export interface MarketSummaryResponse {
  coins: MarketSummaryItem[];
  usd_to_inr_rate: number;
  last_updated: string;
}

export interface HistoricalPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface HistoricalStatistics {
  period_change?: number;
  period_change_percentage?: number;
  period_high?: number;
  period_low?: number;
  total_volume?: number;
  data_points?: number;
}

export interface HistoricalDataResponse {
  symbol: string;
  ticker: string;
  name: string;
  range: string;
  points: HistoricalPoint[];
  latest_price_usd: number;
  latest_price_inr: number;
  usd_to_inr_rate: number;
  statistics: HistoricalStatistics;
}

export interface ForecastPoint {
  day: number;
  date: string;
  predicted_usd: number;
  predicted_inr: number;
  delta_percentage: number;
}

export interface ForecastMetrics {
  r2_score: number;
  r2_percentage: number;
  mae: number;
  rmse: number;
  train_samples: number;
  test_samples: number;
  model_type: string;
}

export interface ForecastResponse {
  symbol: string;
  ticker: string;
  name: string;
  n_days: number;
  current_price_usd: number;
  current_price_inr: number;
  usd_to_inr_rate: number;
  forecast: ForecastPoint[];
  metrics: ForecastMetrics;
  historical_close: HistoricalPoint[];
  disclaimer: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  token: string;
  created_at: string;
}

export interface AuthResponse {
  user: UserProfile;
  message: string;
}

export type CurrencyMode = 'USD' | 'INR';
export type TimeRange = '7D' | '1M' | '3M' | '6M' | '1Y' | 'ALL';

/** Everything the pages need from App, passed down as one object. */
export interface AppData {
  coins: CoinInfo[];
  marketSummary: MarketSummaryItem[];
  selectedSymbol: string;
  onSelectCoin: (symbol: string) => void;
  activeSummary?: MarketSummaryItem;
  ticker: string;
  currencyMode: CurrencyMode;
  usdInrRate: number;
  lastUpdated: string | null;
  historicalPoints: HistoricalPoint[];
  selectedRange: TimeRange;
  onRangeChange: (range: TimeRange) => void;
  isLoadingHistory: boolean;
  forecastData: ForecastResponse | null;
  forecastDays: number;
  onForecastDaysChange: (days: number) => void;
  onRunForecast: (days: number) => void;
  isLoadingForecast: boolean;
}
