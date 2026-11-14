import time
import logging
import yfinance as yf
from ..config import DEFAULT_USD_INR_RATE

logger = logging.getLogger(__name__)

_usd_inr_cache = {
    "rate": DEFAULT_USD_INR_RATE,
    "last_fetched": 0.0
}
CACHE_TTL_SECONDS = 600  # 10 minutes

def get_usd_to_inr_rate() -> float:
    """Fetch current USD/INR exchange rate with caching and fallback."""
    now = time.time()
    if now - _usd_inr_cache["last_fetched"] < CACHE_TTL_SECONDS and _usd_inr_cache["rate"] > 0:
        return _usd_inr_cache["rate"]

    try:
        ticker = yf.Ticker("USDINR=X")
        history = ticker.history(period="5d")
        if not history.empty and "Close" in history:
            rate = float(history["Close"].dropna().iloc[-1])
            if rate > 0:
                _usd_inr_cache["rate"] = rate
                _usd_inr_cache["last_fetched"] = now
                return rate
    except Exception as e:
        logger.warning(f"Failed to fetch live USD/INR exchange rate: {e}. Using fallback rate: {DEFAULT_USD_INR_RATE}")

    return _usd_inr_cache["rate"]
