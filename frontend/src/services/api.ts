import type {
  CoinInfo,
  MarketSummaryResponse,
  HistoricalDataResponse,
  ForecastResponse,
  TimeRange,
  AuthResponse
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }
  return response.json();
}

export const api = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse<AuthResponse>(res);
  },

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    return handleResponse<AuthResponse>(res);
  },

  async getCoins(): Promise<CoinInfo[]> {
    const res = await fetch(`${API_BASE_URL}/api/coins`);
    return handleResponse<CoinInfo[]>(res);
  },

  async getMarketOverview(): Promise<MarketSummaryResponse> {
    const res = await fetch(`${API_BASE_URL}/api/market/overview`);
    return handleResponse<MarketSummaryResponse>(res);
  },

  async getHistoricalData(symbol: string, range: TimeRange = '1Y'): Promise<HistoricalDataResponse> {
    const res = await fetch(`${API_BASE_URL}/api/market/historical/${encodeURIComponent(symbol)}?range=${range}`);
    return handleResponse<HistoricalDataResponse>(res);
  },

  async getForecast(symbol: string, days: number = 7): Promise<ForecastResponse> {
    const res = await fetch(`${API_BASE_URL}/api/forecast/${encodeURIComponent(symbol)}?days=${days}`);
    return handleResponse<ForecastResponse>(res);
  },

  async getUsdInrRate(): Promise<{ base: string; target: string; rate: number; timestamp: string }> {
    const res = await fetch(`${API_BASE_URL}/api/rate/usd-inr`);
    return handleResponse<{ base: string; target: string; rate: number; timestamp: string }>(res);
  }
};
