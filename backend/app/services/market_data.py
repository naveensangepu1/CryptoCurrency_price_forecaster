import time
import logging
from datetime import datetime, timezone
from typing import Dict, Any, List, Optional
import yfinance as yf
import pandas as pd
import numpy as np

from ..config import SUPPORTED_COINS, VALID_RANGES, DEFAULT_USD_INR_RATE
from .currency import get_usd_to_inr_rate
from ..models.schemas import MarketSummaryItem, HistoricalPoint

logger = logging.getLogger(__name__)

# In-memory cache for market data: { cache_key: { "data": ..., "timestamp": float } }
_market_cache: Dict[str, Dict[str, Any]] = {}
CACHE_TTL = 300  # 5 minutes

def _get_from_cache(key: str) -> Optional[Any]:
    entry = _market_cache.get(key)
    if entry and (time.time() - entry["timestamp"] < CACHE_TTL):
        return entry["data"]
    return None

def _set_in_cache(key: str, data: Any):
    _market_cache[key] = {
        "data": data,
        "timestamp": time.time()
    }

def fetch_ticker_history(symbol: str, range_key: str = "1Y") -> pd.DataFrame:
    """Fetch historical OHLC data for a symbol given a valid range key."""
    range_config = VALID_RANGES.get(range_key.upper(), VALID_RANGES["1Y"])
    cache_key = f"hist_{symbol}_{range_key.upper()}"
    
    cached_df = _get_from_cache(cache_key)
    if cached_df is not None:
        return cached_df

    yf_symbol = SUPPORTED_COINS.get(symbol, {}).get("yf_symbol", symbol)

    try:
        ticker = yf.Ticker(yf_symbol)
        df = ticker.history(period=range_config["period"], interval=range_config["interval"])
        
        if df.empty:
            # Fallback attempt with default 1y
            df = ticker.history(period="1y", interval="1d")
            
        if not df.empty:
            df.reset_index(inplace=True)
            # Ensure Date column is string ISO
            if "Date" in df.columns:
                df["Date"] = pd.to_datetime(df["Date"]).dt.strftime("%Y-%m-%d %H:%M" if range_key == "7D" else "%Y-%m-%d")
            elif "Datetime" in df.columns:
                df["Date"] = pd.to_datetime(df["Datetime"]).dt.strftime("%Y-%m-%d %H:%M")
            _set_in_cache(cache_key, df)
            return df
    except Exception as e:
        logger.error(f"Error fetching historical data for {symbol} ({range_key}): {e}")

    # Fallback empty dataframe
    return pd.DataFrame()

def get_coin_historical_data(symbol: str, range_key: str = "1Y") -> Dict[str, Any]:
    """Return structured historical points and statistics for a given coin."""
    if symbol not in SUPPORTED_COINS:
        raise ValueError(f"Coin symbol '{symbol}' is not supported.")

    coin_meta = SUPPORTED_COINS[symbol]
    df = fetch_ticker_history(symbol, range_key)
    usd_inr = get_usd_to_inr_rate()

    if df.empty:
        return {
            "symbol": symbol,
            "ticker": coin_meta["ticker"],
            "name": coin_meta["name"],
            "range": range_key,
            "points": [],
            "latest_price_usd": 0.0,
            "latest_price_inr": 0.0,
            "usd_to_inr_rate": usd_inr,
            "statistics": {}
        }

    points: List[HistoricalPoint] = []
    for _, row in df.iterrows():
        try:
            points.append(
                HistoricalPoint(
                    date=str(row["Date"]),
                    open=round(float(row.get("Open", 0.0)), 4),
                    high=round(float(row.get("High", 0.0)), 4),
                    low=round(float(row.get("Low", 0.0)), 4),
                    close=round(float(row.get("Close", 0.0)), 4),
                    volume=round(float(row.get("Volume", 0.0)), 2),
                )
            )
        except Exception:
            continue

    latest_close = points[-1].close if points else 0.0
    first_close = points[0].close if points else latest_close
    period_change = latest_close - first_close
    period_change_pct = (period_change / first_close * 100.0) if first_close != 0 else 0.0

    highs = [p.high for p in points if p.high > 0]
    lows = [p.low for p in points if p.low > 0]
    volumes = [p.volume for p in points]

    stats = {
        "period_change": round(period_change, 4),
        "period_change_percentage": round(period_change_pct, 2),
        "period_high": round(max(highs), 4) if highs else latest_close,
        "period_low": round(min(lows), 4) if lows else latest_close,
        "total_volume": round(sum(volumes), 2),
        "data_points": len(points)
    }

    return {
        "symbol": symbol,
        "ticker": coin_meta["ticker"],
        "name": coin_meta["name"],
        "range": range_key,
        "points": points,
        "latest_price_usd": latest_close,
        "latest_price_inr": round(latest_close * usd_inr, 2),
        "usd_to_inr_rate": usd_inr,
        "statistics": stats
    }

