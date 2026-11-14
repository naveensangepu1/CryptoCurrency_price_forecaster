"""
Shared test setup.

The app gets every price from Yahoo Finance through ``yfinance.Ticker``. Tests must not
depend on the network (slow, rate-limited, and the numbers change every minute), so
``yfinance.Ticker`` is replaced with a fake that returns made-up but predictable prices.
Everything else (routes, caching, currency conversion, the regression) runs for real.

Fake prices: each coin closes at 100, 101, 102 ... (one dollar higher per row) and
USD/INR is fixed at 83.0. A straight line fits that perfectly, which makes the
forecast easy to check by hand.
"""

import numpy as np
import pandas as pd
import pytest
import yfinance
from fastapi.testclient import TestClient

from app.main import app
from app.services import currency, market_data

FAKE_USD_INR = 83.0
FAKE_LAST_DAY = "2026-01-31"

# Rows returned for each yfinance `period`.
_ROWS = {"2d": 48, "5d": 5, "7d": 7 * 24, "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "max": 520}


class FakeTicker:
    def __init__(self, symbol: str):
        self.symbol = symbol

    def history(self, period: str = "1mo", interval: str = "1d", **_kwargs) -> pd.DataFrame:
        rows = _ROWS.get(period, 30)
        if interval == "1h":
            index = pd.date_range(end=f"{FAKE_LAST_DAY} 23:00", periods=rows, freq="h", name="Datetime")
        elif interval == "1wk":
            index = pd.date_range(end=FAKE_LAST_DAY, periods=rows, freq="W", name="Date")
        else:
            index = pd.date_range(end=FAKE_LAST_DAY, periods=rows, freq="D", name="Date")

        # Weekly ranges can come out one row shorter than asked, so size from the index.
        n = len(index)
        if self.symbol == "USDINR=X":
            close = np.full(n, FAKE_USD_INR)
        else:
            close = 100.0 + np.arange(n, dtype=float)

        return pd.DataFrame(
            {"Open": close - 0.5, "High": close + 1.0, "Low": close - 1.0, "Close": close, "Volume": 1_000.0},
            index=index,
        )


@pytest.fixture(autouse=True)
def fake_yahoo(monkeypatch):
    """Swap in the fake ticker and start every test with empty caches."""
    monkeypatch.setattr(yfinance, "Ticker", FakeTicker)
    market_data._market_cache.clear()
    monkeypatch.setitem(currency._usd_inr_cache, "last_fetched", 0.0)
    yield


@pytest.fixture
def client():
    return TestClient(app)