def get_market_overview() -> List[MarketSummaryItem]:
    """Fetch current market snapshot for all 8 supported cryptocurrencies."""
    cache_key = "market_overview_all"
    cached = _get_from_cache(cache_key)
    if cached is not None:
        return cached

    usd_inr = get_usd_to_inr_rate()
    results: List[MarketSummaryItem] = []

    for symbol, meta in SUPPORTED_COINS.items():
        try:
            yf_symbol = meta.get("yf_symbol", symbol)
            ticker = yf.Ticker(yf_symbol)
            # Fetch recent 5 days to get 24h change and sparkline
            hist = ticker.history(period="5d", interval="1d")
            
            if not hist.empty and len(hist) >= 1:
                current_price = float(hist["Close"].iloc[-1])
                prev_price = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current_price
                change_24h = current_price - prev_price
                change_pct_24h = (change_24h / prev_price * 100.0) if prev_price != 0 else 0.0
                high_24h = float(hist["High"].iloc[-1])
                low_24h = float(hist["Low"].iloc[-1])
                volume_24h = float(hist["Volume"].iloc[-1])
                
                # Fetch hourly data for smoother sparkline
                spark_hist = ticker.history(period="2d", interval="1h")
                if not spark_hist.empty and len(spark_hist) > 0:
                    sparkline = [round(float(val), 2) for val in spark_hist["Close"].dropna().tail(16).tolist()]
                else:
                    sparkline = [round(float(val), 2) for val in hist["Close"].dropna().tolist()]

                results.append(
                    MarketSummaryItem(
                        symbol=symbol,
                        ticker=meta["ticker"],
                        name=meta["name"],
                        color=meta["color"],
                        category=meta["category"],
                        current_price_usd=round(current_price, 4),
                        current_price_inr=round(current_price * usd_inr, 2),
                        price_change_24h=round(change_24h, 4),
                        price_change_percentage_24h=round(change_pct_24h, 2),
                        high_24h=round(high_24h, 4),
                        low_24h=round(low_24h, 4),
                        volume_24h=round(volume_24h, 2),
                        sparkline=sparkline
                    )
                )
            else:
                results.append(
                    MarketSummaryItem(
                        symbol=symbol,
                        ticker=meta["ticker"],
                        name=meta["name"],
                        color=meta["color"],
                        category=meta["category"],
                        current_price_usd=0.0,
                        current_price_inr=0.0,
                        price_change_24h=0.0,
                        price_change_percentage_24h=0.0,
                        high_24h=0.0,
                        low_24h=0.0,
                        volume_24h=0.0,
                        sparkline=[]
                    )
                )
        except Exception as e:
            logger.error(f"Error fetching overview for {symbol}: {e}")
            results.append(
                MarketSummaryItem(
                    symbol=symbol,
                    ticker=meta["ticker"],
                    name=meta["name"],
                    color=meta["color"],
                    category=meta["category"],
                    current_price_usd=0.0,
                    current_price_inr=0.0,
                    price_change_24h=0.0,
                    price_change_percentage_24h=0.0,
                    high_24h=0.0,
                    low_24h=0.0,
                    volume_24h=0.0,
                    sparkline=[]
                )
            )

    _set_in_cache(cache_key, results)
    return results
